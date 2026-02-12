/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Base Agent Class
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Base class for all NeuralMap AI agents. Provides:
 * - Standard execution pipeline 
 * - Tool handling and result processing
 * - Streaming support
 * - Error handling and retries
 * - Cost tracking
 * - Response parsing
 */

import type {
  AgentType,
  AgentConfig,
  ModelId,
  ClaudeResponse,
  ToolDefinition,
  ConversationMessage,
  OrchestratorResult,
} from '../core/types';
import { AGENT_REGISTRY } from '../core/constants';
import { ClaudeClient } from '../core/client';
import { selectModel, analyzeComplexity } from '../core/models';
import { buildSystemPrompt, buildUserPrompt } from '../prompts/index';
import { getToolsForAgent } from '../tools/definitions';
import {
  estimateTokens,
  estimateMessagesTokens,
  calculateContextBudget,
  truncateHistory,
  conversationMemory,
} from '../memory';
import { logger } from '../../utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface AgentInput {
  message?: string;
  prompt?: string;
  mapId: string;
  userId: string;
  sessionId?: string;

  // Map context
  nodes?: any[];
  existing_nodes?: any[];
  edges?: any[];
  selected_node?: any;
  node?: any;
  parent?: any;
  siblings?: any[];
  map_title?: string;
  map_description?: string;

  // Chat
  conversation_history?: ConversationMessage[];

  // Options
  options?: Record<string, any>;
  model_override?: ModelId;
  stream?: boolean;
}

export interface AgentOutput {
  success: boolean;
  agent: AgentType;
  model: ModelId;
  content: string;
  toolCalls: ToolCallResult[];
  thinking?: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens?: number;
    cacheReadTokens?: number;
    costUSD: number;
  };
  metadata: {
    complexity: number;
    executionTimeMs: number;
    truncated: boolean;
    retries: number;
  };
}

export interface ToolCallResult {
  toolName: string;
  toolId: string;
  input: any;
  output?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE AGENT CLASS
// ═══════════════════════════════════════════════════════════════════════════

export class BaseAgent {
  protected config: AgentConfig;
  protected client: ClaudeClient;
  protected agentType: AgentType;

  constructor(agentType: AgentType, client: ClaudeClient) {
    this.agentType = agentType;
    this.client = client;
    this.config = AGENT_REGISTRY[agentType] || AGENT_REGISTRY.chat;
  }

  /**
   * Main execution method — runs the full agent pipeline
   */
  async execute(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    const retries = 0;

    try {
      // 1) Analyze complexity and select model
      const complexityAnalysis = analyzeComplexity(this.agentType, input as Record<string, any>);
      const selection = selectModel(this.agentType, input as Record<string, any>);
      const model = input.model_override || selection.modelId;

      // 2) Build system prompt with caching
      const systemPrompt = buildSystemPrompt(this.agentType, {
        enableCaching: true,
        enableChainOfThought: true,
        enableGuardrails: true,
        customInstructions: input.options?.customInstructions,
      });

      // 3) Get tools for this agent
      const tools = this.getTools();

      // 4) Build conversation messages
      const messages = this.buildMessages(input, model, systemPrompt, tools);

      // 5) Call Claude API
      const response = await this.callClaude(model, systemPrompt, messages, tools);

      // 6) Process response
      const output = this.processResponse(response, model, complexityAnalysis.score, startTime, retries);

      // 7) Store in conversation memory (for chat agents)
      this.updateMemory(input, output);

      return output;

    } catch (error: any) {
      logger.error({ err: error }, `Agent ${this.agentType} execution failed`);
      return {
        success: false,
        agent: this.agentType,
        model: 'claude-haiku-4-5' as ModelId,
        content: `Erro ao executar agente ${this.agentType}: ${error.message || 'Erro desconhecido'}`,
        toolCalls: [],
        usage: { inputTokens: 0, outputTokens: 0, costUSD: 0 },
        metadata: {
          complexity: 0,
          executionTimeMs: Date.now() - startTime,
          truncated: false,
          retries,
        },
      };
    }
  }

  /**
   * Get tool definitions for this agent
   */
  protected getTools(): ToolDefinition[] {
    return getToolsForAgent(this.config.requiredTools, this.config.optionalTools);
  }

  /**
   * Build the messages array with context management
   */
  protected buildMessages(
    input: AgentInput,
    model: ModelId,
    systemPrompt: string | any[],
    tools: ToolDefinition[],
  ): ConversationMessage[] {
    const messages: ConversationMessage[] = [];

    // Get conversation history if available
    let history: ConversationMessage[] = [];
    if (input.conversation_history && input.conversation_history.length > 0) {
      history = input.conversation_history;
    } else if (input.sessionId && this.agentType === 'chat') {
      history = conversationMemory.get(input.sessionId, input.mapId);
    }

    // Calculate context budget
    const budget = calculateContextBudget(
      model,
      systemPrompt,
      tools,
      this.config.maxTokens,
    );

    // Reserve tokens for user message
    const userPrompt = buildUserPrompt(this.agentType, input, input.options || {});
    const userTokens = estimateTokens(userPrompt);
    const availableForHistory = budget.availableForContent - userTokens;

    // Truncate history if needed
    if (history.length > 0 && availableForHistory > 0) {
      const truncated = truncateHistory(history, availableForHistory);
      messages.push(...truncated.messages);
    }

    // Add user message
    messages.push({ role: 'user', content: userPrompt });

    return messages;
  }

  /**
   * Call the Claude API
   */
  protected async callClaude(
    model: ModelId,
    systemPrompt: string | any[],
    messages: ConversationMessage[],
    tools: ToolDefinition[],
  ): Promise<ClaudeResponse> {
    // Convert system prompt to appropriate format
    let system: string | undefined;
    let systemWithCache: any[] | undefined;

    if (typeof systemPrompt === 'string') {
      system = systemPrompt;
    } else {
      // Array format for caching
      systemWithCache = systemPrompt;
    }

    const toolChoice = this.getToolChoice(tools);

    return this.client.sendMessage({
      model,
      system: system || (systemWithCache ? systemWithCache.map(s => s.text).join('\n\n') : undefined),
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: toolChoice,
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature ?? 0.7,
    });
  }

  /**
   * Decide when to force tool use for agentic actions.
   */
  protected getToolChoice(tools: ToolDefinition[]): { type: 'auto' } | { type: 'any' } {
    if (!tools.length) {
      return { type: 'auto' };
    }

    const forceToolAgents: AgentType[] = [
      'generate',
      'expand',
      'organize',
      'connect',
      'visualize',
      'task_convert',
      'research',
      'hypothesize',
    ];

    return forceToolAgents.includes(this.agentType) ? { type: 'any' } : { type: 'auto' };
  }

  /**
   * Process the Claude response into AgentOutput
   */
  protected processResponse(
    response: ClaudeResponse,
    model: ModelId,
    complexity: number,
    startTime: number,
    retries: number,
  ): AgentOutput {
    const toolCalls: ToolCallResult[] = [];
    let textContent = '';
    let thinkingContent = '';

    // Extract content blocks
    if (response.content) {
      for (const block of response.content) {
        if (block.type === 'text') {
          textContent += block.text || '';
        } else if ((block as any).type === 'thinking') {
          thinkingContent += (block as any).thinking || '';
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            toolName: block.name || '',
            toolId: block.id || '',
            input: block.input,
          });
        }
      }
    }

    // Calculate cost
    const inputCost = (response.usage?.input_tokens || 0) * 0.000003; // Approximate
    const outputCost = (response.usage?.output_tokens || 0) * 0.000015;

    return {
      success: true,
      agent: this.agentType,
      model,
      content: textContent,
      toolCalls,
      thinking: thinkingContent || undefined,
      usage: {
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        cacheCreationTokens: response.usage?.cache_creation_input_tokens,
        cacheReadTokens: response.usage?.cache_read_input_tokens,
        costUSD: inputCost + outputCost,
      },
      metadata: {
        complexity,
        executionTimeMs: Date.now() - startTime,
        truncated: false,
        retries,
      },
    };
  }

  /**
   * Update conversation memory
   */
  protected updateMemory(input: AgentInput, output: AgentOutput): void {
    if (this.agentType !== 'chat' || !input.sessionId) {return;}

    const userMsg: ConversationMessage = {
      role: 'user',
      content: input.message || input.prompt || '',
    };

    const assistantMsg: ConversationMessage = {
      role: 'assistant',
      content: output.content,
    };

    conversationMemory.add(input.sessionId, input.mapId, [userMsg, assistantMsg]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT FACTORY
// ═══════════════════════════════════════════════════════════════════════════

const agentCache = new Map<string, BaseAgent>();

/**
 * Create or retrieve an agent instance
 */
export function createAgent(agentType: AgentType, client: ClaudeClient): BaseAgent {
  const cacheKey = agentType;
  let agent = agentCache.get(cacheKey);
  if (!agent) {
    agent = new BaseAgent(agentType, client);
    agentCache.set(cacheKey, agent);
  }
  return agent;
}

/**
 * Get all available agent types
 */
export function getAvailableAgents(): AgentType[] {
  return Object.keys(AGENT_REGISTRY) as AgentType[];
}

/**
 * Get agent config info
 */
export function getAgentInfo(agentType: AgentType): AgentConfig | undefined {
  return AGENT_REGISTRY[agentType];
}
