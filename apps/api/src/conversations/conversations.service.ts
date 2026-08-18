import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@yurian/database';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ConversationsService {
  private async assertWorkspace(principal: AuthenticatedPrincipal, workspaceId: string) {
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, organizationId: principal.organizationId },
      select: { id: true },
    });
    if (!workspace) throw new ForbiddenException('Workspace access denied');
  }

  async create(principal: AuthenticatedPrincipal, workspaceId: string, dto: CreateConversationDto) {
    await this.assertWorkspace(principal, workspaceId);
    return prisma.conversation.create({
      data: { workspaceId, userId: principal.userId, title: dto.title?.trim() || 'New conversation' },
    });
  }

  async list(principal: AuthenticatedPrincipal, workspaceId: string) {
    await this.assertWorkspace(principal, workspaceId);
    return prisma.conversation.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 50 } },
    });
  }

  async sendMessage(principal: AuthenticatedPrincipal, conversationId: string, dto: SendMessageDto) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, workspace: { organizationId: principal.organizationId } },
      select: { id: true },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');

    return prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: { conversationId, role: 'USER', content: dto.content.trim() },
      });
      await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return message;
    });
  }
}
