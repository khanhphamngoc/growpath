import OpenAI from 'openai';
import type { AIMessage, AICompletionOptions, AICompletionResult, AIProvider } from '../types';

const MODEL_MAP = {
  synthesis: process.env.OLLAMA_SYNTHESIS_MODEL ?? 'qwen3.5:9b',
  nudge: process.env.OLLAMA_NUDGE_MODEL ?? 'llama3.2:3b',
};

export class OllamaProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434/v1',
      apiKey: 'ollama',
    });
  }

  async complete(messages: AIMessage[], options: AICompletionOptions = {}): Promise<AICompletionResult> {
    const model = MODEL_MAP[options.model ?? 'synthesis'];

    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: options.maxTokens ?? 2048,
      temperature: options.temperature ?? 0.7,
    });

    const content = response.choices[0]?.message?.content ?? '';
    return { content, provider: 'ollama', model };
  }
}
