/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Main Module Exports
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Complete AI engine with:
 * - 12 specialized agents (generate, expand, summarize, analyze, organize,
 *   research, hypothesize, task_convert, chat, critique, connect, visualize)
 * - Advanced prompt system with guardrails and chain-of-thought
 * - Multi-factor model selection (Haiku, Sonnet, Opus)
 * - Prompt caching and token optimization
 * - Streaming SSE support
 * - Memory & context management
 * - Cost tracking and rate limiting
 * - Comprehensive tool definitions for structured output
 */

// ═══ Core ═══
export type {
  AgentType,
  ModelId,
  ModelTier,
  AgentConfig,
  ToolDefinition,
  ContentBlock,
  ConversationMessage,
  ComplexityLevel,
} from './core/types';

export { MODEL_REGISTRY, AGENT_REGISTRY } from './core/constants';
export { ClaudeClient } from './core/client';
export { selectModel, analyzeComplexity, getModelConfig } from './core/models';

// ═══ Orchestrator ═══
export { NeuralOrchestrator, getOrchestrator, resetOrchestrator } from './orchestrator/index';
export type { OrchestratorInput, OrchestratorOutput } from './orchestrator/index';

// ═══ Agents ═══
export { BaseAgent, createAgent, getAvailableAgents, getAgentInfo } from './agents';
export type { AgentInput, AgentOutput, ToolCallResult } from './agents';

// ═══ Tools ═══
export { getToolsForAgent, getAllTools, getToolsByCategory, TOOL_REGISTRY } from './tools/definitions';

// ═══ Prompts ═══
export { buildSystemPrompt, buildUserPrompt, buildMapContext } from './prompts/index';

// ═══ Streaming ═══
export { SSEWriter, executeWithStreaming } from './streaming';

// ═══ Memory ═══
export {
  conversationMemory,
  estimateTokens,
  estimateMessagesTokens,
  calculateContextBudget,
  truncateHistory,
} from './memory';

// ═══ Middleware ═══
export { aiMiddleware, aiRateLimiter, contentFilter, costTracker, validateAIRequest } from './middleware';

// ═══ Legacy compatibility ═══
// Re-export the old orchestrator for backward compatibility during migration
export { aiOrchestrator, AIAgentType } from './orchestrator.legacy';

