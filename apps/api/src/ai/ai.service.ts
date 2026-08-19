import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClaudeProvider } from '@yurian/ai';

@Injectable()
export class AiService {
  private readonly claude: ClaudeProvider;

  constructor(config: ConfigService) {
    this.claude = new ClaudeProvider({
      apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
      defaultModel: config.get<string>('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-20250514',
    });
  }

  async complete(request: Parameters<ClaudeProvider['complete']>[0]) {
    try {
      return await this.claude.complete(request);
    } catch (error) {
      throw new ServiceUnavailableException('AI provider is temporarily unavailable', { cause: error as Error });
    }
  }
}
