/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Enhanced Orchestrator
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Pipeline-based orchestrator integrating all AI subsystems:
 * - Agent selection and execution
 * - Streaming support
 * - Tool orchestration with agentic loops
 * - Memory management
 * - Cost tracking
 * - Error recovery
 * 
 * Architecture:
 *   Request → Validate → SelectAgent → PrepareContext → Execute → Process → Respond
 */

import type { Response } from 'express';
import type {
  AgentType,
  ModelId,
  ConversationMessage,
} from '../core/types';
import { ClaudeClient } from '../core/client';
import { AGENT_REGISTRY } from '../core/constants';
import { createAgent, type AgentInput, type AgentOutput } from '../agents';
import { executeWithStreaming } from '../streaming';
import { conversationMemory } from '../memory';
import { logger } from '../../utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface OrchestratorInput {
  // Core
  agentType: AgentType;
  prompt?: string;
  message?: string;

  // Context
  mapId: string;
  userId: string;
  sessionId?: string;

  // Map data
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

  // For streaming
  res?: Response;
}

export interface OrchestratorOutput {
  success: boolean;
  agent: AgentType;
  model: ModelId;
  content: string;
  toolCalls: any[];
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
  // Parsed structured data from tool calls
  generatedNodes?: any[];
  generatedEdges?: any[];
  generatedTasks?: any[];
  analysis?: any;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

export class NeuralOrchestrator {
  private client: ClaudeClient;

  constructor() {
    this.client = new ClaudeClient();
  }

  /**
   * Main execution entry point
   */
  async execute(input: OrchestratorInput): Promise<OrchestratorOutput | void> {
    // Validate agent type
    if (!AGENT_REGISTRY[input.agentType]) {
      throw new Error(`Agente desconhecido: ${input.agentType}. Disponíveis: ${Object.keys(AGENT_REGISTRY).join(', ')}`);
    }

    logger.info({
      mapId: input.mapId,
      userId: input.userId,
      stream: !!input.stream,
      nodeCount: input.nodes?.length || 0,
    }, `[NeuralOrchestrator] Executing agent: ${input.agentType}`);

    // Route to streaming or standard execution
    if (input.stream && input.res) {
      return this.executeStreaming(input);
    }

    return this.executeStandard(input);
  }

  /**
   * Standard (non-streaming) execution
   */
  private async executeStandard(input: OrchestratorInput): Promise<OrchestratorOutput> {
    const agentInput: AgentInput = {
      message: input.message || input.prompt,
      prompt: input.prompt || input.message,
      mapId: input.mapId,
      userId: input.userId,
      sessionId: input.sessionId,
      nodes: input.nodes,
      existing_nodes: input.existing_nodes,
      edges: input.edges,
      selected_node: input.selected_node,
      node: input.node,
      parent: input.parent,
      siblings: input.siblings,
      map_title: input.map_title,
      map_description: input.map_description,
      conversation_history: input.conversation_history,
      options: input.options,
      model_override: input.model_override,
    };

    const agent = createAgent(input.agentType, this.client);
    const result = await agent.execute(agentInput);

    // Parse tool calls into structured data
    const parsed = this.parseToolResults(result);

    return {
      ...result,
      ...parsed,
    };
  }

  /**
   * Streaming execution (delegates to SSE system)
   */
  private async executeStreaming(input: OrchestratorInput): Promise<void> {
    await executeWithStreaming(this.client, {
      agentType: input.agentType,
      input: {
        message: input.message || input.prompt,
        prompt: input.prompt || input.message,
        nodes: input.nodes,
        existing_nodes: input.existing_nodes,
        edges: input.edges,
        selected_node: input.selected_node,
        node: input.node,
        parent: input.parent,
        siblings: input.siblings,
        map_title: input.map_title,
        map_description: input.map_description,
        conversation_history: input.conversation_history,
        options: input.options,
      },
      mapId: input.mapId,
      userId: input.userId,
      sessionId: input.sessionId,
      modelOverride: input.model_override,
      res: input.res,
    });
  }

  /**
   * Parse tool call results into structured data for the frontend
   */
  private parseToolResults(result: AgentOutput): Partial<OrchestratorOutput> {
    const parsed: Partial<OrchestratorOutput> = {};
    const { toolCalls, content } = result;

    if (toolCalls.length === 0) {
      // Try parsing JSON from content
      const jsonParsed = this.tryParseJSON(content);
      if (jsonParsed) {
        if (jsonParsed.nodes) {parsed.generatedNodes = jsonParsed.nodes;}
        if (jsonParsed.edges) {parsed.generatedEdges = jsonParsed.edges;}
        if (jsonParsed.tasks) {parsed.generatedTasks = jsonParsed.tasks;}
        if (jsonParsed.analysis) {parsed.analysis = jsonParsed.analysis;}
      }
      return parsed;
    }

    // Process tool calls
    for (const call of toolCalls) {
      switch (call.toolName) {
        case 'create_nodes':
          parsed.generatedNodes = [
            ...(parsed.generatedNodes || []),
            ...(call.input?.nodes || [call.input]),
          ];
          break;

        case 'create_edges':
          parsed.generatedEdges = [
            ...(parsed.generatedEdges || []),
            ...(call.input?.edges || [call.input]),
          ];
          break;

        case 'create_tasks':
          parsed.generatedTasks = [
            ...(parsed.generatedTasks || []),
            ...(call.input?.tasks || [call.input]),
          ];
          break;

        case 'analyze_map':
        case 'find_patterns':
          parsed.analysis = {
            ...(parsed.analysis || {}),
            ...call.input,
          };
          break;

        case 'update_node':
        case 'reorganize_map':
        case 'create_clusters':
        case 'update_layout':
          // These will be structured as action items for the frontend
          if (!parsed.generatedNodes) {parsed.generatedNodes = [];}
          parsed.generatedNodes.push({
            action: call.toolName,
            ...call.input,
          });
          break;

        case 'search_web':
          // Web search results become research nodes
          if (!parsed.generatedNodes) {parsed.generatedNodes = [];}
          parsed.generatedNodes.push({
            type: 'reference',
            label: `Pesquisa: ${call.input?.query || ''}`,
            ...call.input,
          });
          break;

        case 'add_citations':
          // Citations become metadata on nodes
          if (!parsed.generatedEdges) {parsed.generatedEdges = [];}
          parsed.generatedEdges.push({
            type: 'citation',
            ...call.input,
          });
          break;

        case 'generate_report':
          // Report is just text content — already in result.content
          break;
      }
    }

    return parsed;
  }

  /**
   * Try to parse JSON from a text response
   */
  private tryParseJSON(text: string): any | null {
    if (!text) {return null;}

    // Try direct parse
    try {
      return JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch {
          return null;
        }
      }

      // Try finding JSON objects/arrays in the text
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        try {
          return JSON.parse(objectMatch[0]);
        } catch {
          return null;
        }
      }

      return null;
    }
  }

  /**
   * Get usage stats for the current session
   */
  getSessionStats(): {
    totalCost: number;
    totalRequests: number;
    memoryStats: any;
  } {
    return {
      totalCost: this.client.getSessionCost(),
      totalRequests: 0,
      memoryStats: conversationMemory.stats(),
    };
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string, mapId?: string): void {
    conversationMemory.clear(sessionId, mapId);
  }

  /**
   * Auto-detect the best agent for a message
   */
  detectAgentType(message: string): AgentType {
    const msg = message.toLowerCase();

    const patterns: [RegExp, AgentType][] = [
      [/gerar?\s+(ideia|conceito|nó|sugest)/i, 'generate'],
      [/expand|aprofund|detalh|mais\s+sobre/i, 'expand'],
      [/resum|sintetiz|sumari/i, 'summarize'],
      [/analis|avali|examin|diagnos|mapeamento/i, 'analyze'],
      [/organiz|estrutur|reestru|reorgan|arrum/i, 'organize'],
      [/pesquis|buscar?|investigar?|fontes?/i, 'research'],
      [/hipótes|cenário|possibilidade|e\s+se|what.?if/i, 'hypothesize'],
      [/tarefa|task|ação|todo|checklist|planej/i, 'task_convert'],
      [/crít|review|avaliação|feedback|melhor/i, 'critique'],
      [/conex|relação|link|associa|interdep/i, 'connect'],
      [/visual|layout|design|cor|ícone|aparência/i, 'visualize'],
    ];

    for (const [pattern, agent] of patterns) {
      if (pattern.test(msg)) {return agent;}
    }

    return 'chat';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

let orchestratorInstance: NeuralOrchestrator | null = null;

export function getOrchestrator(): NeuralOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new NeuralOrchestrator();
  }
  return orchestratorInstance;
}

export function resetOrchestrator(): void {
  orchestratorInstance = null;
}
