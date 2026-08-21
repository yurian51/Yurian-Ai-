import { ForbiddenException, Injectable } from '@nestjs/common';
import { prisma } from '@yurian/database';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import type { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TasksService {
  async create(principal: AuthenticatedPrincipal, workspaceId: string, dto: CreateTaskDto) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId: principal.organizationId },
      select: { id: true },
    });
    if (!workspace) throw new ForbiddenException('Workspace access denied');

    const task = await prisma.task.create({
      data: {
        organizationId: principal.organizationId,
        workspaceId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId: principal.organizationId,
        workspaceId,
        userId: principal.userId,
        action: 'TASK_CREATED',
        resourceType: 'Task',
        resourceId: task.id,
      },
    });

    return task;
  }

  async list(principal: AuthenticatedPrincipal, workspaceId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId: principal.organizationId },
      select: { id: true },
    });
    if (!workspace) throw new ForbiddenException('Workspace access denied');

    return prisma.task.findMany({
      where: { organizationId: principal.organizationId, workspaceId },
      orderBy: [{ completed: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
    });
  }
}
