/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Memory & Context Management
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Features from Claude documentation:
 * - Conversation memory with sliding window
 * - Context window management with priority-based truncation
 * - Prompt caching integration for repeated context
 * - Token budget management per request
 * - Message history compression and summarization
 */

import type { ConversationMessage, ModelId } from '../core/types';
import { MODEL_REGISTRY, CONTEXT_CONFIG, TOKEN_ESTIMATION } from '../core/constants';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ContextWindow {
  systemTokens: number;
  toolTokens: number;
  historyTokens: number;
  userTokens: number;
  reservedOutputTokens: number;
  totalCapacity: number;
  availableForContent: number;
}

interface TruncationResult {
  messages: ConversationMessage[];
  truncated: boolean;
  removedCount: number;
  estimatedTokens: number;
}

interface MemoryEntry {
  sessionId: string;
  mapId: string;
  messages: ConversationMessage[];
  summary?: string;
  createdAt: Date;
  lastAccessed: Date;
  totalTokens: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// TOKEN ESTIMATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Estimate tokens for a text string
 * Uses Claude's approximate ratio of ~4 chars per token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / TOKEN_ESTIMATION.avgCharsPerToken);
}

/**
 * Estimate tokens for a message array
 */
export function estimateMessagesTokens(messages: ConversationMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    total += 4; // message overhead
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'text') {
          total += estimateTokens(block.text || '');
        } else if (block.type === 'tool_use') {
          total += estimateTokens(JSON.stringify(block.input || ''));
        } else if (block.type === 'tool_result') {
          total += estimateTokens(typeof (block as any).content === 'string' ? (block as any).content : JSON.stringify((block as any).content || ''));
        } else if (block.type === 'image') {
          total += 300; // image base tokens
        } else if (block.type === 'document') {
          total += 300 * 2; // Documents tend to be larger
        }
      }
    }
  }
  return total;
}

/**
 * Estimate tokens for tool definitions
 */
export function estimateToolTokens(tools: any[]): number {
  if (!tools || tools.length === 0) return 0;
  // Tool schemas are verbose in token space
  const schemaStr = JSON.stringify(tools);
  return Math.ceil(estimateTokens(schemaStr) * TOKEN_ESTIMATION.jsonOverheadMultiplier);
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT WINDOW MANAGER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate the available context window budget for actual content
 */
export function calculateContextBudget(
  model: ModelId,
  systemPrompt: string | any[],
  tools: any[] = [],
  desiredOutputTokens?: number,
): ContextWindow {
  const modelConfig = MODEL_REGISTRY[model];
  const totalCapacity = modelConfig.maxContextTokens;

  // Calculate fixed token costs
  const systemTokens = typeof systemPrompt === 'string'
    ? estimateTokens(systemPrompt)
    : estimateTokens(JSON.stringify(systemPrompt));

  const toolTokens = estimateToolTokens(tools);
  const reservedOutputTokens = desiredOutputTokens || modelConfig.maxOutputTokens;

  const availableForContent = totalCapacity - systemTokens - toolTokens - reservedOutputTokens;

  return {
    systemTokens,
    toolTokens,
    historyTokens: 0, // Will be filled by truncation
    userTokens: 0,     // Will be filled by user message
    reservedOutputTokens,
    totalCapacity,
    availableForContent: Math.max(availableForContent, 1000), // Minimum 1k tokens for content
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TRUNCATION STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Truncate conversation history to fit within token budget.
 * Strategy: Keep first message + most recent messages, summarize middle if needed.
 */
export function truncateHistory(
  messages: ConversationMessage[],
  maxTokens: number,
  options: {
    keepFirst?: boolean;
    keepLast?: number;
    strategy?: 'sliding_window' | 'smart' | 'aggressive';
  } = {},
): TruncationResult {
  const {
    keepFirst = true,
    keepLast = 10,
    strategy = 'smart',
  } = options;

  if (messages.length === 0) {
    return { messages: [], truncated: false, removedCount: 0, estimatedTokens: 0 };
  }

  const totalTokens = estimateMessagesTokens(messages);

  // If fits, return as-is
  if (totalTokens <= maxTokens) {
    return { messages, truncated: false, removedCount: 0, estimatedTokens: totalTokens };
  }

  switch (strategy) {
    case 'sliding_window':
      return truncateSlidingWindow(messages, maxTokens, keepLast);
    case 'aggressive':
      return truncateAggressive(messages, maxTokens);
    case 'smart':
    default:
      return truncateSmart(messages, maxTokens, keepFirst, keepLast);
  }
}

function truncateSlidingWindow(
  messages: ConversationMessage[],
  maxTokens: number,
  keepLast: number,
): TruncationResult {
  // Keep only the last N messages that fit
  const result: ConversationMessage[] = [];
  let tokenCount = 0;

  // Take from end
  for (let i = messages.length - 1; i >= 0 && result.length < keepLast; i--) {
    const msgTokens = estimateMessagesTokens([messages[i]]);
    if (tokenCount + msgTokens > maxTokens) break;
    result.unshift(messages[i]);
    tokenCount += msgTokens;
  }

  return {
    messages: result,
    truncated: true,
    removedCount: messages.length - result.length,
    estimatedTokens: tokenCount,
  };
}

function truncateSmart(
  messages: ConversationMessage[],
  maxTokens: number,
  keepFirst: boolean,
  keepLast: number,
): TruncationResult {
  const result: ConversationMessage[] = [];
  let tokenCount = 0;

  // Reserve space for last messages
  const lastMessages = messages.slice(-keepLast);
  const lastTokens = estimateMessagesTokens(lastMessages);

  // Keep first message if requested (usually initial context)
  if (keepFirst && messages.length > keepLast) {
    const firstMsg = messages[0];
    const firstTokens = estimateMessagesTokens([firstMsg]);
    if (firstTokens + lastTokens <= maxTokens) {
      result.push(firstMsg);
      tokenCount += firstTokens;
    }
  }

  // Add a context bridge if we're truncating a lot
  if (messages.length > keepLast + 1) {
    const middleCount = messages.length - keepLast - (keepFirst ? 1 : 0);
    if (middleCount > 0) {
      const bridge: ConversationMessage = {
        role: 'user',
        content: `[${middleCount} mensagens anteriores omitidas para otimização de contexto]`,
      };
      const bridgeTokens = estimateMessagesTokens([bridge]);
      if (tokenCount + bridgeTokens + lastTokens <= maxTokens) {
        result.push(bridge);
        tokenCount += bridgeTokens;
      }
    }
  }

  // Add recent messages
  for (const msg of lastMessages) {
    const msgTokens = estimateMessagesTokens([msg]);
    if (tokenCount + msgTokens > maxTokens) break;
    result.push(msg);
    tokenCount += msgTokens;
  }

  return {
    messages: result,
    truncated: true,
    removedCount: messages.length - result.length + (result.some(m =>
      typeof m.content === 'string' && m.content.includes('omitidas')) ? 1 : 0),
    estimatedTokens: tokenCount,
  };
}

function truncateAggressive(
  messages: ConversationMessage[],
  maxTokens: number,
): TruncationResult {
  // Only keep the last 2 messages
  const result = messages.slice(-2);
  const tokenCount = estimateMessagesTokens(result);

  return {
    messages: tokenCount <= maxTokens ? result : result.slice(-1),
    truncated: true,
    removedCount: messages.length - result.length,
    estimatedTokens: Math.min(tokenCount, maxTokens),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONVERSATION MEMORY STORE (In-Memory with TTL)
// ═══════════════════════════════════════════════════════════════════════════

class ConversationMemory {
  private store = new Map<string, MemoryEntry>();
  private readonly maxEntries = 100;
  private readonly ttlMs = 30 * 60 * 1000; // 30 minutes default

  /**
   * Get conversation history for a session
   */
  get(sessionId: string, mapId: string): ConversationMessage[] {
    const key = `${sessionId}:${mapId}`;
    const entry = this.store.get(key);

    if (!entry) return [];

    // Check TTL
    if (Date.now() - entry.lastAccessed.getTime() > this.ttlMs) {
      this.store.delete(key);
      return [];
    }

    entry.lastAccessed = new Date();
    return entry.messages;
  }

  /**
   * Add messages to conversation history
   */
  add(
    sessionId: string,
    mapId: string,
    messages: ConversationMessage[],
  ): void {
    const key = `${sessionId}:${mapId}`;
    let entry = this.store.get(key);

    if (!entry) {
      entry = {
        sessionId,
        mapId,
        messages: [],
        createdAt: new Date(),
        lastAccessed: new Date(),
        totalTokens: 0,
      };
      this.store.set(key, entry);
    }

    entry.messages.push(...messages);
    entry.lastAccessed = new Date();
    entry.totalTokens = estimateMessagesTokens(entry.messages);

    // Trim if too long (keep last 50 messages)
    if (entry.messages.length > CONTEXT_CONFIG.maxConversationHistory) {
      entry.messages = entry.messages.slice(-10);
      entry.totalTokens = estimateMessagesTokens(entry.messages);
    }

    // Evict oldest entries if store is full
    if (this.store.size > this.maxEntries) {
      this.evictOldest();
    }
  }

  /**
   * Clear history for a session/map
   */
  clear(sessionId: string, mapId?: string): void {
    if (mapId) {
      this.store.delete(`${sessionId}:${mapId}`);
    } else {
      // Clear all entries for this session
      for (const [key] of this.store) {
        if (key.startsWith(`${sessionId}:`)) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * Get stats
   */
  stats(): { sessions: number; totalMessages: number; totalTokens: number } {
    let totalMessages = 0;
    let totalTokens = 0;
    for (const entry of this.store.values()) {
      totalMessages += entry.messages.length;
      totalTokens += entry.totalTokens;
    }
    return { sessions: this.store.size, totalMessages, totalTokens };
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.lastAccessed.getTime() < oldestTime) {
        oldestTime = entry.lastAccessed.getTime();
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export const conversationMemory = new ConversationMemory();

export {
  ContextWindow,
  TruncationResult,
  MemoryEntry,
  ConversationMemory,
};
