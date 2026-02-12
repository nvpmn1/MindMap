// ============================================================================
// NeuralMap - AI Agent Engine v4 (COMPLETE REWRITE)
// REAL Agent Mode with Claude Haiku 4.5 — Tool-Use + Real-Time Streaming
// All actions execute DIRECTLY on the map — no suggestions, no fallbacks
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
import { getAccessToken } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const FALLBACK_PROD_API_URL = 'https://mindmap-hub-api.onrender.com';

// ─── Types ──────────────────────────────────────────────────────────────────

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

// ─── Neural Agent v4 — Pure Agent Mode ──────────────────────────────────────

export class NeuralAIAgent {
  private config: AIAgentConfig;
  private conversationHistory: AIAgentMessage[] = [];
  private isProcessing = false;
  private executionContext: ExecutionContext | null = null;
  private currentTodos: AgentTodoItem[] = [];
  private agentType: string = 'chat';

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

  // ─── Public API ───────────────────────────────────────────────────────

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

  isActive(): boolean {
    return this.isProcessing;
  }

  /**
   * Build auth headers with Bearer token + profile fallback
   */
  private async buildAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    try {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        return headers;
      }
    } catch {
      // Token retrieval failed, try profile fallback
    }

    // Fallback: use profile headers
    try {
      const { profile, user, isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated && (profile || user)) {
        const profileId = profile?.id || user?.id;
        const email = profile?.email || user?.email || '';
        const name = profile?.display_name || user?.display_name || 'Guest';
        const color = profile?.color || user?.color || '#00D9FF';

        if (profileId) {
          headers['x-profile-id'] = profileId;
          headers['x-profile-email'] = email;
          headers['x-profile-name'] = name;
          headers['x-profile-color'] = color;
        }
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

    return [
      '## DIRETRIZ DE EXECUÇÃO REAL (OBRIGATÓRIA)',
      '- Você DEVE executar ações reais no mapa usando tools.',
      '- Não descreva ações hipotéticas como se já tivessem sido executadas.',
      '- Antes de concluir, execute pelo menos 1 tool call relevante para o pedido.',
      '- Se nenhuma ação for possível, explique claramente por que e peça o dado faltante.',
    ].join('\n');
  }

  private buildEffectiveSystemPrompt(): string {
    const base = buildSystemPrompt(this.config.mode);
    const executionDirective = this.buildExecutionDirective();
    return executionDirective ? `${base}\n\n${executionDirective}` : base;
  }

  // ─── Main Entry Point ─────────────────────────────────────────────────

  /**
   * Process a user message — REAL Agent Mode with streaming + tool execution
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
    agentType?: string
  ): Promise<AgentResponse> {
    if (this.isProcessing) {
      return { response: '⏳ Aguarde, estou processando a tarefa anterior...', actions: [] };
    }

    if (agentType) {
      this.agentType = agentType;
    }

    const requiresExecution = this.isActionDrivenRequest();
    if (requiresExecution && !this.executionContext) {
      return {
        response:
          '❌ A IA está em modo de ação, mas o contexto de execução do mapa não foi inicializado. Recarregue o editor e tente novamente.',
        actions: [],
        confidence: 0,
        executionValidated: false,
      };
    }

    this.isProcessing = true;
    this.currentTodos = [];

    // Record user message
    const userMsg: AIAgentMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    this.conversationHistory.push(userMsg);

    try {
      // Initialize real-time TODO list
      callbacks?.onThinkingStart?.();
      this.currentTodos = [
        { id: 'todo_1', title: 'Analisar contexto do mapa', status: 'in-progress' },
        { id: 'todo_2', title: 'Processar com Claude AI', status: 'planning' },
        { id: 'todo_3', title: 'Executar ações necessárias', status: 'planning' },
        { id: 'todo_4', title: 'Finalizar e reportar', status: 'planning' },
      ];
      callbacks?.onTodoUpdate?.([...this.currentTodos]);
      callbacks?.onThinkingUpdate?.('Conectando com Claude Haiku 4.5...');

      // Build context
      const mapContext = this.buildContext(nodes, edges, selectedNodeId);

      // Try streaming first, then regular API
      let result: AgentResponse;

      try {
        result = await this.callStreamingAPI(
          message,
          mapContext,
          nodes,
          edges,
          selectedNodeId,
          callbacks
        );
      } catch (streamError) {
        console.warn('Streaming failed, trying regular API:', streamError);
        this.updateTodo('todo_2', 'in-progress', callbacks);
        callbacks?.onThinkingUpdate?.('Processando via API direta...');

        try {
          const apiResult = await this.callAgentAPI(
            message,
            mapContext,
            nodes,
            edges,
            selectedNodeId
          );
          result = apiResult.agentResponse;

          // Execute tool calls from Claude
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

            const successCount = execResults.filter((r) => r.success).length;
            const failCount = execResults.filter((r) => !r.success).length;
            if (successCount > 0) {
              result.response += `\n\n⚡ ${successCount} ação(ões) executada(s) com sucesso${failCount > 0 ? `, ${failCount} falhou(aram)` : ''}.`;
            }

            this.updateTodo('todo_3', 'completed', callbacks);

            if (requiresExecution && successCount === 0) {
              result.executionValidated = false;
              result.response =
                '⚠️ A IA tentou agir, mas nenhuma ação foi aplicada com sucesso no mapa. Ajustei o fluxo para não reportar sucesso falso.';
            } else {
              result.executionValidated = true;
            }
          } else if (requiresExecution) {
            result.executionValidated = false;
            result.response =
              '⚠️ Nenhuma ação real foi executada no mapa. Ajuste sua instrução ou selecione um contexto mais específico.';
          }
        } catch (apiError) {
          const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
          console.error('Claude API call failed:', errMsg);
          this.markAllTodosFailed(callbacks);
          callbacks?.onError?.(errMsg);

          const isMethodError = errMsg.includes('API 405') || errMsg.includes('Stream API 405');
          if (isMethodError) {
            throw new Error(
              `❌ Erro ao chamar API de IA: ${errMsg}\n\n🌐 Diagnóstico: endpoint de IA recebeu método não permitido (405).\nIsso normalmente acontece quando o frontend chama o domínio errado para /api.\n\n✅ Verifique VITE_API_URL apontando para o backend Render.`
            );
          }

          throw new Error(`❌ Erro ao chamar Claude API: ${errMsg}`);
        }
      }

      // Mark todos based on real execution outcome
      if (result.executionValidated === false) {
        this.markAllTodosFailed(callbacks);
      } else {
        this.currentTodos.forEach((t) => {
          t.status = 'completed';
        });
      }
      callbacks?.onTodoUpdate?.([...this.currentTodos]);

      // Record agent response
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
        ? '💡 **Possíveis soluções:**\n- Configure `VITE_API_URL` para o backend Render\n- Faça redeploy no Vercel após atualizar variáveis\n- Confirme no Network que a URL chamada é `https://...onrender.com/api/ai/...`'
        : '💡 **Possíveis soluções:**\n- Verifique se CLAUDE_API_KEY está configurada no backend (.env)\n- Verifique se o backend está rodando na porta 3001\n- Verifique os logs do terminal do backend';

      const errorResponse: AgentResponse = {
        response: `❌ **Erro na IA**\n\n${errMsg}\n\n${errorHint}`,
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

  // ─── TODO Management (Real-Time) ─────────────────────────────────────

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

  // ─── Streaming API Call (Primary Path) ─────────────────────────────────

  private async callStreamingAPI(
    userMessage: string,
    mapContext: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null,
    callbacks?: StreamCallbacks
  ): Promise<AgentResponse> {
    const history = formatConversationHistory(
      this.conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      8
    );

    const contextMessage = `${mapContext}\n\n---\n\nMensagem do usuário: ${userMessage}`;
    const messages =
      history.length > 0
        ? [...history.slice(0, -1), { role: 'user' as const, content: contextMessage }]
        : [{ role: 'user' as const, content: contextMessage }];

    // ALWAYS use /agent/stream — it works reliably with tool-use
    const body = {
      model: 'claude-haiku-4-5', // FIXED: Always Haiku
      mode: this.config.mode,
      systemPrompt: this.buildEffectiveSystemPrompt(),
      messages,
      tools: AGENT_TOOLS,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
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
      if (response.status === 405) {
        throw new Error(
          `Stream API 405: Method Not Allowed. URL chamada: ${apiBaseUrl}/api/ai/agent/stream`
        );
      }
      throw new Error(`Stream API ${response.status}: ${errText}`);
    }

    // Mark "analyze context" as done, "process with Claude" as active
    this.updateTodo('todo_1', 'completed', callbacks);
    this.updateTodo('todo_2', 'in-progress', callbacks);
    callbacks?.onThinkingUpdate?.('🤖 Claude Haiku 4.5 — processando...');

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
    let lastEventName = '';
    let toolsStarted = false;
    const seenToolIds = new Set<string>();

    const pushToolCall = (tool: { id?: string; name?: string; input?: any }) => {
      if (!tool?.name) return;
      const toolId = tool.id || `tool_${Date.now()}_${toolCalls.length}`;
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
                  callbacks?.onThinkingUpdate?.(`🤖 **Claude Haiku 4.5** — Agente pronto`);
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
                  // Detailed action step reporting
                  const actionDetail = this.formatToolStartMessage(data.name);
                  callbacks?.onActionStep?.(actionDetail, this.getToolIcon(data.name));
                  callbacks?.onToolStart?.(data.name, actionDetail);
                  break;
                }

                case 'tool_complete': {
                  pushToolCall({ id: data.id, name: data.name, input: data.input });
                  // Detailed completion message
                  const completionDetail = this.formatToolCompleteMessage(data.name, data.input);
                  callbacks?.onActionStep?.(completionDetail, '✅');
                  callbacks?.onToolComplete?.(data.name, data.input, completionDetail);
                  break;
                }

                case 'complete':
                  usage = data.usage;
                  model = data.model || 'claude-haiku-4-5';
                  if (Array.isArray(data.content)) {
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
                  // Handle data without explicit event name
                  if (data.text !== undefined && data.accumulated !== undefined) {
                    textAccumulator = data.accumulated;
                    callbacks?.onTextDelta?.(data.text, data.accumulated);
                  } else if (data.name && data.input) {
                    if (!toolsStarted) {
                      toolsStarted = true;
                      this.updateTodo('todo_2', 'completed', callbacks);
                      this.updateTodo('todo_3', 'in-progress', callbacks);
                    }
                    pushToolCall({ name: data.name, input: data.input });
                    callbacks?.onToolComplete?.(data.name, data.input);
                  } else if (data.message) {
                    callbacks?.onThinkingUpdate?.(data.message);
                  } else if (data.content) {
                    usage = data.usage;
                    model = data.model || 'claude-haiku-4-5';
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

    // ── Execute tool calls on the map ──────────────────────────────────
    let actions: AIAgentAction[] = [];
    let toolResults: ExecutionResult[] | undefined;
    const requiresExecution = this.isActionDrivenRequest();

    if (toolCalls.length > 0 && this.executionContext) {
      this.updateTodo('todo_3', 'in-progress', callbacks);

      toolResults = actionExecutor.executeAll(
        toolCalls.map((tc) => ({ name: tc.name as AgentToolName, input: tc.input })),
        this.executionContext
      );
      actions = this.toolResultsToActions(toolCalls, toolResults);

      this.updateTodo('todo_3', 'completed', callbacks);
    } else if (toolCalls.length === 0) {
      if (requiresExecution) {
        this.updateTodo('todo_3', 'failed', callbacks);
      } else {
        this.updateTodo('todo_3', 'completed', callbacks);
      }
    } else if (!this.executionContext) {
      this.updateTodo('todo_3', 'failed', callbacks);
    }

    // Mark finalize as done
    this.updateTodo('todo_4', 'in-progress', callbacks);

    // Parse thinking from response
    let thinking = '';
    let mainResponse = textAccumulator;

    const thinkingMatch = textAccumulator.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      thinking = thinkingMatch[1].trim();
      mainResponse = textAccumulator.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    }

    // If tools ran but no text, generate summary
    if (!mainResponse && toolCalls.length > 0) {
      const toolSummary = toolCalls.map((tc) => {
        if (tc.name === 'batch_create_nodes' || tc.name === 'create_nodes')
          return `Criados ${tc.input.nodes?.length || 0} nós`;
        if (tc.name === 'create_node') return `Criado nó "${tc.input.label}"`;
        if (tc.name === 'update_node') return `Atualizado nó`;
        if (tc.name === 'delete_node') return `Removido nó`;
        if (tc.name === 'create_edge' || tc.name === 'create_edges')
          return `Criada(s) conexão(ões)`;
        return `Executado ${tc.name}`;
      });
      mainResponse = `✅ **Ações executadas com sucesso!**\n\n${toolSummary.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    }

    this.updateTodo('todo_4', 'completed', callbacks);

    const successfulToolExecutions = (toolResults || []).filter((r) => r.success).length;
    const executionValidated = requiresExecution
      ? successfulToolExecutions > 0 ||
        toolCalls.some((t) => t.name === 'analyze_map' || t.name === 'find_nodes')
      : true;

    if (!executionValidated && requiresExecution) {
      mainResponse =
        '⚠️ Nenhuma ação real foi executada com sucesso no mapa nesta tentativa. Ajustei para não reportar sucesso falso. Tente um comando mais específico (ex: "crie 5 nós filhos sobre X").';
    }

    return {
      response: mainResponse || 'Processamento concluído.',
      actions,
      thinking,
      todoList: this.currentTodos,
      confidence: toolCalls.length > 0 ? 0.95 : 0.85,
      toolResults,
      usage,
      model,
      streaming: true,
      executionValidated,
    };
  }

  // ─── Regular API Call (non-streaming fallback) ────────────────────────

  private async callAgentAPI(
    userMessage: string,
    mapContext: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null
  ): Promise<{ agentResponse: AgentResponse; toolCalls: ToolUseBlock[] }> {
    const history = formatConversationHistory(
      this.conversationHistory.map((m) => ({ role: m.role, content: m.content })),
      8
    );

    const contextMessage = `${mapContext}\n\n---\n\nMensagem do usuário: ${userMessage}`;
    const messages =
      history.length > 0
        ? [...history.slice(0, -1), { role: 'user' as const, content: contextMessage }]
        : [{ role: 'user' as const, content: contextMessage }];

    const body = {
      model: 'claude-haiku-4-5', // FIXED: Always Haiku
      mode: this.config.mode,
      systemPrompt: this.buildEffectiveSystemPrompt(),
      messages,
      tools: AGENT_TOOLS,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
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
      if (response.status === 405) {
        throw new Error(`API 405: Method Not Allowed. URL chamada: ${apiBaseUrl}/api/ai/agent`);
      }
      throw new Error(`API ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return this.parseAPIResponse(data);
  }

  private parseAPIResponse(data: any): { agentResponse: AgentResponse; toolCalls: ToolUseBlock[] } {
    const content: ContentBlock[] = data.data?.content || data.content || [];
    const toolCalls: ToolUseBlock[] = [];
    let textResponse = '';
    let thinking = '';

    for (const block of content) {
      if (block.type === 'text') {
        textResponse += (block as TextBlock).text;
      } else if (block.type === 'tool_use') {
        toolCalls.push(block as ToolUseBlock);
      }
    }

    // Extract thinking tags
    const thinkingMatch = textResponse.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      thinking = thinkingMatch[1].trim();
      textResponse = textResponse.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    }

    const confidence = toolCalls.length > 0 ? 0.95 : 0.8;

    if (toolCalls.length > 0 && !textResponse.trim()) {
      const toolNames = toolCalls.map((tc) => {
        if (tc.name === 'batch_create_nodes' || tc.name === 'create_nodes')
          return `Criar ${tc.input.nodes?.length || 'vários'} nós`;
        if (tc.name === 'create_node') return `Criar "${tc.input.label}"`;
        return tc.name;
      });
      textResponse = `✅ **Executando ${toolCalls.length} ação(ões):**\n\n${toolNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;
    }

    return {
      agentResponse: {
        response: textResponse.trim() || 'Ações executadas com sucesso.',
        actions: [],
        thinking,
        confidence,
        todoList: this.currentTodos,
        usage: data.usage || data.data?.usage,
        model: 'claude-haiku-4-5',
        executionValidated: toolCalls.length > 0,
      },
      toolCalls,
    };
  }

  // ─── Context Building ─────────────────────────────────────────────────

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

  // ─── Tool Results → Actions ───────────────────────────────────────────

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

  // ─── Detailed Streaming Messages (VS Code Style) ──────────────────────

  private getToolIcon(toolName: string): string {
    const icons: Record<string, string> = {
      create_node: '➕',
      batch_create_nodes: '🌳',
      update_node: '✏️',
      batch_update_nodes: '📝',
      delete_node: '🗑️',
      create_edge: '🔗',
      create_edges: '🕸️',
      delete_edge: '✂️',
      analyze_map: '🔍',
      reorganize_map: '📐',
      find_nodes: '🔎',
    };
    return icons[toolName] || '⚡';
  }

  private formatToolStartMessage(toolName: string): string {
    const messages: Record<string, string> = {
      create_node: 'Criando novo nó no mapa...',
      batch_create_nodes: 'Criando múltiplos nós em batch...',
      update_node: 'Atualizando nó existente...',
      batch_update_nodes: 'Atualizando vários nós...',
      delete_node: 'Removendo nó do mapa...',
      create_edge: 'Criando conexão entre nós...',
      create_edges: 'Criando múltiplas conexões...',
      delete_edge: 'Removendo conexão...',
      analyze_map: 'Analisando estrutura do mapa...',
      reorganize_map: 'Reorganizando layout do mapa...',
      find_nodes: 'Buscando nós no mapa...',
    };
    return messages[toolName] || `Executando ${toolName}...`;
  }

  private formatToolCompleteMessage(toolName: string, input: any): string {
    switch (toolName) {
      case 'create_node': {
        return `Nó criado: "${input.label}" (tipo: ${input.type})`;
      }

      case 'batch_create_nodes': {
        const count = input.nodes?.length || 0;
        const types = [...new Set((input.nodes || []).map((n: any) => n.type))];
        return `${count} nós criados (tipos: ${types.join(', ')})`;
      }

      case 'update_node': {
        const fields = Object.keys(input)
          .filter((k) => k !== 'nodeId')
          .join(', ');
        return `Nó atualizado (campos: ${fields})`;
      }

      case 'batch_update_nodes':
        return `${input.updates?.length || 0} nós atualizados`;

      case 'delete_node':
        return `Nó removido (${input.reason || 'sem motivo especificado'})`;

      case 'create_edge':
        return `Conexão criada${input.label ? `: "${input.label}"` : ''}`;

      case 'analyze_map':
        return `Análise completa (foco: ${input.focus || 'all'})`;

      case 'reorganize_map':
        return `Mapa reorganizado (estratégia: ${input.strategy})`;

      case 'find_nodes':
        return `Busca concluída${input.query ? `: "${input.query}"` : ''}`;

      default:
        return `${toolName} concluído`;
    }
  }
}

// Singleton
export const neuralAgent = new NeuralAIAgent();
