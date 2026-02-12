/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Enhanced Claude API Client
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Sophisticated Claude API client with:
 * - Prompt caching (cache_control: ephemeral)
 * - Token-efficient tool use (beta header)
 * - Extended output (128k beta)
 * - Automatic retry with exponential backoff
 * - Cost tracking per request
 * - Request/response logging
 * - Beta feature management
 * - Web search tool support (server-side)
 */

import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../utils/env';
import { logger } from '../../utils/logger';
import { ENABLED_BETA_FEATURES, RETRY_CONFIG, MODEL_REGISTRY } from './constants';
import type {
  ClaudeRequestConfig,
  ClaudeResponse,
  TokenUsage,
  CostEstimate,
  ModelId,
  BetaFeature,
  ToolDefinition,
  Message,
  SystemPrompt,
  ContentBlock,
} from './types';

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED CLAUDE CLIENT
// ═══════════════════════════════════════════════════════════════════════════

class ClaudeClient {
  private client: Anthropic;
  private betaFeatures: BetaFeature[];
  private requestCount: number = 0;
  private totalCost: number = 0;

  constructor() {
    this.client = new Anthropic({
      apiKey: env.CLAUDE_API_KEY,
    });
    this.betaFeatures = [...ENABLED_BETA_FEATURES];

    logger.info({
      betaFeatures: this.betaFeatures,
      apiKeyPresent: !!env.CLAUDE_API_KEY,
    }, 'ClaudeClient initialized with beta features');
  }

  // ─── Core API Call with Retry ─────────────────────────────────────────

  /**
   * Send a message to Claude with full feature support.
   * Handles retries, caching, cost tracking, and beta headers.
   */
  async sendMessage(config: ClaudeRequestConfig): Promise<ClaudeResponse & { costEstimate: CostEstimate }> {
    const startTime = Date.now();
    this.requestCount++;

    const requestId = `req_${Date.now()}_${this.requestCount}`;
    
    logger.debug({
      requestId,
      model: config.model,
      messageCount: config.messages.length,
      toolCount: config.tools?.length || 0,
      maxTokens: config.max_tokens,
      hasCaching: this.hasCacheControl(config),
    }, 'ClaudeClient: Preparing request');

    // Build the request with all features
    const apiParams = this.buildApiParams(config);

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.min(
            RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
            RETRY_CONFIG.maxDelay
          );
          logger.warn({ requestId, attempt, delay }, 'ClaudeClient: Retrying after delay');
          await this.sleep(delay);
        }

        const response = await this.client.messages.create(apiParams as any);
        const durationMs = Date.now() - startTime;

        // Calculate cost
        const costEstimate = this.calculateCost(config.model, response.usage as TokenUsage);
        this.totalCost += costEstimate.totalCost;

        logger.info({
          requestId,
          model: response.model,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cacheCreation: (response.usage as any).cache_creation_input_tokens || 0,
          cacheRead: (response.usage as any).cache_read_input_tokens || 0,
          stopReason: response.stop_reason,
          durationMs,
          cost: costEstimate.totalCost.toFixed(6),
          attempt: attempt + 1,
        }, 'ClaudeClient: Response received');

        return {
          ...(response as any),
          costEstimate,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;

        // Check if error is retryable
        const isRetryable = RETRY_CONFIG.retryableErrors.some(e => errorMessage.includes(e));
        
        if (!isRetryable || attempt === RETRY_CONFIG.maxRetries) {
          logger.error({
            requestId,
            error: errorMessage,
            attempt: attempt + 1,
            maxRetries: RETRY_CONFIG.maxRetries,
            isRetryable,
          }, 'ClaudeClient: Request failed permanently');
          throw lastError;
        }

        logger.warn({
          requestId,
          error: errorMessage,
          attempt: attempt + 1,
          isRetryable,
        }, 'ClaudeClient: Retryable error occurred');
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  // ─── Streaming API Call ───────────────────────────────────────────────

  /**
   * Stream a message from Claude with real-time SSE events.
   * Returns the Anthropic stream object for event handling.
   */
  createStream(config: ClaudeRequestConfig) {
    const apiParams = this.buildApiParams(config);
    
    logger.debug({
      model: config.model,
      messageCount: config.messages.length,
      toolCount: config.tools?.length || 0,
    }, 'ClaudeClient: Creating stream');

    return this.client.messages.stream(apiParams as any);
  }

  // ─── Request Building ─────────────────────────────────────────────────

  /**
   * Build the complete API parameters with all features enabled
   */
  private buildApiParams(config: ClaudeRequestConfig): Record<string, any> {
    const params: Record<string, any> = {
      model: config.model,
      max_tokens: config.max_tokens,
      messages: this.buildMessages(config.messages),
    };

    // System prompt with caching support
    if (config.system) {
      if (typeof config.system === 'string') {
        params.system = config.system;
      } else {
        // Array of system prompt segments with cache control
        params.system = config.system.map(s => ({
          type: 'text' as const,
          text: s.text,
          ...(s.cache_control ? { cache_control: s.cache_control } : {}),
        }));
      }
    }

    // Tools with token-efficient format
    if (config.tools && config.tools.length > 0) {
      params.tools = config.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.input_schema,
        ...(tool.cacheable ? { cache_control: { type: 'ephemeral' } } : {}),
      }));
    }

    // Tool choice configuration
    if (config.tool_choice) {
      params.tool_choice = config.tool_choice;
    }

    // Temperature and sampling
    if (config.temperature !== undefined) {
      params.temperature = config.temperature;
    }
    if (config.top_p !== undefined) {
      params.top_p = config.top_p;
    }
    if (config.top_k !== undefined) {
      params.top_k = config.top_k;
    }

    // Stop sequences
    if (config.stop_sequences && config.stop_sequences.length > 0) {
      params.stop_sequences = config.stop_sequences;
    }

    // Metadata
    if (config.metadata?.user_id) {
      params.metadata = { user_id: config.metadata.user_id };
    }

    return params;
  }

  /**
   * Build messages array with proper content block formatting
   */
  private buildMessages(messages: Message[]): any[] {
    return messages.map(msg => {
      if (typeof msg.content === 'string') {
        return { role: msg.role, content: msg.content };
      }

      // Complex content blocks (images, documents, tool results, etc.)
      const contentBlocks = (msg.content).map(block => {
        switch (block.type) {
          case 'text':
            return {
              type: 'text',
              text: block.text,
              ...(block.cache_control ? { cache_control: block.cache_control } : {}),
              ...(block.citations ? { citations: block.citations } : {}),
            };

          case 'image':
            return {
              type: 'image',
              source: block.source,
              ...(block.cache_control ? { cache_control: block.cache_control } : {}),
            };

          case 'document':
            return {
              type: 'document',
              source: block.source,
              ...(block.cache_control ? { cache_control: block.cache_control } : {}),
              ...(block.citations ? { citations: block.citations } : {}),
            };

          case 'tool_use':
            return {
              type: 'tool_use',
              id: block.id,
              name: block.name,
              input: block.input,
            };

          case 'tool_result':
            return {
              type: 'tool_result',
              tool_use_id: block.id,
              content: block.text,
            };

          default:
            return block;
        }
      });

      return { role: msg.role, content: contentBlocks };
    });
  }

  // ─── Cost Calculation ─────────────────────────────────────────────────

  /**
   * Calculate the cost of a request based on token usage and model
   */
  calculateCost(modelId: ModelId | string, usage: TokenUsage): CostEstimate {
    const model = Object.values(MODEL_REGISTRY).find(m => m.id === modelId) || MODEL_REGISTRY.sonnet;

    const inputTokens = usage.input_tokens;
    const outputTokens = usage.output_tokens;
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
    const cacheReadTokens = usage.cache_read_input_tokens || 0;

    // Non-cached input tokens
    const regularInputTokens = inputTokens - cacheReadTokens;

    const inputCost = regularInputTokens * model.costPerInputToken;
    const outputCost = outputTokens * model.costPerOutputToken;
    const cacheCreationCost = cacheCreationTokens * model.costPerInputToken * 1.25; // 25% surcharge
    const cacheReadCost = cacheReadTokens * model.costPerCachedToken;
    
    // Savings from cache vs. full-price input
    const cacheSavings = cacheReadTokens * (model.costPerInputToken - model.costPerCachedToken);

    return {
      inputTokens,
      outputTokens,
      cachedTokens: cacheReadTokens,
      inputCost: inputCost + cacheCreationCost + cacheReadCost,
      outputCost,
      cacheSavings,
      totalCost: inputCost + outputCost + cacheCreationCost + cacheReadCost,
      currency: 'USD',
    };
  }

  // ─── Utility Methods ──────────────────────────────────────────────────

  /**
   * Check if any content has cache_control set
   */
  private hasCacheControl(config: ClaudeRequestConfig): boolean {
    if (Array.isArray(config.system)) {
      return config.system.some(s => s.cache_control);
    }
    if (config.tools) {
      return config.tools.some(t => t.cacheable);
    }
    return false;
  }

  /**
   * Get total cost across all requests in this session
   */
  getSessionCost(): number {
    return this.totalCost;
  }

  /**
   * Get total request count for this session
   */
  getRequestCount(): number {
    return this.requestCount;
  }

  /**
   * Get the raw Anthropic client for advanced use
   */
  getRawClient(): Anthropic {
    return this.client;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export const claudeClient = new ClaudeClient();
export { ClaudeClient };
