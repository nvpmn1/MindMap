// ============================================================================
// NeuralMap - AI Agent Engine v4 (COMPLETE REWRITE)
// REAL Agent Mode with Claude Haiku 4.5  Tool-Use + Real-Time Streaming
// All actions execute DIRECTLY on the map  no suggestions, no fallbacks
// ============================================================================

import type {
  NeuralNodeType,
  NeuralNodeData,
  AIAgentMessage,
  AIAgentAction,
  AIAgentConfig,
  AIAgentMode,
  PowerNode,
  PowerEdge,
  ChartData,
  TableData,
} from '../editor/types';
import { AGENT_TOOLS, type AgentToolName } from './tools';
import { buildSystemPrompt, buildMapContextMessage, formatConversationHistory } from './prompts';
import { actionExecutor, type ExecutionContext, type ExecutionResult } from './ActionExecutor';
import {
  getAgentPlaybook,
  describeExecutionTargets,
  EXECUTION_IMPACT_WEIGHTS,
  type AgentPlaybook,
} from './agentPlaybooks';
import { getAccessToken } from '@/lib/supabase';

const FALLBACK_PROD_API_URL = 'https://mindmap-hub-api.onrender.com';

//  Types 

export interface AgentResponse {
  response: string;
  actions: AIAgentAction[];
  thinking?: string;
  todoList?: AgentTodoItem[];
  insights?: string[];
  nextSteps?: string[];
  confidence?: number;
  toolResults?: ExecutionResult[];
  usage?: { input_tokens: number; output_tokens: number };
  model?: string;
  streaming?: boolean;
  executionValidated?: boolean;
  executedOnMap?: boolean;
  mutationsApplied?: number;
  toolCallsCount?: number;
  assistantContent?: ContentBlock[];
  stopReason?: string;
  toolCalls?: ToolUseBlock[];
}

export interface AgentTodoItem {
  id: string;
  title: string;
  status: 'planning' | 'in-progress' | 'completed' | 'failed';
  detail?: string;
}

export interface StreamCallbacks {
  onThinkingStart?: () => void;
  onThinkingUpdate?: (text: string) => void;
  onTodoUpdate?: (todos: AgentTodoItem[]) => void;
  onTextDelta?: (text: string, accumulated: string) => void;
  onToolStart?: (toolName: string, detail?: string) => void;
  onToolComplete?: (toolName: string, input: any, result?: string) => void;
  onActionStep?: (step: string, icon?: string) => void; // NEW: Step-by-step actions
  onComplete?: (response: AgentResponse) => void;
  onError?: (error: string) => void;
}

interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: any;
}

interface TextBlock {
  type: 'text';
  text: string;
}

type ContentBlock = ToolUseBlock | TextBlock;
type AgentMessageContent = string | Array<Record<string, unknown>>;
type AgentMessage = { role: 'user' | 'assistant'; content: AgentMessageContent };

interface ExecutionStats {
  successCount: number;
  failCount: number;
  mutatingSuccessCount: number;
  nodesCreated: number;
  nodesUpdated: number;
  nodesDeleted: number;
  edgesCreated: number;
  edgesDeleted: number;
  uniqueMutatingTools: number;
  impactScore: number;
}

interface ExecutionEvaluation {
  valid: boolean;
  stats: ExecutionStats;
  deficits: string[];
}

//  Neural Agent v4  Pure Agent Mode 

export class NeuralAIAgent {
  private static readonly MUTATING_TOOLS = new Set<AgentToolName>([
    'create_node',
    'create_nodes',
    'batch_create_nodes',
    'update_node',
    'batch_update_nodes',
    'delete_node',
    'create_edge',
    'create_edges',
    'delete_edge',
    'create_tasks',
  ]);

  private static readonly MAX_TOOL_LOOP_TURNS = 4;

  private config: AIAgentConfig;
  private conversationHistory: AIAgentMessage[] = [];
  private isProcessing = false;
  private executionContext: ExecutionContext | null = null;
  private currentTodos: AgentTodoItem[] = [];
  private agentType: string = 'chat';
  private activePlaybook: AgentPlaybook = getAgentPlaybook('chat');
  private mapId: string | null = null;

  constructor() {
    this.config = {
      model: 'claude-haiku-4-5', // FIXED: Always Haiku
      mode: 'agent',
      temperature: 0.7,
      maxTokens: 8192,
      tools: AGENT_TOOLS.map((t) => t.name),
      autoExecute: true,
    };
  }

  //  Public API 

  setMode(mode: AIAgentMode) {
    this.config.mode = mode;
  }

  getMode(): AIAgentMode {
    return this.config.mode;
  }

  getHistory(): AIAgentMessage[] {
    return this.conversationHistory;
  }

  clearHistory() {
    this.conversationHistory = [];
    this.currentTodos = [];
  }

  setExecutionContext(ctx: ExecutionContext) {
    this.executionContext = ctx;
  }

  setMapId(mapId: string | null | undefined) {
    this.mapId = mapId?.trim() || null;
  }

  isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Build auth headers with Bearer token
   */
  private async buildAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    try {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // No auth available
    }

    return headers;
  }

  /**
   * Resolve backend base URL safely for both dev and production.
   * Avoids calling /api on Vercel frontend domain (can return 405 when rewrite catches POST).
   */
  private getApiBaseUrl(): string {
    const envUrl = (import.meta.env.VITE_API_URL || '').trim();
    if (envUrl) {
      return envUrl.replace(/\/$/, '');
    }

    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        return 'http://localhost:3001';
      }
    }

    return FALLBACK_PROD_API_URL;
  }

  private getRequiredMapId(): string {
    if (!this.mapId) {
      throw new Error('Map ID is required for agent execution');
    }

    return this.mapId;
  }

  private inferAgentTypeFromMessage(message: string): string {
    const text = message.toLowerCase();
    const rules: Array<{ type: string; pattern: RegExp }> = [
      { type: 'generate', pattern: /(gere|gerar|ideia|brainstorm)/i },
      { type: 'expand', pattern: /(expand|aprofund|detalh|subtop|sub-t[o]p)/i },
      { type: 'summarize', pattern: /(resum|sintetiz|sumari)/i },
      { type: 'organize', pattern: /(organiz|reestrutur|reorganiz|layout)/i },
      { type: 'research', pattern: /(pesquis|fonte|refer[e]ncia|web|artigo)/i },
      { type: 'task_convert', pattern: /(tarefa|todo|checklist|plano de a[c][a]o)/i },
      { type: 'analyze', pattern: /(analis|avali|diagn[o]st)/i },
      { type: 'critique', pattern: /(cr[i]tica|review|melhoria)/i },
      { type: 'connect', pattern: /(conex|relac|link)/i },
      { type: 'hypothesize', pattern: /(hip[o]tes|cen[a]rio|what if)/i },
    ];

    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        return rule.type;
      }
    }

    return 'chat';
  }

  private resolveAgentType(message: string, explicitAgentType?: string): string {
    if (explicitAgentType && explicitAgentType.trim().length > 0) {
      return explicitAgentType.trim().toLowerCase();
    }

    const inferred = this.inferAgentTypeFromMessage(message);
    if (this.config.mode === 'agent' && inferred === 'chat') {
      return 'generate';
    }

    return inferred;
  }

  private isActionDrivenRequest(): boolean {
    const actionableTypes = new Set([
      'generate',
      'expand',
      'organize',
      'task_convert',
      'research',
      'hypothesize',
      'connect',
      'visualize',
      'chart',
      'analyze',
      'critique',
      'summarize',
    ]);

    if (actionableTypes.has(this.agentType)) return true;
    return this.config.mode === 'agent';
  }

  private buildExecutionDirective(): string {
    if (!this.isActionDrivenRequest()) return '';

    const playbook = this.activePlaybook;
    const targets = describeExecutionTargets(playbook.executionTargets);
    const allowedTools = playbook.allowedTools.join(', ');
    const directives = playbook.systemDirectives.map((item) => `- ${item}`);
    const checklist = playbook.completionChecklist.map((item) => `- ${item}`);

    return [
      '## CONTRATO DE EXECUCAO REAL (OBRIGATORIO)',
      `- Playbook ativo: ${playbook.label}`,
      `- Missao: ${playbook.mission}`,
      `- Metas minimas: ${targets}`,
      `- Tools permitidas neste modo: ${allowedTools}`,
      '- Nao invente IDs de no pai, source ou target.',
      '- Nao use tipos de no fora da lista valida (idea, task, note, reference, image, group, research, data, question).',
      '- Nao descreva acao hipotetica como se ja estivesse aplicada.',
      ...directives,
      '## CHECKLIST DE ENTREGA',
      ...checklist,
    ].join('\n');
  }

  private buildEffectiveSystemPrompt(): string {
    const base = buildSystemPrompt(this.config.mode);
    const executionDirective = this.buildExecutionDirective();
    return executionDirective ? `${base}\n\n${executionDirective}` : base;
  }

  private buildAgentMessages(userMessage: string, mapContext: string): AgentMessage[] {
    const history = formatConversationHistory(
      this.conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      8
    );

    const contextMessage = `${mapContext}\n\n---\n\nMensagem do usurio: ${userMessage}`;
    return history.length > 0
      ? [...history.slice(0, -1), { role: 'user' as const, content: contextMessage }]
      : [{ role: 'user' as const, content: contextMessage }];
  }

  private isMutatingTool(toolName: string): toolName is AgentToolName {
    return NeuralAIAgent.MUTATING_TOOLS.has(toolName as AgentToolName);
  }

  private calculateExecutionStats(results: ExecutionResult[] | undefined): ExecutionStats {
    if (!results || results.length === 0) {
      return {
        successCount: 0,
        failCount: 0,
        mutatingSuccessCount: 0,
        nodesCreated: 0,
        nodesUpdated: 0,
        nodesDeleted: 0,
        edgesCreated: 0,
        edgesDeleted: 0,
        uniqueMutatingTools: 0,
        impactScore: 0,
      };
    }

    let successCount = 0;
    let failCount = 0;
    let mutatingSuccessCount = 0;
    let nodesCreated = 0;
    let nodesUpdated = 0;
    let nodesDeleted = 0;
    let edgesCreated = 0;
    let edgesDeleted = 0;
    const usedMutatingTools = new Set<string>();

    for (const result of results) {
      if (result.success) {
        successCount += 1;
      } else {
        failCount += 1;
      }

      if (!result.success) {
        continue;
      }

      if (this.isMutatingTool(result.toolName)) {
        mutatingSuccessCount += 1;
        usedMutatingTools.add(result.toolName);
      }

      nodesCreated += result.nodesCreated?.length || 0;
      nodesUpdated += result.nodesUpdated?.length || 0;
      nodesDeleted += result.nodesDeleted?.length || 0;
      edgesCreated += result.edgesCreated?.length || 0;
      edgesDeleted += result.edgesDeleted?.length || 0;
    }

    const impactScore =
      nodesCreated * EXECUTION_IMPACT_WEIGHTS.nodesCreated +
      nodesUpdated * EXECUTION_IMPACT_WEIGHTS.nodesUpdated +
      nodesDeleted * EXECUTION_IMPACT_WEIGHTS.nodesDeleted +
      edgesCreated * EXECUTION_IMPACT_WEIGHTS.edgesCreated +
      edgesDeleted * EXECUTION_IMPACT_WEIGHTS.edgesDeleted +
      mutatingSuccessCount * EXECUTION_IMPACT_WEIGHTS.mutatingActions;

    return {
      successCount,
      failCount,
      mutatingSuccessCount,
      nodesCreated,
      nodesUpdated,
      nodesDeleted,
      edgesCreated,
      edgesDeleted,
      uniqueMutatingTools: usedMutatingTools.size,
      impactScore,
    };
  }

  private evaluateExecution(
    results: ExecutionResult[] | undefined,
    requiresExecution: boolean
  ): ExecutionEvaluation {
    const stats = this.calculateExecutionStats(results);

    if (!requiresExecution) {
      return { valid: true, stats, deficits: [] };
    }

    const targets = this.activePlaybook.executionTargets;
    const deficits: string[] = [];

    if (stats.mutatingSuccessCount < targets.minMutatingActions) {
      deficits.push(`acoes mutaveis ${stats.mutatingSuccessCount}/${targets.minMutatingActions}`);
    }
    if (stats.impactScore < targets.minImpactScore) {
      deficits.push(`impacto ${stats.impactScore}/${targets.minImpactScore}`);
    }
    if (
      typeof targets.minNodesCreated === 'number' &&
      stats.nodesCreated < targets.minNodesCreated
    ) {
      deficits.push(`nos criados ${stats.nodesCreated}/${targets.minNodesCreated}`);
    }
    if (
      typeof targets.minNodesUpdated === 'number' &&
      stats.nodesUpdated < targets.minNodesUpdated
    ) {
      deficits.push(`nos atualizados ${stats.nodesUpdated}/${targets.minNodesUpdated}`);
    }
    if (
      typeof targets.minEdgesCreated === 'number' &&
      stats.edgesCreated < targets.minEdgesCreated
    ) {
      deficits.push(`arestas criadas ${stats.edgesCreated}/${targets.minEdgesCreated}`);
    }
    if (
      typeof targets.minUniqueMutatingTools === 'number' &&
      stats.uniqueMutatingTools < targets.minUniqueMutatingTools
    ) {
      deficits.push(
        `variedade de tools ${stats.uniqueMutatingTools}/${targets.minUniqueMutatingTools}`
      );
    }

    return {
      valid: deficits.length === 0,
      stats,
      deficits,
    };
  }

  private buildExecutionFailureMessage(evaluation: ExecutionEvaluation): string {
    const deficitSummary =
      evaluation.deficits.length > 0 ? evaluation.deficits.join(', ') : 'metas nao atingidas';
    return [
      `Execucao insuficiente para o menu "${this.activePlaybook.label}".`,
      `Deficits: ${deficitSummary}.`,
      `Metas esperadas: ${describeExecutionTargets(this.activePlaybook.executionTargets)}.`,
      'Ajuste o comando para um alvo mais especifico ou execute novamente para completar o pacote.',
    ].join('\n');
  }

  private hasToolUseContent(content: ContentBlock[] | undefined): boolean {
    if (!Array.isArray(content) || content.length === 0) {
      return false;
    }

    return content.some((block) => block?.type === 'tool_use');
  }

  private extractToolCallsFromAssistantContent(content: ContentBlock[] | undefined): ToolUseBlock[] {
    if (!Array.isArray(content) || content.length === 0) {
      return [];
    }

    const seenToolIds = new Set<string>();
    const toolCalls: ToolUseBlock[] = [];

    for (const block of content) {
      if (
        block?.type !== 'tool_use' ||
        typeof block.id !== 'string' ||
        block.id.trim().length === 0 ||
        typeof block.name !== 'string'
      ) {
        continue;
      }

      if (seenToolIds.has(block.id)) {
        continue;
      }
      seenToolIds.add(block.id);

      toolCalls.push({
        type: 'tool_use',
        id: block.id,
        name: block.name,
        input:
          block.input && typeof block.input === 'object' && !Array.isArray(block.input)
            ? block.input
            : {},
      });
    }

    return toolCalls;
  }

  private getCanonicalToolCalls(
    toolCalls: ToolUseBlock[],
    assistantContent: ContentBlock[] | undefined
  ): ToolUseBlock[] {
    const assistantToolCalls = this.extractToolCallsFromAssistantContent(assistantContent);
    if (assistantToolCalls.length > 0) {
      return assistantToolCalls;
    }

    const deduped: ToolUseBlock[] = [];
    const seenToolIds = new Set<string>();
    for (const toolCall of toolCalls) {
      if (!toolCall?.id || seenToolIds.has(toolCall.id)) {
        continue;
      }
      seenToolIds.add(toolCall.id);
      deduped.push(toolCall);
    }

    return deduped;
  }

  private alignResultsToToolCalls(
    canonicalToolCalls: ToolUseBlock[],
    originalToolCalls: ToolUseBlock[],
    originalResults: ExecutionResult[] | undefined
  ): Array<ExecutionResult | undefined> {
    if (!Array.isArray(originalResults) || originalResults.length === 0) {
      return canonicalToolCalls.map(() => undefined);
    }

    const resultByToolId = new Map<string, ExecutionResult>();
    originalToolCalls.forEach((toolCall, index) => {
      const result = originalResults[index];
      if (!toolCall?.id || !result || resultByToolId.has(toolCall.id)) {
        return;
      }
      resultByToolId.set(toolCall.id, result);
    });

    return canonicalToolCalls.map((toolCall, index) => {
      const byId = resultByToolId.get(toolCall.id);
      if (byId) {
        return byId;
      }
      return originalResults[index];
    });
  }

  private buildToolResultMessageContent(
    toolCalls: ToolUseBlock[],
    results: Array<ExecutionResult | undefined>,
    nextInstruction?: string
  ): Array<Record<string, unknown>> {
    const blocks: Array<Record<string, unknown>> = toolCalls.map((toolCall, index) => {
      const result = results[index];
      const summary = result
        ? {
            success: result.success,
            tool: result.toolName,
            description: result.description,
            data: result.data ?? null,
            error: result.error ?? null,
            nodesCreated: result.nodesCreated ?? [],
            nodesUpdated: result.nodesUpdated ?? [],
            nodesDeleted: result.nodesDeleted ?? [],
            edgesCreated: result.edgesCreated ?? [],
            edgesDeleted: result.edgesDeleted ?? [],
          }
        : {
            success: false,
            tool: toolCall.name,
            description: 'Tool result missing',
            error: 'Execution result missing',
          };

      return {
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: JSON.stringify(summary),
        ...(result && !result.success ? { is_error: true } : {}),
      };
    });

    if (nextInstruction) {
      blocks.push({
        type: 'text',
        text: nextInstruction,
      });
    }

    return blocks;
  }

  private sanitizeRequestMessages(
    messages: AgentMessage[],
    flattenContentToText: boolean = false
  ): AgentMessage[] {
    const normalizedMessages = messages.map((message) => {
      if (typeof message.content === 'string') {
        return {
          role: message.role,
          content: message.content.trim(),
        };
      }

      if (!Array.isArray(message.content)) {
        return {
          role: message.role,
          content: '',
        };
      }

      if (flattenContentToText) {
        const flattened = message.content
          .map((block) => {
            if (!block || typeof block !== 'object') {
              return '';
            }

            if (typeof block.text === 'string') {
              return block.text;
            }

            if (typeof block.content === 'string') {
              return block.content;
            }

            try {
              return JSON.stringify(block);
            } catch {
              return '';
            }
          })
          .filter(Boolean)
          .join('\n')
          .trim();

        return {
          role: message.role,
          content: flattened,
        };
      }

      const normalizedBlocks = message.content
        .map((block) => {
          if (!block || typeof block !== 'object' || Array.isArray(block)) {
            return null;
          }

          const normalized: Record<string, unknown> = { ...block };
          if (typeof normalized.type !== 'string') {
            normalized.type = 'text';
          }

          if (normalized.type === 'text') {
            const text =
              typeof normalized.text === 'string'
                ? normalized.text
                : typeof normalized.content === 'string'
                  ? normalized.content
                  : '';
            if (!text) {
              return null;
            }
            normalized.text = text;
            delete normalized.content;
          }

          if (normalized.type === 'tool_result') {
            if (typeof normalized.tool_use_id !== 'string' || normalized.tool_use_id.length === 0) {
              return null;
            }

            const resultContent =
              typeof normalized.content === 'string'
                ? normalized.content
                : typeof normalized.text === 'string'
                  ? normalized.text
                  : '';
            normalized.content =
              resultContent || '{"success":false,"error":"empty_tool_result_payload"}';
            delete normalized.text;
          }

          if (normalized.type === 'tool_use') {
            if (typeof normalized.id !== 'string') {
              return null;
            }
            if (typeof normalized.name !== 'string') {
              return null;
            }
            if (!normalized.input || typeof normalized.input !== 'object') {
              normalized.input = {};
            }
          }

          return normalized;
        })
        .filter((block): block is Record<string, unknown> => block !== null);

      if (normalizedBlocks.length === 0) {
        return {
          role: message.role,
          content: '',
        };
      }

      return {
        role: message.role,
        content: normalizedBlocks,
      };
    });

    if (flattenContentToText) {
      return normalizedMessages;
    }

    const protocolSafeMessages: AgentMessage[] = [];
    let droppedOrphanToolResults = 0;

    for (const message of normalizedMessages) {
      if (!Array.isArray(message.content)) {
        protocolSafeMessages.push(message);
        continue;
      }

      const previousMessage = protocolSafeMessages[protocolSafeMessages.length - 1];
      const allowedToolUseIds = new Set<string>();

      if (
        message.role === 'user' &&
        previousMessage?.role === 'assistant' &&
        Array.isArray(previousMessage.content)
      ) {
        for (const block of previousMessage.content) {
          if (
            block &&
            typeof block === 'object' &&
            block.type === 'tool_use' &&
            typeof block.id === 'string'
          ) {
            allowedToolUseIds.add(block.id);
          }
        }
      }

      const filteredBlocks = message.content.filter((block) => {
        if (!block || typeof block !== 'object') {
          return false;
        }

        if (block.type !== 'tool_result') {
          return true;
        }

        const toolUseId = typeof block.tool_use_id === 'string' ? block.tool_use_id : '';
        const isValid = toolUseId.length > 0 && allowedToolUseIds.has(toolUseId);
        if (!isValid) {
          droppedOrphanToolResults += 1;
        }
        return isValid;
      });

      if (filteredBlocks.length > 0) {
        protocolSafeMessages.push({
          role: message.role,
          content: filteredBlocks,
        });
        continue;
      }

      const fallbackText = message.content
        .map((block) => {
          if (!block || typeof block !== 'object') {
            return '';
          }
          if (typeof block.text === 'string') {
            return block.text;
          }
          if (typeof block.content === 'string') {
            return block.content;
          }
          return '';
        })
        .filter(Boolean)
        .join('\n')
        .trim();

      if (fallbackText.length > 0) {
        protocolSafeMessages.push({
          role: message.role,
          content: fallbackText,
        });
      }
    }

    if (droppedOrphanToolResults > 0) {
      console.warn(
        `[NeuralAgent] Dropped ${droppedOrphanToolResults} orphan tool_result block(s) before API call`
      );
    }

    return protocolSafeMessages;
  }

  private sanitizeRequestTools(playbook: AgentPlaybook = this.activePlaybook) {
    const allowedSet = new Set<string>(playbook.allowedTools.map((tool) => `${tool}`.trim()));
    const preferredRank = new Map<string, number>(
      playbook.preferredTools.map((tool, index) => [`${tool}`.trim(), index])
    );

    const scopedTools = AGENT_TOOLS.filter((tool) => allowedSet.has(`${tool.name}`.trim())).sort(
      (a, b) => {
        const aRank = preferredRank.get(`${a.name}`.trim()) ?? Number.MAX_SAFE_INTEGER;
        const bRank = preferredRank.get(`${b.name}`.trim()) ?? Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      }
    );

    const effectiveTools = scopedTools.length > 0 ? scopedTools : AGENT_TOOLS;

    return effectiveTools.map((tool) => ({
      name: `${tool.name}`.trim(),
      description: `${tool.description}`.trim(),
      input_schema:
        tool.input_schema && typeof tool.input_schema === 'object' && !Array.isArray(tool.input_schema)
          ? tool.input_schema
          : { type: 'object', properties: {}, required: [] },
    }));
  }

  private shouldRetryWithFlattenedPayload(errorText: string): boolean {
    const normalized = errorText.toLowerCase();
    return (
      normalized.includes('validation_error') ||
      normalized.includes('expected string, received array') ||
      normalized.includes('invalid request data')
    );
  }

  //  Main Entry Point 

  /**
   * Process a user message  REAL Agent Mode with streaming + tool execution
   * 1. Sends to backend streaming endpoint
   * 2. Receives SSE events in real-time (thinking, text, tool calls)
   * 3. Executes tool calls DIRECTLY on the map via ActionExecutor
   * 4. Updates TODO list in real-time as events flow
   */
  async processMessage(
    message: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null,
    callbacks?: StreamCallbacks,
    agentType?: string,
    mapId?: string | null
  ): Promise<AgentResponse> {
    if (this.isProcessing) {
      return { response: 'Aguarde, estou processando a tarefa anterior...', actions: [] };
    }

    if (mapId !== undefined) {
      this.setMapId(mapId);
    }
    this.agentType = this.resolveAgentType(message, agentType);
    this.activePlaybook = getAgentPlaybook(this.agentType);

    const requiresExecution = this.isActionDrivenRequest();
    if (!this.mapId) {
      return {
        response:
          'Nao foi possivel identificar o mapa atual para executar o modo agente. Recarregue o editor e tente novamente.',
        actions: [],
        confidence: 0,
        executionValidated: false,
      };
    }

    if (requiresExecution && !this.executionContext) {
      return {
        response:
          'A IA esta em modo de acao, mas o contexto de execucao do mapa nao foi inicializado. Recarregue o editor e tente novamente.',
        actions: [],
        confidence: 0,
        executionValidated: false,
      };
    }

    this.isProcessing = true;
    this.currentTodos = [];

    const userMsg: AIAgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    this.conversationHistory.push(userMsg);

    try {
      callbacks?.onThinkingStart?.();
      this.currentTodos = [
        { id: 'todo_1', title: 'Analisar contexto do mapa', status: 'in-progress' },
        { id: 'todo_2', title: 'Processar com Claude AI', status: 'planning' },
        { id: 'todo_3', title: 'Executar acoes necessarias', status: 'planning' },
        { id: 'todo_4', title: 'Finalizar e reportar', status: 'planning' },
      ];
      callbacks?.onTodoUpdate?.([...this.currentTodos]);
      callbacks?.onThinkingUpdate?.('Conectando com Claude Haiku 4.5...');

      const mapContext = this.buildContext(nodes, edges, selectedNodeId);
      let result: AgentResponse;

      try {
        result = await this.callStreamingAPI(message, mapContext, callbacks);
      } catch (streamError) {
        console.warn('Streaming failed, trying regular API:', streamError);
        this.updateTodo('todo_2', 'in-progress', callbacks);
        callbacks?.onThinkingUpdate?.('Processando via API direta...');

        try {
          const apiResult = await this.callAgentAPI(message, mapContext);
          result = apiResult.agentResponse;

          if (apiResult.toolCalls.length > 0 && this.executionContext) {
            this.updateTodo('todo_3', 'in-progress', callbacks);

            const execResults = actionExecutor.executeAll(
              apiResult.toolCalls.map((tc) => ({
                name: tc.name as AgentToolName,
                input: tc.input,
              })),
              this.executionContext
            );
            result.toolResults = execResults;
            result.actions = this.toolResultsToActions(apiResult.toolCalls, execResults);
            result.executedOnMap = true;
            result.toolCalls = apiResult.toolCalls;
            result.assistantContent = apiResult.assistantContent;
            result.stopReason = apiResult.stopReason;
            result.toolCallsCount = apiResult.toolCalls.length;

            const evaluation = this.evaluateExecution(execResults, requiresExecution);
            result.mutationsApplied = evaluation.stats.mutatingSuccessCount;
            if (evaluation.stats.successCount > 0) {
              result.response += `\n\n${evaluation.stats.successCount} acao(oes) executada(s) com sucesso${
                evaluation.stats.failCount > 0
                  ? `, ${evaluation.stats.failCount} falhou(aram)`
                  : ''
              }.`;
            }

            this.updateTodo('todo_3', evaluation.valid ? 'completed' : 'failed', callbacks);
            result.executionValidated = evaluation.valid;
            if (!evaluation.valid) {
              result.response = this.buildExecutionFailureMessage(evaluation);
            }
          } else if (requiresExecution) {
            result.executionValidated = false;
            result.response = this.buildExecutionFailureMessage(
              this.evaluateExecution(undefined, requiresExecution)
            );
          }
        } catch (apiError) {
          const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
          console.error('Claude API call failed:', errMsg);
          this.markAllTodosFailed(callbacks);
          callbacks?.onError?.(errMsg);

          const isMethodError = errMsg.includes('API 405') || errMsg.includes('Stream API 405');
          if (isMethodError) {
            throw new Error(
              `Erro ao chamar API de IA: ${errMsg}\n\nDiagnostico: endpoint de IA recebeu metodo nao permitido (405).\nIsso normalmente acontece quando o frontend chama o dominio errado para /api.\n\nVerifique VITE_API_URL apontando para o backend Render.`
            );
          }

          throw new Error(`Erro ao chamar Claude API: ${errMsg}`);
        }
      }

      if (
        requiresExecution &&
        result.executionValidated === false &&
        this.executionContext &&
        Array.isArray(result.toolCalls) &&
        result.toolCalls.length > 0 &&
        Array.isArray(result.toolResults) &&
        result.toolResults.length > 0 &&
        this.hasToolUseContent(result.assistantContent)
      ) {
        callbacks?.onThinkingUpdate?.(
          `Execucao abaixo da meta (${describeExecutionTargets(
            this.activePlaybook.executionTargets
          )}). Iniciando ciclo avancado de tool_result...`
        );

        const recovered = await this.runToolResultContinuation(
          message,
          mapContext,
          result,
          callbacks,
          requiresExecution
        );

        if (recovered) {
          result = recovered;
        }
      }

      if (result.executionValidated === false) {
        this.markAllTodosFailed(callbacks);
      } else {
        this.currentTodos.forEach((t) => {
          t.status = 'completed';
        });
      }
      callbacks?.onTodoUpdate?.([...this.currentTodos]);

      const assistantMsg: AIAgentMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: result.response,
        timestamp: new Date().toISOString(),
        metadata: {
          model: result.model || 'claude-haiku-4-5',
          mode: this.config.mode,
          actions: result.actions,
          reasoning: result.thinking,
          confidence: result.confidence,
          usage: result.usage,
          todoList: this.currentTodos,
        },
      };
      this.conversationHistory.push(assistantMsg);

      callbacks?.onComplete?.(result);
      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('NeuralAgent processMessage error:', errMsg);

      const isMethodError = errMsg.includes('API 405') || errMsg.includes('Stream API 405');
      const errorHint = isMethodError
        ? 'Possiveis solucoes:\n- Configure `VITE_API_URL` para o backend Render\n- Faca redeploy no Vercel apos atualizar variaveis\n- Confirme no Network que a URL chamada e `https://...onrender.com/api/ai/...`'
        : 'Possiveis solucoes:\n- Verifique se CLAUDE_API_KEY esta configurada no backend (.env)\n- Verifique se o backend esta rodando na porta 3001\n- Verifique os logs do terminal do backend';

      const errorResponse: AgentResponse = {
        response: `Erro na IA\n\n${errMsg}\n\n${errorHint}`,
        actions: [],
        confidence: 0,
        todoList: this.currentTodos,
        executionValidated: false,
      };

      const errorMsg: AIAgentMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: errorResponse.response,
        timestamp: new Date().toISOString(),
        metadata: { mode: this.config.mode, confidence: 0 },
      };
      this.conversationHistory.push(errorMsg);

      callbacks?.onError?.(errMsg);
      return errorResponse;
    } finally {
      this.isProcessing = false;
    }
  }

  private updateTodo(todoId: string, status: AgentTodoItem['status'], callbacks?: StreamCallbacks) {
    const todo = this.currentTodos.find((t) => t.id === todoId);
    if (todo) {
      todo.status = status;
      callbacks?.onTodoUpdate?.([...this.currentTodos]);
    }
  }

  private markAllTodosFailed(callbacks?: StreamCallbacks) {
    this.currentTodos.forEach((t) => {
      if (t.status !== 'completed') t.status = 'failed';
    });
    callbacks?.onTodoUpdate?.([...this.currentTodos]);
  }

  private async runToolResultContinuation(
    userMessage: string,
    mapContext: string,
    initialResult: AgentResponse,
    callbacks: StreamCallbacks | undefined,
    requiresExecution: boolean
  ): Promise<AgentResponse | null> {
    if (
      !this.executionContext ||
      !initialResult.assistantContent ||
      !initialResult.toolCalls ||
      !initialResult.toolResults
    ) {
      return null;
    }

    const requestMessages: AgentMessage[] = this.buildAgentMessages(userMessage, mapContext);
    const initialCanonicalToolCalls = this.getCanonicalToolCalls(
      initialResult.toolCalls,
      initialResult.assistantContent
    );
    if (initialCanonicalToolCalls.length === 0) {
      return null;
    }

    const initialResultPayload = this.alignResultsToToolCalls(
      initialCanonicalToolCalls,
      initialResult.toolCalls,
      initialResult.toolResults
    );

    requestMessages.push({
      role: 'assistant',
      content: initialResult.assistantContent as unknown as Array<Record<string, unknown>>,
    });
    requestMessages.push({
      role: 'user',
      content: this.buildToolResultMessageContent(
        initialCanonicalToolCalls,
        initialResultPayload,
        `Continue com acoes praticas. Atinja esta meta: ${describeExecutionTargets(
          this.activePlaybook.executionTargets
        )}.`
      ),
    });

    const initialExecutableToolCalls: ToolUseBlock[] = [];
    const initialExecutableResults: ExecutionResult[] = [];
    initialCanonicalToolCalls.forEach((toolCall, index) => {
      const result = initialResultPayload[index];
      if (!result) {
        return;
      }
      initialExecutableToolCalls.push(toolCall);
      initialExecutableResults.push(result);
    });

    const allToolCalls: ToolUseBlock[] = [...initialCanonicalToolCalls];
    const allToolResults: ExecutionResult[] = [...initialExecutableResults];
    const allActions: AIAgentAction[] =
      initialExecutableResults.length > 0
        ? this.toolResultsToActions(initialExecutableToolCalls, initialExecutableResults)
        : [...initialResult.actions];

    let latestText = initialResult.response;
    let latestUsage = initialResult.usage;
    let latestModel = initialResult.model;
    let latestStopReason = initialResult.stopReason;
    let latestAssistantContent = initialResult.assistantContent;
    let executionEvaluation = this.evaluateExecution(allToolResults, requiresExecution);

    for (
      let turn = 0;
      turn < NeuralAIAgent.MAX_TOOL_LOOP_TURNS && !executionEvaluation.valid;
      turn += 1
    ) {
      callbacks?.onThinkingUpdate?.(
        `Ciclo avancado ${turn + 1}/${NeuralAIAgent.MAX_TOOL_LOOP_TURNS}: metas pendentes (${executionEvaluation.deficits.join(', ')})`
      );

      const apiTurn = await this.callAgentAPIWithMessages(requestMessages, requiresExecution);
      latestText = apiTurn.agentResponse.response || latestText;
      latestUsage = apiTurn.agentResponse.usage || latestUsage;
      latestModel = apiTurn.agentResponse.model || latestModel;
      latestStopReason = apiTurn.stopReason || latestStopReason;
      latestAssistantContent = apiTurn.assistantContent || latestAssistantContent;

      requestMessages.push({
        role: 'assistant',
        content: apiTurn.assistantContent as unknown as Array<Record<string, unknown>>,
      });

      const canonicalTurnToolCalls = this.getCanonicalToolCalls(
        apiTurn.toolCalls,
        apiTurn.assistantContent
      );
      if (!canonicalTurnToolCalls.length) {
        break;
      }

      this.updateTodo('todo_3', 'in-progress', callbacks);

      const executionResults = actionExecutor.executeAll(
        canonicalTurnToolCalls.map((tc) => ({
          name: tc.name as AgentToolName,
          input: tc.input,
        })),
        this.executionContext
      );

      allToolCalls.push(...canonicalTurnToolCalls);
      allToolResults.push(...executionResults);
      allActions.push(...this.toolResultsToActions(canonicalTurnToolCalls, executionResults));

      executionEvaluation = this.evaluateExecution(allToolResults, requiresExecution);

      requestMessages.push({
        role: 'user',
        content: this.buildToolResultMessageContent(
          canonicalTurnToolCalls,
          executionResults,
          executionEvaluation.valid
            ? 'Metas batidas. Finalize com resumo objetivo.'
            : `Metas ainda nao atendidas: ${executionEvaluation.deficits.join(', ')}. Continue executando tool calls mutaveis.`
        ),
      });
    }

    const executionValidated = executionEvaluation.valid;
    const responseText =
      executionValidated || !requiresExecution
        ? latestText
        : this.buildExecutionFailureMessage(executionEvaluation);

    return {
      ...initialResult,
      response: responseText || initialResult.response,
      actions: allActions,
      toolResults: allToolResults,
      toolCalls: allToolCalls,
      usage: latestUsage,
      model: latestModel,
      stopReason: latestStopReason,
      assistantContent: latestAssistantContent,
      executionValidated,
      executedOnMap: allToolResults.length > 0,
      mutationsApplied: executionEvaluation.stats.mutatingSuccessCount,
      toolCallsCount: allToolCalls.length,
    };
  }

  //  Streaming API Call (Primary Path) 

  private async callStreamingAPI(
    userMessage: string,
    mapContext: string,
    callbacks?: StreamCallbacks
  ): Promise<AgentResponse> {
    const messages = this.buildAgentMessages(userMessage, mapContext);
    const requestMessages = this.sanitizeRequestMessages(messages);
    const requestTools = this.sanitizeRequestTools();

    const enforceToolUse = this.isActionDrivenRequest();
    const body = {
      map_id: this.getRequiredMapId(),
      agent_type: this.agentType,
      model: 'claude-haiku-4-5',
      mode: this.config.mode,
      systemPrompt: this.buildEffectiveSystemPrompt(),
      messages: requestMessages,
      tools: requestTools,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      force_tool_use: enforceToolUse,
      require_action: enforceToolUse,
      require_mutating_action: enforceToolUse && this.config.mode === 'agent',
      disable_parallel_tool_use: true,
    };

    const headers = await this.buildAuthHeaders();
    const apiBaseUrl = this.getApiBaseUrl();

    const response = await fetch(`${apiBaseUrl}/api/ai/agent/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      if (response.status === 400 && this.shouldRetryWithFlattenedPayload(errText)) {
        const retryBody = {
          ...body,
          messages: this.sanitizeRequestMessages(messages, true),
        };
        const retryResponse = await fetch(`${apiBaseUrl}/api/ai/agent/stream`, {
          method: 'POST',
          headers,
          body: JSON.stringify(retryBody),
        });

        if (retryResponse.ok) {
          this.updateTodo('todo_1', 'completed', callbacks);
          this.updateTodo('todo_2', 'in-progress', callbacks);
          callbacks?.onThinkingUpdate?.('Claude Haiku 4.5 - processando...');
          return this.handleSSEStream(retryResponse, callbacks);
        }

        const retryErrorText = await retryResponse.text().catch(() => 'Unknown error');
        throw new Error(`Stream API ${retryResponse.status}: ${retryErrorText}`);
      }

      if (response.status === 405) {
        throw new Error(
          `Stream API 405: Method Not Allowed. URL chamada: ${apiBaseUrl}/api/ai/agent/stream`
        );
      }
      throw new Error(`Stream API ${response.status}: ${errText}`);
    }

    this.updateTodo('todo_1', 'completed', callbacks);
    this.updateTodo('todo_2', 'in-progress', callbacks);
    callbacks?.onThinkingUpdate?.('Claude Haiku 4.5 - processando...');

    return this.handleSSEStream(response, callbacks);
  }

  /**
   * Handle SSE stream events in real-time
   * Events from backend: model_selected, thinking_start, text_start, text_delta,
   * text_complete, tool_start, tool_complete, complete, error, done
   */
  private async handleSSEStream(
    response: Response,
    callbacks?: StreamCallbacks
  ): Promise<AgentResponse> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader');

    const decoder = new TextDecoder();
    let textAccumulator = '';
    const toolCalls: ToolUseBlock[] = [];
    let usage: any = null;
    let model = 'claude-haiku-4-5';
    let stopReason: string | undefined;
    let assistantContent: ContentBlock[] = [];
    let lastEventName = '';
    let toolsStarted = false;
    const seenToolIds = new Set<string>();

    const pushToolCall = (tool: { id?: string; name?: string; input?: any }) => {
      if (!tool?.name || typeof tool.id !== 'string' || tool.id.trim().length === 0) {
        return;
      }
      const toolId = tool.id.trim();
      if (seenToolIds.has(toolId)) return;
      seenToolIds.add(toolId);
      toolCalls.push({
        type: 'tool_use',
        id: toolId,
        name: tool.name,
        input: tool.input || {},
      });
    };

    try {
      let buffer = '';

      let streamEnded = false;
      while (!streamEnded) {
        const { done, value } = await reader.read();
        if (done) {
          streamEnded = true;
          continue;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            lastEventName = line.slice(7).trim();
            continue;
          }

          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);

              switch (lastEventName) {
                case 'model_selected':
                  callbacks?.onThinkingUpdate?.('Claude Haiku 4.5 - agente pronto');
                  model = 'claude-haiku-4-5';
                  break;

                case 'thinking_start':
                  this.updateTodo('todo_2', 'in-progress', callbacks);
                  callbacks?.onThinkingUpdate?.(data.message || 'Analisando...');
                  break;

                case 'text_start':
                  this.updateTodo('todo_2', 'in-progress', callbacks);
                  break;

                case 'text_delta':
                  textAccumulator = data.accumulated || textAccumulator + (data.text || '');
                  callbacks?.onTextDelta?.(data.text || '', textAccumulator);
                  break;

                case 'text_complete':
                  textAccumulator = data.text || textAccumulator;
                  this.updateTodo('todo_2', 'completed', callbacks);
                  break;

                case 'tool_start': {
                  if (!toolsStarted) {
                    toolsStarted = true;
                    this.updateTodo('todo_2', 'completed', callbacks);
                    this.updateTodo('todo_3', 'in-progress', callbacks);
                  }
                  const actionDetail = this.formatToolStartMessage(data.name);
                  callbacks?.onActionStep?.(actionDetail, this.getToolIcon(data.name));
                  callbacks?.onToolStart?.(data.name, actionDetail);
                  break;
                }

                case 'tool_complete': {
                  pushToolCall({ id: data.id, name: data.name, input: data.input });
                  const completionDetail = this.formatToolCompleteMessage(data.name, data.input);
                  callbacks?.onActionStep?.(completionDetail, 'OK');
                  callbacks?.onToolComplete?.(data.name, data.input, completionDetail);
                  break;
                }

                case 'validation_warning':
                  callbacks?.onThinkingUpdate?.(data.error || 'Validacao do agente em andamento...');
                  break;

                case 'complete':
                  usage = data.usage;
                  model = data.model || 'claude-haiku-4-5';
                  stopReason = data.stop_reason;
                  if (Array.isArray(data.content)) {
                    assistantContent = data.content as ContentBlock[];
                    for (const block of data.content) {
                      if (block?.type === 'tool_use') {
                        pushToolCall({
                          id: block.id,
                          name: block.name,
                          input: block.input,
                        });
                      }

                      if (block?.type === 'text' && !textAccumulator) {
                        textAccumulator = block.text || '';
                      }
                    }
                  }
                  break;

                case 'error':
                  throw new Error(data.error);

                case 'done':
                  break;

                default:
                  if (data.text !== undefined && data.accumulated !== undefined) {
                    textAccumulator = data.accumulated;
                    callbacks?.onTextDelta?.(data.text, data.accumulated);
                  } else if (data.name && data.input) {
                    if (!toolsStarted) {
                      toolsStarted = true;
                      this.updateTodo('todo_2', 'completed', callbacks);
                      this.updateTodo('todo_3', 'in-progress', callbacks);
                    }
                    pushToolCall({ id: data.id, name: data.name, input: data.input });
                    callbacks?.onToolComplete?.(data.name, data.input);
                  } else if (data.message) {
                    callbacks?.onThinkingUpdate?.(data.message);
                  } else if (data.content) {
                    usage = data.usage;
                    model = data.model || 'claude-haiku-4-5';
                    stopReason = data.stop_reason || stopReason;
                    if (Array.isArray(data.content)) {
                      assistantContent = data.content as ContentBlock[];
                    }
                  }
                  break;
              }

              lastEventName = '';
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    const canonicalToolCalls = this.getCanonicalToolCalls(toolCalls, assistantContent);
    if (toolCalls.length > 0 && canonicalToolCalls.length === 0) {
      console.warn('[NeuralAgent] Ignoring streamed tool calls without canonical tool_use ids');
    }

    let actions: AIAgentAction[] = [];
    let toolResults: ExecutionResult[] | undefined;
    const requiresExecution = this.isActionDrivenRequest();

    if (canonicalToolCalls.length > 0 && this.executionContext) {
      this.updateTodo('todo_3', 'in-progress', callbacks);

      toolResults = actionExecutor.executeAll(
        canonicalToolCalls.map((tc) => ({ name: tc.name as AgentToolName, input: tc.input })),
        this.executionContext
      );
      actions = this.toolResultsToActions(canonicalToolCalls, toolResults);

      this.updateTodo('todo_3', 'completed', callbacks);
    } else if (canonicalToolCalls.length === 0) {
      if (requiresExecution) {
        this.updateTodo('todo_3', 'failed', callbacks);
      } else {
        this.updateTodo('todo_3', 'completed', callbacks);
      }
    } else if (!this.executionContext) {
      this.updateTodo('todo_3', 'failed', callbacks);
    }

    this.updateTodo('todo_4', 'in-progress', callbacks);

    let thinking = '';
    let mainResponse = textAccumulator;

    const thinkingMatch = textAccumulator.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      thinking = thinkingMatch[1].trim();
      mainResponse = textAccumulator.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    }

    if (!mainResponse && canonicalToolCalls.length > 0) {
      const toolSummary = canonicalToolCalls.map((tc) => {
        if (tc.name === 'batch_create_nodes' || tc.name === 'create_nodes')
          return `Criados ${tc.input.nodes?.length || 0} nos`;
        if (tc.name === 'create_node') return `Criado no "${tc.input.label}"`;
        if (tc.name === 'update_node') return `Atualizado no`;
        if (tc.name === 'delete_node') return `Removido no`;
        if (tc.name === 'create_edge' || tc.name === 'create_edges') return `Criada(s) conexao(oes)`;
        return `Executado ${tc.name}`;
      });
      mainResponse = `Acoes executadas com sucesso:\n\n${toolSummary.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    }

    this.updateTodo('todo_4', 'completed', callbacks);

    const evaluation = this.evaluateExecution(toolResults, requiresExecution);
    const executionValidated = evaluation.valid;

    if (!executionValidated && requiresExecution) {
      mainResponse = this.buildExecutionFailureMessage(evaluation);
    }

    return {
      response: mainResponse || 'Processamento concluido.',
      actions,
      thinking,
      todoList: this.currentTodos,
      confidence: canonicalToolCalls.length > 0 ? 0.95 : 0.85,
      toolResults,
      usage,
      model,
      streaming: true,
      executionValidated,
      executedOnMap: canonicalToolCalls.length > 0 && !!this.executionContext,
      mutationsApplied: evaluation.stats.mutatingSuccessCount,
      toolCallsCount: canonicalToolCalls.length,
      assistantContent,
      stopReason,
      toolCalls: canonicalToolCalls,
    };
  }

  //  Regular API Call (non-streaming fallback) 

  private async callAgentAPI(
    userMessage: string,
    mapContext: string
  ): Promise<{
    agentResponse: AgentResponse;
    toolCalls: ToolUseBlock[];
    assistantContent: ContentBlock[];
    stopReason?: string;
  }> {
    const messages = this.buildAgentMessages(userMessage, mapContext);
    const requireMutatingAction = this.isActionDrivenRequest();
    return this.callAgentAPIWithMessages(messages, requireMutatingAction);
  }

  private async callAgentAPIWithMessages(
    messages: AgentMessage[],
    requireMutatingAction: boolean
  ): Promise<{
    agentResponse: AgentResponse;
    toolCalls: ToolUseBlock[];
    assistantContent: ContentBlock[];
    stopReason?: string;
  }> {
    const enforceToolUse = requireMutatingAction;
    const requestMessages = this.sanitizeRequestMessages(messages);
    const requestTools = this.sanitizeRequestTools();
    const body = {
      map_id: this.getRequiredMapId(),
      agent_type: this.agentType,
      model: 'claude-haiku-4-5',
      mode: this.config.mode,
      systemPrompt: this.buildEffectiveSystemPrompt(),
      messages: requestMessages,
      tools: requestTools,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      force_tool_use: enforceToolUse,
      require_action: enforceToolUse,
      require_mutating_action: enforceToolUse && this.config.mode === 'agent',
      disable_parallel_tool_use: true,
    };

    const headers = await this.buildAuthHeaders();
    const apiBaseUrl = this.getApiBaseUrl();

    const response = await fetch(`${apiBaseUrl}/api/ai/agent`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      if (response.status === 400 && this.shouldRetryWithFlattenedPayload(errText)) {
        const retryBody = {
          ...body,
          messages: this.sanitizeRequestMessages(messages, true),
        };

        const retryResponse = await fetch(`${apiBaseUrl}/api/ai/agent`, {
          method: 'POST',
          headers,
          body: JSON.stringify(retryBody),
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          return this.parseAPIResponse(retryData);
        }

        const retryErrText = await retryResponse.text().catch(() => 'Unknown error');
        throw new Error(`API ${retryResponse.status}: ${retryErrText}`);
      }

      if (response.status === 405) {
        throw new Error(`API 405: Method Not Allowed. URL chamada: ${apiBaseUrl}/api/ai/agent`);
      }
      throw new Error(`API ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return this.parseAPIResponse(data);
  }

  private parseAPIResponse(data: any): {
    agentResponse: AgentResponse;
    toolCalls: ToolUseBlock[];
    assistantContent: ContentBlock[];
    stopReason?: string;
  } {
    const content: ContentBlock[] = data.data?.content || data.content || [];
    const toolCalls: ToolUseBlock[] = this.extractToolCallsFromAssistantContent(content);
    let textResponse = '';
    let thinking = '';

    for (const block of content) {
      if (block.type === 'text') {
        textResponse += (block as TextBlock).text;
      }
    }

    const thinkingMatch = textResponse.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      thinking = thinkingMatch[1].trim();
      textResponse = textResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    }

    const confidence = toolCalls.length > 0 ? 0.95 : 0.8;

    if (toolCalls.length > 0 && !textResponse.trim()) {
      const toolNames = toolCalls.map((tc) => {
        if (tc.name === 'batch_create_nodes' || tc.name === 'create_nodes') {
          return `Criar ${tc.input.nodes?.length || 'varios'} nos`;
        }
        if (tc.name === 'create_node') {
          return `Criar "${tc.input.label}"`;
        }
        return tc.name;
      });
      textResponse = `OK. Executando ${toolCalls.length} acao(oes):\n\n${toolNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;
    }

    const stopReason = data.stop_reason || data.data?.stop_reason;

    return {
      agentResponse: {
        response: textResponse.trim() || 'Acoes executadas com sucesso.',
        actions: [],
        thinking,
        confidence,
        todoList: this.currentTodos,
        usage: data.usage || data.data?.usage,
        model: 'claude-haiku-4-5',
        executionValidated: false,
        executedOnMap: false,
        mutationsApplied: 0,
        toolCallsCount: toolCalls.length,
        assistantContent: content,
        stopReason,
        toolCalls,
      },
      toolCalls,
      assistantContent: content,
      stopReason,
    };
  }

  //  Context Building 

  private buildContext(
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null
  ): string {
    const edgeList = edges.map((e) => ({ source: e.source, target: e.target }));

    const nodeList = nodes.map((n) => ({
      id: n.id,
      type: n.data.type,
      label: n.data.label,
      description: n.data.description,
      status: n.data.status,
      priority: n.data.priority,
      progress: n.data.progress || 0,
      tags: n.data.tags,
      checklist: n.data.checklist,
      chart: n.data.chart,
      table: n.data.table,
      dueDate: n.data.dueDate,
      blueprintId: n.data.blueprintId,
      archetype: n.data.archetype,
      todoSeed: n.data.todoSeed,
      documentVaultCount: n.data.documentVault?.length || 0,
      aiPromptHint: n.data.aiPromptHint,
      parentIds: edges.filter((e) => e.target === n.id).map((e) => e.source),
      childIds: edges.filter((e) => e.source === n.id).map((e) => e.target),
    }));

    return buildMapContextMessage({
      nodes: nodeList,
      edges: edgeList,
      selectedNodeId,
      mapTitle: document.title.replace(' - NeuralMap', ''),
    });
  }

  //  Tool Results  Actions 

  private toolResultsToActions(
    toolCalls: ToolUseBlock[],
    results: ExecutionResult[]
  ): AIAgentAction[] {
    return results.map((result, i) => ({
      type: toolCalls[i]?.name || result.toolName,
      description: result.description,
      status: result.success ? ('completed' as const) : ('failed' as const),
      data: {
        ...toolCalls[i]?.input,
        result: result.data,
        nodesCreated: result.nodesCreated,
        nodesUpdated: result.nodesUpdated,
        nodesDeleted: result.nodesDeleted,
      },
    }));
  }

  //  Detailed Streaming Messages (VS Code Style) 

  private getToolIcon(toolName: string): string {
    const icons: Record<string, string> = {
      create_node: '',
      batch_create_nodes: '',
      update_node: '',
      batch_update_nodes: '',
      delete_node: '',
      create_edge: '',
      create_edges: '',
      delete_edge: '',
      analyze_map: '',
      reorganize_map: '',
      find_nodes: '',
    };
    return icons[toolName] || '';
  }

  private formatToolStartMessage(toolName: string): string {
    const messages: Record<string, string> = {
      create_node: 'Criando novo n no mapa...',
      batch_create_nodes: 'Criando mltiplos ns em batch...',
      update_node: 'Atualizando n existente...',
      batch_update_nodes: 'Atualizando vrios ns...',
      delete_node: 'Removendo n do mapa...',
      create_edge: 'Criando conexo entre ns...',
      create_edges: 'Criando mltiplas conexes...',
      delete_edge: 'Removendo conexo...',
      analyze_map: 'Analisando estrutura do mapa...',
      reorganize_map: 'Reorganizando layout do mapa...',
      find_nodes: 'Buscando ns no mapa...',
    };
    return messages[toolName] || `Executando ${toolName}...`;
  }

  private formatToolCompleteMessage(toolName: string, input: any): string {
    switch (toolName) {
      case 'create_node': {
        return `N criado: "${input.label}" (tipo: ${input.type})`;
      }

      case 'batch_create_nodes': {
        const count = input.nodes?.length || 0;
        const types = [...new Set((input.nodes || []).map((n: any) => n.type))];
        return `${count} ns criados (tipos: ${types.join(', ')})`;
      }

      case 'update_node': {
        const fields = Object.keys(input)
          .filter((k) => k !== 'nodeId')
          .join(', ');
        return `N atualizado (campos: ${fields})`;
      }

      case 'batch_update_nodes':
        return `${input.updates?.length || 0} ns atualizados`;

      case 'delete_node':
        return `N removido (${input.reason || 'sem motivo especificado'})`;

      case 'create_edge':
        return `Conexo criada${input.label ? `: "${input.label}"` : ''}`;

      case 'analyze_map':
        return `Anlise completa (foco: ${input.focus || 'all'})`;

      case 'reorganize_map':
        return `Mapa reorganizado (estratgia: ${input.strategy})`;

      case 'find_nodes':
        return `Busca concluda${input.query ? `: "${input.query}"` : ''}`;

      default:
        return `${toolName} concludo`;
    }
  }
}

// Singleton
export const neuralAgent = new NeuralAIAgent();

