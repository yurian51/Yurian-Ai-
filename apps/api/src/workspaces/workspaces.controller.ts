import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentPrincipal } from '../tenancy/tenant.decorator';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('workspaces')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  list(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    return this.workspaces.list(principal);
  }

  @Post()
  create(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(principal, dto);
  }

  @Get(':workspaceId')
  get(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('workspaceId') workspaceId: string) {
    return this.workspaces.getById(principal, workspaceId);
  }
}
