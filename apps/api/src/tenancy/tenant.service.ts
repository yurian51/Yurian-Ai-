import { ForbiddenException, Injectable } from '@nestjs/common';
import { prisma } from '@yurian/database';
import type { AuthenticatedPrincipal } from '../auth/auth.types';

@Injectable()
export class TenantService {
  async assertWorkspaceAccess(principal: AuthenticatedPrincipal, workspaceId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        organizationId: principal.organizationId,
      },
      select: { id: true, organizationId: true },
    });
    if (!workspace) throw new ForbiddenException('Workspace access denied');
    return workspace;
  }
}
