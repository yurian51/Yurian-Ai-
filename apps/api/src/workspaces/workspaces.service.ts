import { ConflictException, Injectable } from '@nestjs/common';
import { prisma } from '@yurian/database';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import type { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  async create(principal: AuthenticatedPrincipal, dto: CreateWorkspaceDto) {
    const slug = dto.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const exists = await prisma.workspace.findFirst({
      where: { organizationId: principal.organizationId, slug },
      select: { id: true },
    });
    if (exists) throw new ConflictException('Workspace slug already exists');

    return prisma.workspace.create({
      data: {
        organizationId: principal.organizationId,
        name: dto.name.trim(),
        slug,
      },
    });
  }

  list(principal: AuthenticatedPrincipal) {
    return prisma.workspace.findMany({
      where: { organizationId: principal.organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  getById(principal: AuthenticatedPrincipal, workspaceId: string) {
    return prisma.workspace.findFirstOrThrow({
      where: { id: workspaceId, organizationId: principal.organizationId },
    });
  }
}
