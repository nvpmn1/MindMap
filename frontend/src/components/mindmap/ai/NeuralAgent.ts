// ============================================================================
// NeuralMap - AI Agent Engine v2 (Complete Rewrite)
// Claude Haiku tool-use powered Agent Mode
// ============================================================================

import type {
  NeuralNodeType, NeuralNodeData, AIAgentMessage, AIAgentAction,
  AIAgentConfig, AIAgentMode, PowerNode, PowerEdge, ChartData, TableData
} from '../editor/types';
import { NODE_TYPE_CONFIG } from '../editor/constants';
import { AGENT_TOOLS, type AgentToolName } from './tools';
import { buildSystemPrompt, buildMapContextMessage, formatConversationHistory } from './prompts';
import { actionExecutor, type ExecutionContext, type ExecutionResult } from './ActionExecutor';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AgentResponse {
  response: string;
  actions: AIAgentAction[];
  thinking?: string;
  insights?: string[];
  nextSteps?: string[];
  confidence?: number;
  toolResults?: ExecutionResult[];
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

// ─── Neural Agent v2 ────────────────────────────────────────────────────────

export class NeuralAIAgent {
  private config: AIAgentConfig;
  private conversationHistory: AIAgentMessage[] = [];
  private isProcessing = false;
  private executionContext: ExecutionContext | null = null;

  constructor() {
    this.config = {
      model: 'claude-haiku-4-5-20250201',
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
  }

  /**
   * Set the execution context so the agent can directly modify the map
   */
  setExecutionContext(ctx: ExecutionContext) {
    this.executionContext = ctx;
  }

  /**
   * Main entry point: process a user message
   */
  async processMessage(
    message: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null,
  ): Promise<AgentResponse> {
    if (this.isProcessing) {
      return { response: 'Aguarde, estou processando...', actions: [] };
    }

    this.isProcessing = true;

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

      // Try the backend API (Claude tool-use)
      const result = await this.callAgentAPI(message, mapContext, nodes, edges, selectedNodeId);

      // Execute tool calls if we have execution context
      if (result.toolCalls && result.toolCalls.length > 0 && this.executionContext) {
        const execResults = actionExecutor.executeAll(
          result.toolCalls.map(tc => ({ name: tc.name as AgentToolName, input: tc.input })),
          this.executionContext,
        );
        result.agentResponse.toolResults = execResults;

        // Convert tool results to AIAgentActions for the UI
        result.agentResponse.actions = this.toolResultsToActions(result.toolCalls, execResults);
      }

      // Record agent response in history
      const assistantMsg: AIAgentMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: result.agentResponse.response,
        timestamp: new Date().toISOString(),
        metadata: {
          model: this.config.model,
          mode: this.config.mode,
          actions: result.agentResponse.actions,
          reasoning: result.agentResponse.thinking,
          confidence: result.agentResponse.confidence,
        },
      };
      this.conversationHistory.push(assistantMsg);

      return result.agentResponse;
    } catch (error) {
      console.error('AI Agent error:', error);
      // Intelligent local fallback
      const fallback = this.localFallback(message, nodes, edges, selectedNodeId);
      
      const assistantMsg: AIAgentMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'agent',
        content: fallback.response,
        timestamp: new Date().toISOString(),
        metadata: { mode: this.config.mode, confidence: fallback.confidence },
      };
      this.conversationHistory.push(assistantMsg);

      return fallback;
    } finally {
      this.isProcessing = false;
    }
  }

  // ─── API Communication ────────────────────────────────────────────────

  private async callAgentAPI(
    userMessage: string,
    mapContext: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null,
  ): Promise<{
    agentResponse: AgentResponse;
    toolCalls: ToolUseBlock[];
  }> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    // Build messages for the API
    const history = formatConversationHistory(
      this.conversationHistory.map(m => ({ role: m.role, content: m.content })),
      8,
    );

    // Prepend map context to the latest user message
    const contextMessage = `${mapContext}\n\n---\n\nMensagem do usuário: ${userMessage}`;

    // Replace last user message with context-enriched version
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

    const response = await fetch(`${API_URL}/api/ai/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API ${response.status}: ${errText}`);
    }

    const data = await response.json();

    // Parse response - the backend returns Claude's raw content blocks
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

    // Try to extract structured data from text response
    let insights: string[] | undefined;
    let nextSteps: string[] | undefined;
    let confidence = toolCalls.length > 0 ? 0.9 : 0.7;

    // Try parsing as JSON if it looks like one
    if (textResponse.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(textResponse);
        textResponse = parsed.response || textResponse;
        thinking = parsed.thinking || '';
        insights = parsed.insights;
        nextSteps = parsed.nextSteps;
        confidence = parsed.confidence || confidence;
      } catch { /* not JSON, use as-is */ }
    }

    // If the AI used tools, enhance the response
    if (toolCalls.length > 0 && !textResponse.trim()) {
      const toolNames = toolCalls.map(tc => tc.name).join(', ');
      textResponse = `Executei ${toolCalls.length} ação(ões): ${toolNames}`;
    }

    return {
      agentResponse: {
        response: textResponse.trim() || 'Ações executadas com sucesso.',
        actions: [],
        thinking,
        insights,
        nextSteps,
        confidence,
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

  // ─── Tool Results → Actions Conversion ─────────────────────────────────

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

  // ─── Intelligent Local Fallback ────────────────────────────────────────
  // When the backend API is unavailable, use intelligent local processing

  private localFallback(
    message: string,
    nodes: PowerNode[],
    edges: PowerEdge[],
    selectedNodeId?: string | null,
  ): AgentResponse {
    const lmsg = message.toLowerCase();
    const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) ?? null : null;

    // ─── Intent Detection ────────────────────────────────────────────
    
    // Create map / structure
    if (this.matchIntent(lmsg, ['cri(e|a|ar) (um )?mapa', 'mapa sobre', 'monte (um )?mapa', 'estrutur(e|a|ar)', 'gere (uma )?estrutura'])) {
      return this.fallbackCreateMap(message, nodes, selectedNode);
    }

    // Create node
    if (this.matchIntent(lmsg, ['cri(e|a|ar) (um |uma )?n[óo]', 'adicion(e|a|ar)', 'novo n[óo]', 'nova (ideia|tarefa|nota)', 'add'])) {
      return this.fallbackCreateNode(message, nodes, selectedNode);
    }

    // Edit / update
    if (this.matchIntent(lmsg, ['edit(e|a|ar)', 'alter(e|a|ar)', 'mud(e|a|ar)', 'atualiz(e|a|ar)', 'renam(e|ear)', 'renome(ie|ar)'])) {
      return this.fallbackUpdateNode(message, nodes, selectedNode);
    }

    // Delete
    if (this.matchIntent(lmsg, ['delet(e|a|ar)', 'remov(a|er|e)', 'exclu(a|ir|e)', 'apag(ue|ar|a)'])) {
      return this.fallbackDeleteNode(message, nodes, selectedNode);
    }

    // Analyze
    if (this.matchIntent(lmsg, ['analis(e|ar|a)', 'resum(a|o|ir)', 'estat[ií]stica', 'visão geral', 'overview'])) {
      return this.fallbackAnalyze(nodes, edges);
    }

    // Ideas / brainstorm
    if (this.matchIntent(lmsg, ['ideia', 'sugest', 'brainstorm', 'criativ', 'inspira'])) {
      return this.fallbackGenIdeas(message, nodes, selectedNode);
    }

    // Tasks / plan
    if (this.matchIntent(lmsg, ['tarefa', 'task', 'plano', 'ação', 'to.?do', 'checklist'])) {
      return this.fallbackCreateTasks(message, nodes, selectedNode);
    }

    // Research
    if (this.matchIntent(lmsg, ['pesquis', 'research', 'investig', 'estud', 'aprofund'])) {
      return this.fallbackResearch(message, nodes, selectedNode);
    }

    // Charts / data
    if (this.matchIntent(lmsg, ['gr[áa]fico', 'chart', 'dado', 'tabela', 'dashboard', 'm[ée]trica'])) {
      return this.fallbackDataViz(nodes, edges);
    }

    // Expand
    if (this.matchIntent(lmsg, ['expand', 'detalh', 'aprofund', 'desenvolv', 'sub.?t[óo]pico'])) {
      return this.fallbackExpand(message, nodes, selectedNode);
    }

    // Organize
    if (this.matchIntent(lmsg, ['organiz', 'estrut', 'reorg', 'arrum', 'reorganiz'])) {
      return this.fallbackOrganize(nodes, edges);
    }

    // Complete / mark done
    if (this.matchIntent(lmsg, ['conclu', 'complet', 'finaliz', 'marqu? ?(como )?(feito|pronto|conclu[ií]do)'])) {
      return this.fallbackComplete(message, nodes, selectedNode);
    }

    // Priority
    if (this.matchIntent(lmsg, ['prioriz', 'prioridade', 'urgent', 'importante'])) {
      return this.fallbackPrioritize(message, nodes, selectedNode);
    }

    // Generic fallback with capabilities
    return this.fallbackGeneric(message, nodes, selectedNode);
  }

  private matchIntent(text: string, patterns: string[]): boolean {
    return patterns.some(p => new RegExp(p, 'i').test(text));
  }

  // ─── Fallback Actions ─────────────────────────────────────────────────

  private fallbackCreateMap(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    // Extract topic from message
    const topic = this.extractTopic(message, ['cria', 'criar', 'crie', 'mapa', 'sobre', 'monte', 'gere', 'estrutura', 'um', 'uma', 'de', 'para', 'do', 'da', 'no', 'na', 'meu', 'minha']);

    const parentId = selectedNode?.id || nodes[0]?.id;
    const actions: AIAgentAction[] = [];

    // Root node
    actions.push(this.mkAction('create_node', `Nó central: ${topic}`, {
      type: 'idea', label: `🧠 ${topic}`, description: `Mapa mental sobre ${topic}`, parentId,
    }));

    // Main branches
    const branches = [
      { label: `📋 Fundamentos de ${topic}`, type: 'note', desc: 'Conceitos base e definições fundamentais' },
      { label: `🎯 Objetivos e Metas`, type: 'milestone', desc: 'O que queremos alcançar' },
      { label: `💡 Estratégias e Ideias`, type: 'idea', desc: 'Abordagens e possibilidades' },
      { label: `📋 Plano de Ação`, type: 'task', desc: 'Tarefas concretas para execução' },
      { label: `🔬 Pesquisa e Referências`, type: 'research', desc: 'Fontes, dados e estudos relevantes' },
      { label: `📊 Métricas e Acompanhamento`, type: 'data', desc: 'KPIs e indicadores de sucesso' },
    ];

    for (const b of branches) {
      actions.push(this.mkAction('create_node', b.label, {
        type: b.type, label: b.label, description: b.desc, parentId,
        tags: [topic.split(' ')[0]?.toLowerCase() || 'geral'],
      }));
    }

    return {
      response: `🧠 **Mapa Mental sobre "${topic}" Criado!**\n\nEstruturei um mapa completo com:\n\n${branches.map((b, i) => `${i + 1}. **${b.label}**\n   ${b.desc}`).join('\n\n')}\n\n⚡ ${branches.length + 1} nós criados. Posso expandir qualquer ramo — selecione um nó e peça para detalhar!`,
      actions,
      thinking: `Criei estrutura inicial para "${topic}" com ${branches.length + 1} nós organizados em categorias`,
      insights: ['Estrutura criada com tipos variados para organização visual', 'Cada ramo pode ser expandido individualmente'],
      nextSteps: ['Peça para expandir qualquer ramo', 'Adicione tarefas específicas', 'Peça para criar um plano de ação'],
      confidence: 0.85,
    };
  }

  private fallbackCreateNode(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    const topic = this.extractTopic(message, ['cria', 'criar', 'crie', 'adiciona', 'adicionar', 'adicione', 'novo', 'nova', 'nó', 'no', 'um', 'uma', 'de', 'para', 'do', 'da', 'add']);
    
    // Detect type from message
    let type: NeuralNodeType = 'idea';
    const lmsg = message.toLowerCase();
    if (lmsg.includes('tarefa') || lmsg.includes('task')) type = 'task';
    else if (lmsg.includes('nota') || lmsg.includes('note')) type = 'note';
    else if (lmsg.includes('pesquisa') || lmsg.includes('research')) type = 'research';
    else if (lmsg.includes('dado') || lmsg.includes('data')) type = 'data';
    else if (lmsg.includes('pergunta') || lmsg.includes('questão')) type = 'question';
    else if (lmsg.includes('decisão') || lmsg.includes('decision')) type = 'decision';
    else if (lmsg.includes('marco') || lmsg.includes('milestone')) type = 'milestone';

    const parentId = selectedNode?.id || nodes[0]?.id;

    const actions: AIAgentAction[] = [
      this.mkAction('create_node', `Criado: ${topic}`, {
        type, label: topic || 'Novo nó', description: '', parentId,
        ai: { generated: true, model: 'local-fallback', confidence: 0.8 },
      }),
    ];

    return {
      response: `✅ **Nó criado!**\n\n- Tipo: ${NODE_TYPE_CONFIG[type]?.label || type}\n- Título: "${topic}"\n- Conectado a: "${selectedNode?.data.label || nodes[0]?.data.label || 'raiz'}"`,
      actions,
      confidence: 0.8,
    };
  }

  private fallbackUpdateNode(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    if (!selectedNode) {
      return {
        response: '⚠️ **Selecione um nó** para editar. Clique no nó que deseja modificar e tente novamente.',
        actions: [],
        confidence: 0.5,
      };
    }

    // Try to figure out what to update
    const lmsg = message.toLowerCase();
    const actions: AIAgentAction[] = [];
    const changes: string[] = [];

    // Extract new name if mentioned
    const nameMatch = message.match(/(?:para|como|nome|título|renome(?:ar|ie))\s+["']?(.+?)["']?\s*$/i);
    if (nameMatch) {
      actions.push(this.mkAction('update_node', `Renomeado para "${nameMatch[1]}"`, {
        nodeId: selectedNode.id, label: nameMatch[1],
      }));
      changes.push(`Título → "${nameMatch[1]}"`);
    }

    // Status changes
    if (lmsg.includes('conclu') || lmsg.includes('complet') || lmsg.includes('feito') || lmsg.includes('pronto')) {
      actions.push(this.mkAction('update_node', 'Status → concluído', { nodeId: selectedNode.id, status: 'completed', progress: 100 }));
      changes.push('Status → Concluído');
    } else if (lmsg.includes('bloque') || lmsg.includes('trav')) {
      actions.push(this.mkAction('update_node', 'Status → bloqueado', { nodeId: selectedNode.id, status: 'blocked' }));
      changes.push('Status → Bloqueado');
    } else if (lmsg.includes('revis') || lmsg.includes('review')) {
      actions.push(this.mkAction('update_node', 'Status → revisão', { nodeId: selectedNode.id, status: 'review' }));
      changes.push('Status → Em Revisão');
    }

    // Priority changes
    if (lmsg.includes('urgent')) {
      actions.push(this.mkAction('update_node', 'Prioridade → urgente', { nodeId: selectedNode.id, priority: 'urgent' }));
      changes.push('Prioridade → Urgente');
    } else if (lmsg.includes('alta') || lmsg.includes('high') || lmsg.includes('importante')) {
      actions.push(this.mkAction('update_node', 'Prioridade → alta', { nodeId: selectedNode.id, priority: 'high' }));
      changes.push('Prioridade → Alta');
    }

    if (actions.length === 0) {
      return {
        response: `🤔 Nó selecionado: **"${selectedNode.data.label}"**\n\nO que deseja alterar?\n- "renomeie para X"\n- "marque como concluído"\n- "mude prioridade para alta"\n- "mude status para bloqueado"`,
        actions: [],
        confidence: 0.5,
      };
    }

    return {
      response: `✏️ **"${selectedNode.data.label}" atualizado!**\n\n${changes.map(c => `• ${c}`).join('\n')}`,
      actions,
      confidence: 0.85,
    };
  }

  private fallbackDeleteNode(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    if (!selectedNode) {
      return {
        response: '⚠️ **Selecione o nó** que deseja remover e peça novamente.',
        actions: [],
        confidence: 0.5,
      };
    }

    return {
      response: `🗑️ **"${selectedNode.data.label}" removido!**\n\nO nó e todas as suas conexões foram removidos do mapa.`,
      actions: [this.mkAction('delete_node', `Removido: ${selectedNode.data.label}`, { nodeId: selectedNode.id })],
      confidence: 0.9,
    };
  }

  private fallbackAnalyze(nodes: PowerNode[], edges: PowerEdge[]): AgentResponse {
    const types = this.countBy(nodes, n => n.data.type);
    const totalProgress = nodes.reduce((s, n) => s + (n.data.progress || 0), 0);
    const avgProgress = nodes.length > 0 ? Math.round(totalProgress / nodes.length) : 0;
    const tasks = nodes.filter(n => n.data.type === 'task');
    const completed = tasks.filter(n => n.data.status === 'completed').length;
    const orphans = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id));

    const chart: ChartData = {
      type: 'pie', title: 'Distribuição por Tipo',
      labels: Object.keys(types).map(t => NODE_TYPE_CONFIG[t as NeuralNodeType]?.label || t),
      datasets: [{ label: 'Nós', data: Object.values(types) }],
    };

    const actions: AIAgentAction[] = [
      this.mkAction('create_node', 'Dashboard analítico', {
        type: 'data', label: '📊 Análise do Mapa',
        description: `${nodes.length} nós, ${edges.length} conexões, ${avgProgress}% progresso médio`,
        chart,
        table: {
          columns: [
            { key: 'metric', label: 'Métrica', type: 'text' as const },
            { key: 'value', label: 'Valor', type: 'number' as const },
          ],
          rows: [
            { metric: 'Total de Nós', value: nodes.length },
            { metric: 'Conexões', value: edges.length },
            { metric: 'Progresso Médio', value: `${avgProgress}%` },
            { metric: 'Tarefas Concluídas', value: `${completed}/${tasks.length}` },
            { metric: 'Nós Desconectados', value: orphans.length },
          ],
        },
      }),
    ];

    return {
      response: `📊 **Análise Completa do Mapa**\n\n📈 **Visão Geral:**\n- ${nodes.length} nós, ${edges.length} conexões\n- Progresso médio: ${avgProgress}%\n- Tarefas: ${completed}/${tasks.length} concluídas\n\n📋 **Por Tipo:**\n${Object.entries(types).map(([t, c]) => `- ${NODE_TYPE_CONFIG[t as NeuralNodeType]?.label || t}: ${c}`).join('\n')}\n\n${orphans.length > 0 ? `⚠️ **${orphans.length} nós desconectados** — considere conectá-los.\n` : ''}`,
      actions,
      thinking: 'Análise completa do mapa com métricas, distribuição e identificação de problemas',
      insights: [
        `Densidade de rede: ${(edges.length / Math.max(nodes.length * (nodes.length - 1) / 2, 1) * 100).toFixed(1)}%`,
        orphans.length > 0 ? `${orphans.length} nós sem conexão` : 'Todos os nós estão conectados',
        avgProgress < 30 ? 'Progresso baixo — foque nas tarefas de alta prioridade' : `Bom progresso geral: ${avgProgress}%`,
      ],
      nextSteps: ['Expandir nós com poucos filhos', 'Adicionar descrições aos nós vazios', 'Priorizar tarefas pendentes'],
      confidence: 0.92,
    };
  }

  private fallbackGenIdeas(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    const context = selectedNode?.data.label || this.extractTopic(message, ['ideia', 'sugestão', 'brainstorm', 'criativo', 'gere', 'gerar', 'para', 'sobre', 'de', 'do', 'da']);
    const parentId = selectedNode?.id || nodes[0]?.id;

    const templates = [
      { label: `Perspectiva alternativa sobre ${context}`, desc: 'Visão não-convencional que desafia o pensamento atual' },
      { label: `${context} + Automação`, desc: 'Oportunidades de automação e eficiência' },
      { label: `Impacto de ${context} no futuro`, desc: 'Tendências e projeções para os próximos anos' },
      { label: `Framework para ${context}`, desc: 'Modelo estruturado e replicável' },
      { label: `Benchmarks de ${context}`, desc: 'Referências e comparações de mercado' },
      { label: `Riscos e Mitigações de ${context}`, desc: 'Análise de riscos e plano de contingência' },
    ];

    const actions = templates.slice(0, 5).map(t =>
      this.mkAction('create_node', t.label, {
        type: 'idea', label: `💡 ${t.label}`, description: t.desc, parentId,
      })
    );

    return {
      response: `💡 **${templates.length} Ideias Geradas para "${context}"**\n\n${templates.slice(0, 5).map((t, i) => `${i + 1}. **${t.label}**\n   ${t.desc}`).join('\n\n')}\n\n⚡ Aplique para adicionar ao mapa!`,
      actions,
      thinking: `Gerei ideias diversificadas para "${context}" cobrindo diferentes dimensões`,
      confidence: 0.78,
    };
  }

  private fallbackCreateTasks(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    const context = selectedNode?.data.label || this.extractTopic(message, ['tarefa', 'task', 'plano', 'ação', 'criar', 'crie', 'gere', 'para', 'sobre', 'de', 'do', 'da']);
    const parentId = selectedNode?.id || nodes[0]?.id;

    const tasks = [
      { label: `Definir escopo de ${context}`, priority: 'high', desc: 'Delimitar objetivos, limites e entregáveis' },
      { label: `Pesquisar referências de ${context}`, priority: 'medium', desc: 'Levantar benchmarks, artigos e cases' },
      { label: `Criar protótipo/MVP de ${context}`, priority: 'high', desc: 'Primeira versão funcional para validação' },
      { label: `Validar com stakeholders`, priority: 'medium', desc: 'Coletar feedback e iterar' },
      { label: `Definir KPIs e métricas`, priority: 'medium', desc: 'Indicadores claros de sucesso' },
      { label: `Plano de implementação`, priority: 'urgent', desc: 'Cronograma, responsáveis e recursos' },
    ];

    const actions = tasks.map(t =>
      this.mkAction('create_node', t.label, {
        type: 'task', label: `📋 ${t.label}`, description: t.desc, parentId,
        priority: t.priority, status: 'active',
      })
    );

    // Add milestone
    actions.push(this.mkAction('create_node', `Marco: ${context} concluído`, {
      type: 'milestone', label: `🎯 ${context} — Concluído`, description: 'Todas as tarefas finalizadas e validadas',
      parentId, priority: 'high',
    }));

    return {
      response: `📋 **Plano de Ação para "${context}"**\n\n${tasks.map((t, i) => `${i + 1}. **${t.label}** [${t.priority}]\n   ${t.desc}`).join('\n\n')}\n\n🎯 **Marco:** ${context} Concluído\n\n⚡ ${tasks.length + 1} itens prontos para aplicar!`,
      actions,
      thinking: `Plano de ação estruturado para "${context}" com tarefas priorizadas e marco final`,
      confidence: 0.85,
    };
  }

  private fallbackResearch(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    const topic = selectedNode?.data.label || this.extractTopic(message, ['pesquisar', 'pesquise', 'pesquisa', 'investigar', 'estudar', 'sobre', 'de', 'do', 'da', 'para']);
    const parentId = selectedNode?.id || nodes[0]?.id;

    const actions: AIAgentAction[] = [
      this.mkAction('create_node', `Pesquisa: ${topic}`, {
        type: 'research', label: `🔬 Pesquisa: ${topic}`,
        description: `Análise aprofundada sobre ${topic} com dimensões, hipóteses e fontes`,
        parentId,
      }),
      this.mkAction('create_node', `Fontes e Referências`, {
        type: 'reference', label: `📚 Fontes: ${topic}`,
        description: `1. Estado da Arte\n2. Melhores Práticas\n3. Cases de Sucesso\n4. Artigos Acadêmicos`,
        parentId,
      }),
      this.mkAction('create_node', `Hipóteses sobre ${topic}`, {
        type: 'question', label: `❓ Hipóteses: ${topic}`,
        description: `Cenários e probabilidades para ${topic}`,
        parentId,
      }),
    ];

    return {
      response: `🔬 **Pesquisa sobre "${topic}"**\n\nCriei 3 nós de pesquisa:\n\n1. **Análise principal** com dimensões do tema\n2. **Fontes e referências** catalogadas\n3. **Hipóteses** com cenários possíveis\n\n⚡ Aplique e depois peça para expandir cada um!`,
      actions,
      thinking: `Estrutura de pesquisa para "${topic}" com fontes, hipóteses e análise`,
      confidence: 0.75,
    };
  }

  private fallbackDataViz(nodes: PowerNode[], edges: PowerEdge[]): AgentResponse {
    const types = this.countBy(nodes, n => n.data.type);

    const actions: AIAgentAction[] = [
      this.mkAction('create_node', 'Dashboard do Mapa', {
        type: 'data', label: '📊 Dashboard do Mapa',
        description: `Métricas em tempo real: ${nodes.length} nós, ${edges.length} conexões`,
        chart: {
          type: 'bar', title: 'Distribuição por Tipo',
          labels: Object.keys(types).map(t => NODE_TYPE_CONFIG[t as NeuralNodeType]?.label || t),
          datasets: [{ label: 'Quantidade', data: Object.values(types), color: '#06b6d4' }],
        },
        table: {
          columns: [
            { key: 'metric', label: 'Métrica', type: 'text' as const },
            { key: 'value', label: 'Valor', type: 'number' as const },
          ],
          rows: [
            { metric: 'Total de Nós', value: nodes.length },
            { metric: 'Conexões', value: edges.length },
            { metric: 'Progresso Médio', value: `${Math.round(nodes.reduce((s, n) => s + (n.data.progress || 0), 0) / Math.max(nodes.length, 1))}%` },
            { metric: 'Nós de IA', value: nodes.filter(n => n.data.ai?.generated).length },
          ],
        },
      }),
    ];

    return {
      response: `📊 **Dashboard de Dados Gerado!**\n\n📈 Gráfico de barras: Distribuição por tipo\n📋 Tabela: Métricas principais\n\n⚡ Aplique para ver o dashboard no mapa!`,
      actions,
      confidence: 0.9,
    };
  }

  private fallbackExpand(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    const topic = selectedNode?.data.label || this.extractTopic(message, ['expandir', 'expanda', 'expandir', 'detalhar', 'detalhe', 'aprofundar', 'aprofunde', 'desenvolver', 'desenvolva']);
    const parentId = selectedNode?.id || nodes[0]?.id;

    const subtopics = [
      { type: 'idea' as NeuralNodeType, label: `Conceitos-chave de ${topic}`, desc: 'Fundamentos teóricos e definições' },
      { type: 'note' as NeuralNodeType, label: `Aplicações de ${topic}`, desc: 'Uso prático e exemplos reais' },
      { type: 'research' as NeuralNodeType, label: `Tendências de ${topic}`, desc: 'Evolução e projeções futuras' },
      { type: 'reference' as NeuralNodeType, label: `Recursos sobre ${topic}`, desc: 'Ferramentas, links e materiais' },
    ];

    const actions = subtopics.map(s =>
      this.mkAction('create_node', s.label, { type: s.type, label: s.label, description: s.desc, parentId })
    );

    return {
      response: `🌳 **"${topic}" expandido!**\n\n${subtopics.map((s, i) => `${i + 1}. **${s.label}**\n   ${s.desc}`).join('\n\n')}`,
      actions,
      confidence: 0.78,
    };
  }

  private fallbackOrganize(nodes: PowerNode[], edges: PowerEdge[]): AgentResponse {
    const orphans = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id));
    return {
      response: `🗂️ **Análise de Organização**\n\n- ${nodes.length} nós, ${edges.length} conexões\n- ${orphans.length} nós desconectados\n- Densidade: ${(edges.length / Math.max(nodes.length * (nodes.length - 1) / 2, 1) * 100).toFixed(1)}%\n\n**Sugestões:**\n1. Agrupar nós por tipo\n2. Conectar nós órfãos\n3. Hierarquizar por prioridade\n4. Centralizar o tema principal`,
      actions: [],
      insights: ['Layout radial recomendado para mapas com muitos ramos', 'Considere agrupar nós similares'],
      nextSteps: ['Selecione nós para reorganizar', 'Peça para conectar nós específicos'],
      confidence: 0.7,
    };
  }

  private fallbackComplete(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    if (!selectedNode) {
      return { response: '⚠️ Selecione o nó para marcar como concluído.', actions: [], confidence: 0.5 };
    }
    return {
      response: `✅ **"${selectedNode.data.label}"** marcado como concluído!`,
      actions: [this.mkAction('update_node', 'Concluído', { nodeId: selectedNode.id, status: 'completed', progress: 100 })],
      confidence: 0.95,
    };
  }

  private fallbackPrioritize(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    if (!selectedNode) {
      return { response: '⚠️ Selecione o nó para alterar a prioridade.', actions: [], confidence: 0.5 };
    }
    const lmsg = message.toLowerCase();
    let priority = 'high';
    if (lmsg.includes('urgent')) priority = 'urgent';
    else if (lmsg.includes('baixa') || lmsg.includes('low')) priority = 'low';
    else if (lmsg.includes('média') || lmsg.includes('medium')) priority = 'medium';

    return {
      response: `🔴 **"${selectedNode.data.label}"** — Prioridade: **${priority}**`,
      actions: [this.mkAction('update_node', `Prioridade → ${priority}`, { nodeId: selectedNode.id, priority })],
      confidence: 0.9,
    };
  }

  private fallbackGeneric(message: string, nodes: PowerNode[], selectedNode: PowerNode | null): AgentResponse {
    return {
      response: `🤖 **NeuralAgent** aqui!\n\nEntendi: "${message}"\n\nPosso fazer:\n\n🧠 **Criar** — "crie um mapa sobre [tema]"\n💡 **Idear** — "gere ideias para [tópico]"\n📋 **Planejar** — "crie tarefas para [projeto]"\n✏️ **Editar** — "renomeie para X" / "mude status"\n🔬 **Pesquisar** — "pesquise sobre [tema]"\n📊 **Analisar** — "analise meu mapa"\n🌳 **Expandir** — "expanda esse tópico"\n🗑️ **Remover** — "delete esse nó"\n\n💡 **Dica:** Selecione um nó para dar contexto!`,
      actions: [],
      confidence: 0.4,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────

  private mkAction(type: string, description: string, data: any): AIAgentAction {
    return { type, description, status: 'pending', data: { ...data, ai: { generated: true, model: 'local-fallback', confidence: 0.8, ...data.ai } } };
  }

  private extractTopic(message: string, stopwords: string[]): string {
    const words = message.split(/\s+/).filter(w => !stopwords.includes(w.toLowerCase()) && w.length > 2);
    return words.join(' ').trim() || 'Novo Tópico';
  }

  private countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
    return items.reduce((acc, item) => {
      const key = keyFn(item);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Singleton
export const neuralAgent = new NeuralAIAgent();
