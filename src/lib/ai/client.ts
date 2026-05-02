import type { AIProvider } from './types';
import { AnthropicProvider } from './providers/anthropic';
import { OllamaProvider } from './providers/ollama';

function createAIClient(): AIProvider {
  // AI_PROVIDER env var takes precedence; falls back to ollama in dev, anthropic in prod
  const provider = process.env.AI_PROVIDER ?? (process.env.NODE_ENV === 'development' ? 'ollama' : 'anthropic');

  if (provider === 'ollama') {
    return new OllamaProvider();
  }

  return new AnthropicProvider();
}

export const ai = createAIClient();
