import { Injectable } from '@nestjs/common';
import { prisma } from '@yurian/database';

export interface ToolExecutionContext {
  userId: string;
  organizationId: string;
  workspaceId: string;
  traceId: string;
}

export type ToolHandler = (input: Record<string, unknown>, context: ToolExecutionContext) => Promise<unknown>;

@Injectable()
export class ToolRegistryService {
  private readonly handlers = new Map<string, ToolHandler>();

  register(name: string, handler: ToolHandler) {
    if (this.handlers.has(name)) throw new Error(`Tool handler already registered: ${name}`);
    this.handlers.set(name, handler);
  }

  async list(workspaceId: string, organizationId: string) {
    return prisma.tool.findMany({ where: { enabled: true, OR: [{ permissions: { equals: [] } }, { permissions: { path: ['workspaceIds'], array_contains: workspaceId } }], }, orderBy: { name: 'asc' } });
  }

  async execute(name: string, input: Record<string, unknown>, context: ToolExecutionContext) {
    const tool = await prisma.tool.findUnique({ where: { name } });
    if (!tool || !tool.enabled) throw new Error('Tool is unavailable');
    if (!context.organizationId || !context.workspaceId || !context.userId) throw new Error('Invalid tool execution context');
    const handler = this.handlers.get(name);
    if (!handler) throw new Error(`No execution handler registered for tool: ${name}`);
    return handler(input, context);
  }
}
