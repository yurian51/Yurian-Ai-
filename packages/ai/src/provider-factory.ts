import type { AIProvider, AIProviderName } from './provider';

export type AIProviderFactory = (name: AIProviderName) => AIProvider;

export function createProviderRegistry(providers: AIProvider[]): Map<AIProviderName, AIProvider> {
  return new Map(providers.map((provider) => [provider.name, provider]));
}
