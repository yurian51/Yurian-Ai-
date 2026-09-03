import type { AICompletionRequest, AICompletionResult, AIMessage, AIToolDefinition, AIProvider } from './provider';

export interface AgentContext {
  userId: string;
  organizationId: string;
  workspaceId: string;
  conversationId: string;
}

export interface AgentOrchestrator {
  run(context: AgentContext, messages: AIMessage[], tools?: AIToolDefinition[]): Promise<AICompletionResult>;
}

export class DefaultAgentOrchestrator implements AgentOrchestrator {
  constructor(private readonly provider: AIProvider, private readonly model: string) {}

  run(context: AgentContext, messages: AIMessage[], tools: AIToolDefinition[] = []) {
    void context;
    const request: AICompletionRequest = {
      model: this.model,
      messages,
      tools,
      maxTokens: 4096,
    };
    return this.provider.complete(request);
  }
}
