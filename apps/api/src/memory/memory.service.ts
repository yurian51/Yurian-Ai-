import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@yurian/database';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import type { CreateMemoryDto } from './dto/create-memory.dto';
import type { UpdateMemoryDto } from './dto/update-memory.dto';

@Injectable()
export class MemoryService {
  private async assertWorkspaceAccess(principal: AuthenticatedPrincipal, workspaceId?: string) {
    if (!workspaceId) return;
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId: principal.organizationId },
      select: { id: true },
    });
    if (!workspace) throw new ForbiddenException('Workspace access denied');
  }

  async create(principal: AuthenticatedPrincipal, dto: CreateMemoryDto, workspaceId?: string) {
    await this.assertWorkspaceAccess(principal, workspaceId);

    const memory = await prisma.memory.create({
      data: {
        organizationId: principal.organizationId,
        workspaceId: workspaceId ?? null,
        userId: principal.userId,
        type: dto.type,
        content: dto.content.trim(),
        source: dto.source?.trim() || null,
        confidence: dto.confidence ?? 0.5,
        importance: dto.importance ?? 0.5,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        workspaceId: workspaceId ?? null,
        userId: principal.userId,
        action: 'MEMORY_CREATED',
        resourceType: 'Memory',
        resourceId: memory.id,
      },
    });

    return memory;
  }

  async list(principal: AuthenticatedPrincipal, workspaceId?: string) {
    await this.assertWorkspaceAccess(principal, workspaceId);
    return prisma.memory.findMany({
      where: {
        organizationId: principal.organizationId,
        ...(workspaceId ? { workspaceId } : {}),
        OR: [{ userId: principal.userId }, ...(workspaceId ? [{ workspaceId }] : [])],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }],
      },
      orderBy: [{ importance: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async update(principal: AuthenticatedPrincipal, id: string, dto: UpdateMemoryDto) {
    const existing = await prisma.memory.findFirst({
      where: { id, organizationId: principal.organizationId, userId: principal.userId },
      select: { id: true, workspaceId: true },
    });
    if (!existing) throw new NotFoundException('Memory not found');

    await this.assertWorkspaceAccess(principal, existing.workspaceId ?? undefined);

    const memory = await prisma.memory.update({
      where: { id },
      data: {
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.source !== undefined ? { source: dto.source?.trim() || null } : {}),
        ...(dto.confidence !== undefined ? { confidence: dto.confidence } : {}),
        ...(dto.importance !== undefined ? { importance: dto.importance } : {}),
        ...(dto.expiresAt !== undefined ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null } : {}),
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        workspaceId: existing.workspaceId,
        userId: principal.userId,
        action: 'MEMORY_UPDATED',
        resourceType: 'Memory',
        resourceId: memory.id,
      },
    });

    return memory;
  }

  async remove(principal: AuthenticatedPrincipal, id: string) {
    const existing = await prisma.memory.findFirst({
      where: { id, organizationId: principal.organizationId, userId: principal.userId },
      select: { id: true, workspaceId: true },
    });
    if (!existing) throw new NotFoundException('Memory not found');

    await prisma.memory.delete({ where: { id } });
    await prisma.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        workspaceId: existing.workspaceId,
        userId: principal.userId,
        action: 'MEMORY_DELETED',
        resourceType: 'Memory',
        resourceId: id,
      },
    });

    return { deleted: true };
  }
}
