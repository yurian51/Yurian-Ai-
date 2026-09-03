import { ForbiddenException, Injectable } from '@nestjs/common';
import { prisma } from '@yurian/database';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import type { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  async create(principal: AuthenticatedPrincipal, workspaceId: string, dto: CreateProjectDto) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId: principal.organizationId },
      select: { id: true },
    });
    if (!workspace) throw new ForbiddenException('Workspace access denied');

    const project = await prisma.project.create({
      data: {
        organizationId: principal.organizationId,
        workspaceId,
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        workspaceId,
        userId: principal.userId,
        action: 'PROJECT_CREATED',
        resourceType: 'Project',
        resourceId: project.id,
      },
    });

    return project;
  }

  async list(principal: AuthenticatedPrincipal, workspaceId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId: principal.organizationId },
      select: { id: true },
    });
    if (!workspace) throw new ForbiddenException('Workspace access denied');

    return prisma.project.findMany({
      where: { organizationId: principal.organizationId, workspaceId },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
