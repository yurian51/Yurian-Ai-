import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import { CurrentPrincipal } from '../tenancy/tenant.decorator';
import { ApprovalDecisionDto } from './dto/approval-decision.dto';
import { ApprovalsService } from './approvals.service';

@ApiTags('approvals')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('workspaces/:workspaceId/approvals')
export class ApprovalsController {
  constructor(private readonly approvals: ApprovalsService) {}

  @Get()
  list(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('workspaceId') workspaceId: string) {
    return this.approvals.list(principal, workspaceId);
  }

  @Patch(':approvalId')
  decide(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('approvalId') approvalId: string, @Body() dto: ApprovalDecisionDto) {
    return this.approvals.decide(principal, approvalId, dto);
  }
}
