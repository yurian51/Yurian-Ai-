import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@yurian/database';
import { AiService } from '../ai/ai.service';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly ai: AiService) {}

  private async assertWorkspace(principal: AuthenticatedPrincipal, workspaceId: string) {
    const workspace = await prisma.workspace.findFirst({ where: { id: workspaceId, organizationId: principal.organizationId }, select: { id: true } });
    if (!workspace) throw new ForbiddenException('Workspace access denied');
  }

  async create(principal: AuthenticatedPrincipal, workspaceId: string, dto: CreateConversationDto) {
    await this.assertWorkspace(principal, workspaceId);
    return prisma.conversation.create({ data: { workspaceId, userId: principal.userId, title: dto.title?.trim() || 'New conversation' } });
  }

  async list(principal: AuthenticatedPrincipal, workspaceId: string) {
    await this.assertWorkspace(principal, workspaceId);
    return prisma.conversation.findMany({ where: { workspaceId }, orderBy: { updatedAt: 'desc' }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 100 } } });
  }

  async sendMessage(principal: AuthenticatedPrincipal, conversationId: string, dto: SendMessageDto) {
    const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, workspace: { organizationId: principal.organizationId } }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 100 } } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    const content = dto.content.trim();

    await prisma.$transaction(async (tx) => {
      await tx.message.create({ data: { conversationId, role: 'USER', content } });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    });

    const result = await this.ai.complete({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      messages: [...conversation.messages, { role: 'USER', content }].map((message) => ({ role: message.role.toLowerCase() as 'user' | 'assistant' | 'system' | 'tool', content: message.content })),
      maxTokens: 4096,
    });
    const assistant = await prisma.message.create({ data: { conversationId, role: 'ASSISTANT', content: result.content } });
    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    return { message: assistant, usage: result.usage, finishReason: result.finishReason, provider: 'claude' };
  }
}
