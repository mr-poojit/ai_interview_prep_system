import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { config } from '../../config.js';

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
}

export class LlmClient {
  private geminiClient: GoogleGenerativeAI | null = null;
  private groqClient: Groq | null = null;
  private lastRequestTime = 0;
  private minIntervalMs = 600; // Throttle to prevent burst 429s

  constructor() {
    if (config.geminiApiKey) {
      this.geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
    }
    if (config.groqApiKey) {
      this.groqClient = new Groq({ apiKey: config.groqApiKey });
    }
  }

  /**
   * Enforces a minimum interval between outbound LLM calls to respect provider RPM limits
   */
  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.minIntervalMs) {
      await new Promise((resolve) => setTimeout(resolve, this.minIntervalMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Cleans model output by stripping markdown fences (```json ... ```)
   */
  public cleanJsonResponse(raw: string): string {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    return cleaned.trim();
  }

  /**
   * Main completion method with exponential backoff and jitter on rate limits
   */
  public async complete(prompt: string, systemPrompt?: string, options: CompletionOptions = {}): Promise<string> {
    const provider = config.llmProvider;

    if (provider === 'mock' || (!this.geminiClient && !this.groqClient)) {
      throw new Error('NO_LLM_KEY_CONFIGURED');
    }

    const maxRetries = 5;
    let baseDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.throttle();

        if (provider === 'groq' && this.groqClient) {
          return await this.callGroq(prompt, systemPrompt, options);
        } else if (this.geminiClient) {
          return await this.callGemini(prompt, systemPrompt, options);
        } else if (this.groqClient) {
          return await this.callGroq(prompt, systemPrompt, options);
        } else {
          throw new Error('No LLM client available');
        }
      } catch (err: unknown) {
        const error = err as { status?: number; message?: string; toString?: () => string };
        const errorMessage = (error.message || error.toString?.() || '').toLowerCase();
        const isRateLimit =
          error.status === 429 ||
          errorMessage.includes('rate limit') ||
          errorMessage.includes('too many requests') ||
          errorMessage.includes('quota') ||
          errorMessage.includes('resource_exhausted') ||
          errorMessage.includes('slow down');

        if (isRateLimit && attempt < maxRetries) {
          const jitter = Math.floor(Math.random() * 800);
          const waitTime = baseDelay + jitter;
          console.warn(
            `[LlmClient] Rate limit hit (attempt ${attempt}/${maxRetries}). Backing off for ${waitTime}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          baseDelay *= 2; // Exponential backoff
          continue;
        }

        // If not rate limit or max retries exceeded, rethrow
        throw err;
      }
    }

    throw new Error('Exceeded max retries for LLM completion');
  }

  private async callGemini(prompt: string, systemPrompt?: string, options: CompletionOptions = {}): Promise<string> {
    if (!this.geminiClient) throw new Error('Gemini client not initialized');

    const modelName = config.geminiModel || 'gemini-2.5-flash';
    const model = this.geminiClient.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 3500,
        responseMimeType: options.jsonMode ? 'application/json' : 'text/plain',
      },
      systemInstruction: systemPrompt ? { role: 'system', parts: [{ text: systemPrompt }] } : undefined,
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  private async callGroq(prompt: string, systemPrompt?: string, options: CompletionOptions = {}): Promise<string> {
    if (!this.groqClient) throw new Error('Groq client not initialized');

    const modelName = config.groqModel || 'llama-3.3-70b-versatile';
    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const completion = await this.groqClient.chat.completions.create({
      model: modelName,
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 3500,
      response_format: options.jsonMode ? { type: 'json_object' } : undefined,
    });

    return completion.choices[0]?.message?.content || '';
  }
}

export const llmClient = new LlmClient();
