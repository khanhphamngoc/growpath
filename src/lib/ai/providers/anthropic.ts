import Anthropic from '@anthropic-ai/sdk';
import type { AIMessage, AICompletionOptions, AICompletionResult, AIProvider } from '../types';

const MODEL_MAP = {
  synthesis: 'claude-sonnet-4-6',
  nudge: 'claude-haiku-4-5-20251001',
} as const;

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AICompletionResult> {
    const model = MODEL_MAP[options.model ?? 'synthesis'];
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');
    const conversation = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const response = await this.client.messages.create({
      model,
      max_tokens: options.maxTokens ?? 2048,
      ...(system && { system }),
      messages: conversation,
    });

    const content = response.content[0]?.type === 'text' ? response.content[0].text : '';
    return { content, provider: 'anthropic', model };
  }
}
