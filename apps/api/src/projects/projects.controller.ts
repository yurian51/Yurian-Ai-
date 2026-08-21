import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentPrincipal } from '../tenancy/tenant.decorator';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('workspaceId') workspaceId: string) {
    return this.projects.list(principal, workspaceId);
  }

  @Post()
  create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projects.create(principal, workspaceId, dto);
  }
}
