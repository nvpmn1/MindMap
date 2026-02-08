// ============================================================================
// NeuralMap - AI Agent Engine v3 (Complete Rewrite)
// REAL Claude API tool-use Agent Mode with Streaming
// No more silent fallback — pure Claude-powered intelligence
// ============================================================================

import type {
  NeuralNodeType, NeuralNodeData, AIAgentMessage, AIAgentAction,
  AIAgentConfig, AIAgentMode, PowerNode, PowerEdge, ChartData, TableData
} from '../editor/types';
import { NODE_TYPE_CONFIG } from '../editor/constants';
import { AGENT_TOOLS, type AgentToolName } from './tools';
import { buildSystemPrompt, buildMapContextMessage, formatConversationHistory } from './prompts';
import { actionExecutor, type ExecutionContext, type ExecutionResult } from './ActionExecutor';
import { getAccessToken } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

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
  onToolStart?: (toolName: string) => void;
  onToolComplete?: (toolName: string, input: any) => void;
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

// ─── Neural Agent v3 ────────────────────────────────────────────────────────

export class NeuralAIAgent {
  private config: AIAgentConfig;
  private conversationHistory: AIAgentMessage[] = [];
  private isProcessing = false;
  private executionContext: ExecutionContext | null = null;
  private currentTodos: AgentTodoItem[] = [];
  private agentType: string = 'chat'; // Default to chat, can be set per request

  constructor() {
    this.config = {
      model: 'auto',  // Auto-select best model based on complexity
      mode: 'agent',
      temperature: 0.7,
      maxTokens: 4096,
      tools: AGENT_TOOLS.map(t => t.name),
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

  // ─── Main Entry Point ─────────────────────────────────────────────────

  /**
   * Process a user message with REAL Claude API
   * Uses streaming for real-time feedback with TODO list
   */
  async processMessage(
    message: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null,
    callbacks?: StreamCallbacks,
    agentType?: string,
  ): Promise<AgentResponse> {
    if (this.isProcessing) {
      return { response: '⏳ Aguarde, estou processando a tarefa anterior...', actions: [] };
    }

    // Set agent type if provided
    if (agentType) {
      this.agentType = agentType;
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
      // Build context
      const mapContext = this.buildContext(nodes, edges, selectedNodeId);

      // Generate TODO plan
      callbacks?.onThinkingStart?.();
      const todos = this.generateTodoPlan(message, nodes, selectedNodeId);
      this.currentTodos = todos;
      callbacks?.onTodoUpdate?.(todos);

      // Mark first todo as in-progress
      if (todos.length > 0) {
        todos[0].status = 'in-progress';
        callbacks?.onTodoUpdate?.([...todos]);
      }

      callbacks?.onThinkingUpdate?.('Conectando com Claude AI...');

      // Try streaming first, fall back to regular API call
      let result: AgentResponse;

      try {
        result = await this.callStreamingAPI(message, mapContext, nodes, edges, selectedNodeId, callbacks);
      } catch (streamError) {
        console.warn('Streaming unavailable, trying regular API:', streamError);
        callbacks?.onThinkingUpdate?.('Processando via API direta...');

        try {
          const apiResult = await this.callAgentAPI(message, mapContext, nodes, edges, selectedNodeId);
          result = apiResult.agentResponse;

          // Execute tool calls from Claude
          if (apiResult.toolCalls.length > 0 && this.executionContext) {
            // Progress todos
            this.progressTodos(callbacks);

            const execResults = actionExecutor.executeAll(
              apiResult.toolCalls.map(tc => ({ name: tc.name as AgentToolName, input: tc.input })),
              this.executionContext,
            );
            result.toolResults = execResults;
            result.actions = this.toolResultsToActions(apiResult.toolCalls, execResults);

            // Update response with execution info
            const successCount = execResults.filter(r => r.success).length;
            const failCount = execResults.filter(r => !r.success).length;
            if (successCount > 0) {
              result.response += `\n\n⚡ ${successCount} ação(ões) executada(s) com sucesso${failCount > 0 ? `, ${failCount} falhou(aram)` : ''}.`;
            }
          }
        } catch (apiError) {
          const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
          console.error('Claude API call failed:', errMsg);

          // Mark todos as failed
          this.currentTodos.forEach(t => { if (t.status !== 'completed') t.status = 'failed'; });
          callbacks?.onTodoUpdate?.([...this.currentTodos]);
          callbacks?.onError?.(errMsg);

          throw new Error(`❌ Erro ao chamar Claude API: ${errMsg}\n\n🔑 Verifique se CLAUDE_API_KEY está configurada no backend.`);
        }
      }

      // Mark remaining todos as completed
      this.currentTodos.forEach(t => { if (t.status === 'in-progress' || t.status === 'planning') t.status = 'completed'; });
      callbacks?.onTodoUpdate?.([...this.currentTodos]);

      // Record agent response
      const assistantMsg: AIAgentMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: result.response,
        timestamp: new Date().toISOString(),
        metadata: {
          model: result.model || this.config.model,
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

      const errorResponse: AgentResponse = {
        response: `❌ **Erro na IA**\n\n${errMsg}\n\n💡 **Possíveis soluções:**\n- Verifique se CLAUDE_API_KEY está configurada no backend (.env)\n- Verifique se o backend está rodando na porta 3001\n- Verifique os logs do terminal do backend`,
        actions: [],
        confidence: 0,
        todoList: this.currentTodos,
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

  // ─── TODO Plan Generation ─────────────────────────────────────────────

  private generateTodoPlan(message: string, nodes: PowerNode[], selectedNodeId?: string | null): AgentTodoItem[] {
    const lmsg = message.toLowerCase();
    const todos: AgentTodoItem[] = [];
    let id = 1;

    // Always start with analysis
    todos.push({ id: `todo_${id++}`, title: 'Analisar contexto do mapa', status: 'planning' });

    if (this.matchIntent(lmsg, ['cri(e|a|ar) (um )?mapa', 'mapa sobre', 'monte', 'estrutur'])) {
      todos.push({ id: `todo_${id++}`, title: 'Planejar estrutura do mapa', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Criar nó central com tema', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Criar ramos principais', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Adicionar sub-tópicos detalhados', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Aplicar tipos e prioridades', status: 'planning' });
    } else if (this.matchIntent(lmsg, ['expand', 'detalh', 'aprofund', 'desenvolv'])) {
      todos.push({ id: `todo_${id++}`, title: 'Analisar nó selecionado', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Gerar sub-tópicos com Claude', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Criar nós filhos detalhados', status: 'planning' });
    } else if (this.matchIntent(lmsg, ['tarefa', 'task', 'plano', 'ação', 'to.?do'])) {
      todos.push({ id: `todo_${id++}`, title: 'Analisar contexto para tarefas', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Gerar tarefas com Claude AI', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Definir prioridades e prazos', status: 'planning' });
    } else if (this.matchIntent(lmsg, ['analis', 'resum', 'estat[ií]stica', 'overview'])) {
      todos.push({ id: `todo_${id++}`, title: 'Coletar métricas do mapa', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Identificar padrões e gaps', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Gerar insights e recomendações', status: 'planning' });
    } else if (this.matchIntent(lmsg, ['ideia', 'sugest', 'brainstorm', 'criativ'])) {
      todos.push({ id: `todo_${id++}`, title: 'Brainstorming com Claude AI', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Gerar ideias diversificadas', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Organizar e categorizar', status: 'planning' });
    } else if (this.matchIntent(lmsg, ['pesquis', 'research', 'investig', 'estud'])) {
      todos.push({ id: `todo_${id++}`, title: 'Pesquisar tema com Claude', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Criar nós de pesquisa', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Adicionar fontes e referências', status: 'planning' });
    } else if (this.matchIntent(lmsg, ['organiz', 'reorg', 'arrum'])) {
      todos.push({ id: `todo_${id++}`, title: 'Analisar estrutura atual', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Planejar reorganização', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Executar mudanças', status: 'planning' });
    } else {
      todos.push({ id: `todo_${id++}`, title: 'Processar com Claude AI', status: 'planning' });
      todos.push({ id: `todo_${id++}`, title: 'Executar ações necessárias', status: 'planning' });
    }

    todos.push({ id: `todo_${id++}`, title: 'Finalizar e reportar', status: 'planning' });
    return todos;
  }

  private progressTodos(callbacks?: StreamCallbacks) {
    const currentIdx = this.currentTodos.findIndex(t => t.status === 'in-progress');
    if (currentIdx >= 0) {
      this.currentTodos[currentIdx].status = 'completed';
      if (currentIdx + 1 < this.currentTodos.length) {
        this.currentTodos[currentIdx + 1].status = 'in-progress';
      }
      callbacks?.onTodoUpdate?.([...this.currentTodos]);
    }
  }

  // ─── Streaming API Call ───────────────────────────────────────────────

  private async callStreamingAPI(
    userMessage: string,
    mapContext: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null,
    callbacks?: StreamCallbacks,
  ): Promise<AgentResponse> {
    const history = formatConversationHistory(
      this.conversationHistory.map(m => ({ role: m.role, content: m.content })),
      8,
    );

    const contextMessage = `${mapContext}\n\n---\n\nMensagem do usuário: ${userMessage}`;
    const messages = history.length > 0
      ? [...history.slice(0, -1), { role: 'user' as const, content: contextMessage }]
      : [{ role: 'user' as const, content: contextMessage }];

    // Use new neural endpoint if agent type is specified  
    const useNewEndpoint = (this.agentType && this.agentType !== 'chat') || 
                           (['generate', 'expand', 'summarize', 'analyze', 'organize', 'research', 'hypothesize', 'task_convert', 'critique', 'connect', 'visualize'].includes(this.agentType));

    const body = useNewEndpoint
      ? {
          // New NeuralOrchestrator format
          map_id: 'frontend-temp', // Will be set by AgentPanel
          agent_type: this.agentType || 'chat',
          message: userMessage,
          context: {
            nodes: nodes.map(n => ({ id: n.id, label: n.data.label, type: n.data.type, content: n.data.content })),
            edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
            selected_node: selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : undefined,
            conversation_history: messages,
          },
          options: {
            model: this.config.model === 'auto' ? undefined : this.config.model,
          },
          stream: true,
        }
      : {
          // Old format for backward compatibility
          model: this.config.model,
          mode: this.config.mode,
          systemPrompt: buildSystemPrompt(this.config.mode),
          messages,
          tools: AGENT_TOOLS,
          maxTokens: this.config.maxTokens,
          temperature: this.config.temperature,
        };

    const headers = await this.buildAuthHeaders();
    const endpoint = useNewEndpoint ? '/api/ai/neural/stream' : '/api/ai/agent/stream';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Stream API ${response.status}: ${errText}`);
    }

    return this.handleSSEStream(response, callbacks);
  }

  private async handleSSEStream(
    response: Response,
    callbacks?: StreamCallbacks,
  ): Promise<AgentResponse> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body reader');

    const decoder = new TextDecoder();
    let textAccumulator = '';
    const toolCalls: ToolUseBlock[] = [];
    let usage: any = null;
    let model = '';
    let lastEventName = '';

    try {
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

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
                  callbacks?.onThinkingUpdate?.(
                    `🤖 **${data.model}** selecionado - ${data.reason}\n_(Complexidade: ${data.complexity})_`
                  );
                  break;

                case 'thinking_start':
                  callbacks?.onThinkingUpdate?.(data.message || 'Analisando...');
                  this.progressTodos(callbacks);
                  break;

                case 'text_start':
                  this.progressTodos(callbacks);
                  break;

                case 'text_delta':
                  textAccumulator = data.accumulated || (textAccumulator + (data.text || ''));
                  callbacks?.onTextDelta?.(data.text || '', textAccumulator);
                  break;

                case 'text_complete':
                  textAccumulator = data.text || textAccumulator;
                  break;

                case 'tool_start':
                  callbacks?.onToolStart?.(data.name);
                  this.progressTodos(callbacks);
                  break;

                case 'tool_complete':
                  toolCalls.push({
                    type: 'tool_use',
                    id: `tool_${Date.now()}_${toolCalls.length}`,
                    name: data.name,
                    input: data.input,
                  });
                  callbacks?.onToolComplete?.(data.name, data.input);
                  break;

                case 'complete':
                  usage = data.usage;
                  model = data.model;
                  break;

                case 'error':
                  throw new Error(data.error);

                case 'done':
                  break;

                default:
                  // Handle data without event name
                  if (data.text !== undefined && data.accumulated !== undefined) {
                    textAccumulator = data.accumulated;
                    callbacks?.onTextDelta?.(data.text, data.accumulated);
                  } else if (data.name && data.input) {
                    toolCalls.push({
                      type: 'tool_use',
                      id: `tool_${Date.now()}_${toolCalls.length}`,
                      name: data.name,
                      input: data.input,
                    });
                    callbacks?.onToolComplete?.(data.name, data.input);
                  } else if (data.message) {
                    callbacks?.onThinkingUpdate?.(data.message);
                  } else if (data.content) {
                    usage = data.usage;
                    model = data.model;
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

    // Execute tool calls
    let actions: AIAgentAction[] = [];
    let toolResults: ExecutionResult[] | undefined;

    if (toolCalls.length > 0 && this.executionContext) {
      toolResults = actionExecutor.executeAll(
        toolCalls.map(tc => ({ name: tc.name as AgentToolName, input: tc.input })),
        this.executionContext,
      );
      actions = this.toolResultsToActions(toolCalls, toolResults);
    }

    // Parse thinking
    let thinking = '';
    let mainResponse = textAccumulator;

    const thinkingMatch = textAccumulator.match(/<thinking>([\s\S]*?)<\/thinking>/);
    if (thinkingMatch) {
      thinking = thinkingMatch[1].trim();
      mainResponse = textAccumulator.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    }

    // If tools ran but no text, generate summary
    if (!mainResponse && toolCalls.length > 0) {
      const toolSummary = toolCalls.map(tc => {
        if (tc.name === 'batch_create_nodes') return `Criados ${tc.input.nodes?.length || 0} nós`;
        if (tc.name === 'create_node') return `Criado nó "${tc.input.label}"`;
        if (tc.name === 'update_node') return `Atualizado nó`;
        if (tc.name === 'delete_node') return `Removido nó`;
        return `Executado ${tc.name}`;
      });
      mainResponse = `✅ **Ações executadas com sucesso!**\n\n${toolSummary.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
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
    };
  }

  // ─── Regular API Call (non-streaming fallback) ────────────────────────

  private async callAgentAPI(
    userMessage: string,
    mapContext: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null,
  ): Promise<{ agentResponse: AgentResponse; toolCalls: ToolUseBlock[] }> {

    const history = formatConversationHistory(
      this.conversationHistory.map(m => ({ role: m.role, content: m.content })),
      8,
    );

    const contextMessage = `${mapContext}\n\n---\n\nMensagem do usuário: ${userMessage}`;
    const messages = history.length > 0
      ? [...history.slice(0, -1), { role: 'user' as const, content: contextMessage }]
      : [{ role: 'user' as const, content: contextMessage }];

    const body = {
      model: this.config.model,
      mode: this.config.mode,
      systemPrompt: buildSystemPrompt(this.config.mode),
      messages,
      tools: AGENT_TOOLS,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
    };

    const headers = await this.buildAuthHeaders();

    const response = await fetch(`/api/ai/agent`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
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
      const toolNames = toolCalls.map(tc => {
        if (tc.name === 'batch_create_nodes') return `Criar ${tc.input.nodes?.length || 'vários'} nós`;
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
        model: data.model || data.data?.model,
      },
      toolCalls,
    };
  }

  // ─── Context Building ─────────────────────────────────────────────────

  private buildContext(nodes: PowerNode[], edges: PowerEdge[], selectedNodeId?: string | null): string {
    const edgeList = edges.map(e => ({ source: e.source, target: e.target }));

    const nodeList = nodes.map(n => ({
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
      parentIds: edges.filter(e => e.target === n.id).map(e => e.source),
      childIds: edges.filter(e => e.source === n.id).map(e => e.target),
    }));

    return buildMapContextMessage({
      nodes: nodeList,
      edges: edgeList,
      selectedNodeId,
      mapTitle: document.title.replace(' - NeuralMap', ''),
    });
  }

  // ─── Tool Results → Actions ───────────────────────────────────────────

  private toolResultsToActions(toolCalls: ToolUseBlock[], results: ExecutionResult[]): AIAgentAction[] {
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

  // ─── Helpers ──────────────────────────────────────────────────────────

  private matchIntent(text: string, patterns: string[]): boolean {
    return patterns.some(p => new RegExp(p, 'i').test(text));
  }
}

// Singleton
export const neuralAgent = new NeuralAIAgent();
