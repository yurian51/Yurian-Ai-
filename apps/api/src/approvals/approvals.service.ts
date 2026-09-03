import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@yurian/database';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import type { ApprovalDecisionDto } from './dto/approval-decision.dto';

@Injectable()
export class ApprovalsService {
  list(principal: AuthenticatedPrincipal, workspaceId: string) {
    return prisma.approval.findMany({ where: { workspaceId, userId: principal.userId, workspace: { organizationId: principal.organizationId } }, orderBy: { createdAt: 'desc' } });
  }

  async decide(principal: AuthenticatedPrincipal, approvalId: string, dto: ApprovalDecisionDto) {
    const approval = await prisma.approval.findFirst({ where: { id: approvalId, userId: principal.userId, workspace: { organizationId: principal.organizationId } } });
    if (!approval) throw new NotFoundException('Approval request not found');
    if (approval.status !== 'PENDING') throw new ForbiddenException('Approval request is no longer actionable');
    if (approval.expiresAt && approval.expiresAt <= new Date()) {
      await prisma.approval.update({ where: { id: approval.id }, data: { status: 'EXPIRED' } });
      throw new ForbiddenException('Approval request has expired');
    }

    const updated = await prisma.approval.update({ where: { id: approval.id }, data: { status: dto.status, approvedBy: principal.userId } });
    await prisma.auditLog.create({ data: { organizationId: principal.organizationId, workspaceId: approval.workspaceId, userId: principal.userId, action: `APPROVAL_${dto.status}`, resourceType: 'Approval', resourceId: approval.id, metadata: { requestedAction: approval.requestedAction, riskLevel: approval.riskLevel } } });
    return updated;
  }
}
