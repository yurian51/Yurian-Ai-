import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
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
    const conversation = await prisma.conversation.create({ data: { workspaceId, userId: principal.userId, title: dto.title?.trim() || 'New conversation' } });
    await prisma.auditLog.create({ data: { organizationId: principal.organizationId, workspaceId, userId: principal.userId, action: 'CONVERSATION_CREATED', resourceType: 'Conversation', resourceId: conversation.id } });
    return conversation;
  }

  async list(principal: AuthenticatedPrincipal, workspaceId: string) {
    await this.assertWorkspace(principal, workspaceId);
    return prisma.conversation.findMany({ where: { workspaceId }, orderBy: { updatedAt: 'desc' }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 100 } } });
  }

  async sendMessage(principal: AuthenticatedPrincipal, conversationId: string, dto: SendMessageDto) {
    const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, workspace: { organizationId: principal.organizationId } }, include: { messages: { orderBy: { createdAt: 'asc' }, take: 100 } } });
    if (!conversation) throw new NotFoundException('Conversation not found');
    const content = dto.content.trim();
    const traceId = randomUUID();

    await prisma.$transaction(async (tx) => {
      await tx.message.create({ data: { conversationId, role: 'USER', content } });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    });

    try {
      const result = await this.ai.complete({
        model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514',
        messages: [...conversation.messages, { role: 'USER', content }].map((message) => ({ role: message.role.toLowerCase() as 'user' | 'assistant' | 'system' | 'tool', content: message.content })),
        maxTokens: 4096,
      });
      const assistant = await prisma.message.create({ data: { conversationId, role: 'ASSISTANT', content: result.content } });
      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      await prisma.auditLog.create({ data: { organizationId: principal.organizationId, workspaceId: conversation.workspaceId, userId: principal.userId, action: 'AI_RESPONSE_COMPLETED', resourceType: 'Conversation', resourceId: conversationId, traceId, metadata: { provider: 'claude', usage: result.usage, finishReason: result.finishReason } } });
      return { message: assistant, usage: result.usage, finishReason: result.finishReason, provider: 'claude', traceId };
    } catch (error) {
      await prisma.auditLog.create({ data: { organizationId: principal.organizationId, workspaceId: conversation.workspaceId, userId: principal.userId, action: 'AI_RESPONSE_FAILED', resourceType: 'Conversation', resourceId: conversationId, traceId, metadata: { provider: 'claude', error: error instanceof Error ? error.message : 'unknown' } } });
      throw error;
    }
  }
}
