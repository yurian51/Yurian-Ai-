export type AIProviderName = 'claude' | 'openai' | 'gemini' | 'local' | 'custom';

export type AIMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface AICompletionRequest {
  model: string;
  messages: AIMessage[];
  tools?: AIToolDefinition[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd?: number;
}

export interface AICompletionResult {
  id: string;
  content: string;
  finishReason: 'stop' | 'tool_use' | 'length' | 'error';
  usage: AIUsage;
}

export interface AIProvider {
  readonly name: AIProviderName;
  complete(request: AICompletionRequest): Promise<AICompletionResult>;
  stream(request: AICompletionRequest): AsyncIterable<unknown>;
}
