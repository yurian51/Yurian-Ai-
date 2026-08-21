import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { UpdateMemoryDto } from './dto/update-memory.dto';
import { MemoryService } from './memory.service';
import type { AuthenticatedPrincipal } from '../auth/auth.types';

@ApiTags('Memory')
@ApiBearerAuth()
@Controller('api/v1/memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  @Get()
  list(@Req() req: Request, @Query('workspaceId') workspaceId?: string) {
    return this.memoryService.list(req.user as AuthenticatedPrincipal, workspaceId);
  }

  @Post()
  create(@Req() req: Request, @Query('workspaceId') workspaceId: string | undefined, @Body() dto: CreateMemoryDto) {
    return this.memoryService.create(req.user as AuthenticatedPrincipal, dto, workspaceId);
  }

  @Patch(':id')
  update(@Req() req: Request, @Param('id') id: string, @Body() dto: UpdateMemoryDto) {
    return this.memoryService.update(req.user as AuthenticatedPrincipal, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    return this.memoryService.remove(req.user as AuthenticatedPrincipal, id);
  }
}
