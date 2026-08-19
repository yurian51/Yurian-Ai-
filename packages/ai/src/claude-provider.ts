import Anthropic from '@anthropic-ai/sdk';
import type { AICompletionRequest, AICompletionResult, AIMessage, AIProvider } from './provider';

export interface ClaudeProviderConfig { apiKey: string; defaultModel: string; }

function toAnthropicMessages(messages: AIMessage[]): Anthropic.MessageParam[] {
  return messages.filter((message) => message.role === 'user' || message.role === 'assistant').map((message) => ({ role: message.role, content: message.content }));
}

export class ClaudeProvider implements AIProvider {
  readonly name = 'claude' as const;
  private readonly client: Anthropic;
  private readonly defaultModel: string;

  constructor(config: ClaudeProviderConfig) {
    if (!config.apiKey) throw new Error('Anthropic API key is required');
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.defaultModel = config.defaultModel;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResult> {
    const response = await this.client.messages.create({
      model: request.model || this.defaultModel,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature,
      system: request.messages.find((m) => m.role === 'system')?.content,
      messages: toAnthropicMessages(request.messages),
      tools: request.tools?.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema as Anthropic.Tool.InputSchema })) as Anthropic.Tool[],
    });
    const text = response.content.filter((block): block is Anthropic.TextBlock => block.type === 'text').map((block) => block.text).join('\n');
    const toolCalls = response.content.filter((block): block is Anthropic.ToolUseBlock => block.type === 'tool_use').map((block) => ({ id: block.id, name: block.name, input: block.input as Record<string, unknown> }));
    return {
      id: response.id,
      content: text,
      finishReason: toolCalls.length ? 'tool_use' : response.stop_reason === 'max_tokens' ? 'length' : 'stop',
      usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
      toolCalls: toolCalls.length ? toolCalls : undefined,
    };
  }

  async *stream(request: AICompletionRequest): AsyncIterable<unknown> {
    const stream = this.client.messages.stream({
      model: request.model || this.defaultModel,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature,
      system: request.messages.find((m) => m.role === 'system')?.content,
      messages: toAnthropicMessages(request.messages),
      tools: request.tools?.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema as Anthropic.Tool.InputSchema })) as Anthropic.Tool[],
    });
    for await (const event of stream) yield event;
  }
}
