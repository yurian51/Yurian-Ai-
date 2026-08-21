import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';
import type { AuthenticatedPrincipal } from '../auth/auth.types';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('api/v1/workspaces/:workspaceId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(@Req() req: Request, @Param('workspaceId') workspaceId: string) {
    return this.tasksService.list(req.user as AuthenticatedPrincipal, workspaceId);
  }

  @Post()
  create(@Req() req: Request, @Param('workspaceId') workspaceId: string, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(req.user as AuthenticatedPrincipal, workspaceId, dto);
  }
}
