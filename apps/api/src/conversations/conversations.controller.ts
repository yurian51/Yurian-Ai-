import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import { CurrentPrincipal } from '../tenancy/tenant.decorator';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConversationsService } from './conversations.service';

@ApiTags('conversations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('workspaces/:workspaceId/conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentPrincipal() principal: AuthenticatedPrincipal, @Param('workspaceId') workspaceId: string) {
    return this.conversations.list(principal, workspaceId);
  }

  @Post()
  create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversations.create(principal, workspaceId, dto);
  }

  @Post(':conversationId/messages')
  sendMessage(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversations.sendMessage(principal, conversationId, dto);
  }
}
