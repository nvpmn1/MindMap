// ============================================================================
// NeuralMap - AI Action Executor
// Converts AI tool_use calls into concrete map mutations
// ============================================================================

import type { PowerNode, PowerEdge, NeuralNodeData, NeuralNodeType, AIAgentAction, ChartData, TableData } from '../editor/types';
import type { AgentToolName } from './tools';

const SUPPORTED_NODE_TYPES = new Set<NeuralNodeType>([
  'idea',
  'task',
  'note',
  'reference',
  'image',
  'group',
  'research',
  'data',
  'question',
]);

const NODE_TYPE_ALIASES: Record<string, NeuralNodeType> = {
  decision: 'question',
  milestone: 'task',
  resource: 'reference',
  process: 'note',
  risk: 'question',
  opportunity: 'idea',
};

function normalizeNodeType(value: unknown): NeuralNodeType {
  if (typeof value !== 'string') {
    return 'idea';
  }

  const normalized = value.trim().toLowerCase() as NeuralNodeType;
  if (SUPPORTED_NODE_TYPES.has(normalized)) {
    return normalized;
  }

  return NODE_TYPE_ALIASES[normalized] || 'idea';
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ExecutionResult {
  success: boolean;
  toolName: AgentToolName;
  description: string;
  nodesCreated?: string[];
  nodesUpdated?: string[];
  nodesDeleted?: string[];
  edgesCreated?: Array<{ source: string; target: string }>;
  edgesDeleted?: Array<{ source: string; target: string }>;
  data?: any;
  error?: string;
}

export interface ExecutionContext {
  nodes: PowerNode[];
  edges: PowerEdge[];
  createNode: (type: NeuralNodeType, label: string, parentId?: string) => PowerNode;
  updateNode: (nodeId: string, data: Partial<NeuralNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  createEdge: (sourceId: string, targetId: string, label?: string) => PowerEdge | null;
  deleteEdge: (sourceId: string, targetId: string) => void;
}

// ─── Action Executor ────────────────────────────────────────────────────────

export class ActionExecutor {

  /**
   * Execute a single tool call from the AI
   */
  execute(toolName: AgentToolName, input: any, ctx: ExecutionContext): ExecutionResult {
    try {
      switch (toolName) {
        case 'create_node':
          return this.execCreateNode(input, ctx);
        case 'create_nodes':
          return this.execCreateNodes(input, ctx);
        case 'update_node':
          return this.execUpdateNode(input, ctx);
        case 'delete_node':
          return this.execDeleteNode(input, ctx);
        case 'create_edge':
          return this.execCreateEdge(input, ctx);
        case 'create_edges':
          return this.execCreateEdges(input, ctx);
        case 'delete_edge':
          return this.execDeleteEdge(input, ctx);
        case 'batch_create_nodes':
          return this.execBatchCreate(input, ctx);
        case 'batch_update_nodes':
          return this.execBatchUpdate(input, ctx);
        case 'analyze_map':
          return this.execAnalyzeMap(input, ctx);
        case 'reorganize_map':
          return this.execReorganizeMap(input, ctx);
        case 'create_tasks':
          return this.execCreateTasks(input, ctx);
        case 'create_clusters':
          return this.execCreateClusters(input, ctx);
        case 'update_layout':
          return this.execUpdateLayout(input, ctx);
        case 'add_citations':
          return this.execAddCitations(input, ctx);
        case 'generate_report':
          return this.execGenerateReport(input, ctx);
        case 'find_patterns':
          return this.execFindPatterns(input, ctx);
        case 'find_nodes':
          return this.execFindNodes(input, ctx);
        default:
          return { success: false, toolName, description: `Ferramenta desconhecida: ${toolName}`, error: 'Unknown tool' };
      }
    } catch (error) {
      return {
        success: false,
        toolName,
        description: `Erro ao executar ${toolName}`,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute all tool calls from an AI response, in order
   */
  executeAll(
    toolCalls: Array<{ name: AgentToolName; input: any }>,
    ctx: ExecutionContext,
  ): ExecutionResult[] {
    const results: ExecutionResult[] = [];
    // tempId → real ID mapping for batch operations
    const idMap = new Map<string, string>();

    for (const call of toolCalls) {
      // Resolve tempIds in input
      const resolvedInput = this.resolveIds(call.input, idMap);
      const result = this.execute(call.name, resolvedInput, ctx);
      
      // If batch_create returned id mappings, record them
      if (result.data?.idMap) {
        for (const [tempId, realId] of Object.entries(result.data.idMap)) {
          idMap.set(tempId, realId as string);
        }
      }
      
      results.push(result);
    }

    return results;
  }

  // ─── Individual Executors ──────────────────────────────────────────────

  private execCreateNode(input: any, ctx: ExecutionContext): ExecutionResult {
    const {
      type = 'idea',
      label,
      description,
      parentId,
      status,
      priority,
      tags,
      progress,
      dueDate,
      checklist,
      chart,
      table,
      blueprintId,
      archetype,
      surface,
      todoSeed,
      aiPromptHint,
      aiContextPack,
      documentVault,
    } = input;
    
    const nodeType = normalizeNodeType(type);
    const node = ctx.createNode(nodeType, label, parentId);
    
    // Apply additional data
    const updates: Partial<NeuralNodeData> = {};
    if (description) updates.description = description;
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (tags) updates.tags = tags;
    if (progress !== undefined) updates.progress = progress;
    if (dueDate) updates.dueDate = dueDate;
    if (chart) updates.chart = chart as ChartData;
    if (table) updates.table = table as TableData;
    if (blueprintId) updates.blueprintId = blueprintId;
    if (archetype) updates.archetype = archetype;
    if (surface) updates.surface = surface;
    if (todoSeed) updates.todoSeed = todoSeed;
    if (aiPromptHint) updates.aiPromptHint = aiPromptHint;
    if (aiContextPack) updates.aiContextPack = aiContextPack;
    if (documentVault) updates.documentVault = documentVault;
    if (checklist) {
      updates.checklist = checklist.map((item: any, i: number) => ({
        id: `check_${Date.now()}_${i}`,
        text: item.text,
        completed: item.completed || false,
      }));
    }
    updates.ai = { generated: true, model: 'claude-haiku', confidence: 0.9 };
    
    if (Object.keys(updates).length > 0) {
      ctx.updateNode(node.id, updates);
    }

    return {
      success: true,
      toolName: 'create_node',
      description: `Criado nó "${label}" (${nodeType})`,
      nodesCreated: [node.id],
    };
  }

  private execCreateNodes(input: any, ctx: ExecutionContext): ExecutionResult {
    const nodes = Array.isArray(input?.nodes) ? input.nodes : [];
    if (nodes.length === 0) {
      return { success: false, toolName: 'create_nodes', description: 'Nenhum nó para criar', error: 'Empty nodes array' };
    }

    const createdIds: string[] = [];

    for (const spec of nodes) {
      const normalized = {
        type: normalizeNodeType(spec.type || 'idea'),
        label: spec.label,
        description: spec.content ?? spec.description,
        parentId: spec.parent_id ?? spec.parentId,
        status: spec.status,
        priority: spec.priority,
        tags: spec.tags,
        progress: spec.progress,
        dueDate: spec.dueDate,
        checklist: spec.checklist,
        chart: spec.chart,
        table: spec.table,
      };

      const result = this.execCreateNode(normalized, ctx);
      if (result.success && result.nodesCreated?.length) {
        createdIds.push(...result.nodesCreated);
      }
    }

    return {
      success: true,
      toolName: 'create_nodes',
      description: `${createdIds.length} nós criados` ,
      nodesCreated: createdIds,
    };
  }

  private execUpdateNode(input: any, ctx: ExecutionContext): ExecutionResult {
    const nodeId = input?.nodeId ?? input?.node_id;
    const { nodeId: _nodeId, node_id: _legacyNodeId, ...updates } = input ?? {};
    if (!nodeId || typeof nodeId !== 'string') {
      return {
        success: false,
        toolName: 'update_node',
        description: 'nodeId ausente no update_node',
        error: 'Missing nodeId',
      };
    }

    const node = ctx.nodes.find(n => n.id === nodeId);
    if (!node) {
      return { success: false, toolName: 'update_node', description: `Nó ${nodeId} não encontrado`, error: 'Node not found' };
    }

    // Build the data update
    const dataUpdates: Partial<NeuralNodeData> = {};
    if (updates.label !== undefined) dataUpdates.label = updates.label;
    if (updates.description !== undefined) dataUpdates.description = updates.description;
    if (updates.type !== undefined) dataUpdates.type = normalizeNodeType(updates.type);
    if (updates.status !== undefined) dataUpdates.status = updates.status;
    if (updates.priority !== undefined) dataUpdates.priority = updates.priority;
    if (updates.progress !== undefined) dataUpdates.progress = updates.progress;
    if (updates.tags !== undefined) dataUpdates.tags = updates.tags;
    if (updates.dueDate !== undefined) dataUpdates.dueDate = updates.dueDate;
    if (updates.impact !== undefined) dataUpdates.impact = updates.impact;
    if (updates.effort !== undefined) dataUpdates.effort = updates.effort;
    if (updates.confidence !== undefined) dataUpdates.confidence = updates.confidence;
    if (updates.chart !== undefined) dataUpdates.chart = updates.chart;
    if (updates.table !== undefined) dataUpdates.table = updates.table;
    if (updates.blueprintId !== undefined) dataUpdates.blueprintId = updates.blueprintId;
    if (updates.archetype !== undefined) dataUpdates.archetype = updates.archetype;
    if (updates.surface !== undefined) dataUpdates.surface = updates.surface;
    if (updates.todoSeed !== undefined) dataUpdates.todoSeed = updates.todoSeed;
    if (updates.aiPromptHint !== undefined) dataUpdates.aiPromptHint = updates.aiPromptHint;
    if (updates.aiContextPack !== undefined) dataUpdates.aiContextPack = updates.aiContextPack;
    if (updates.documentVault !== undefined) dataUpdates.documentVault = updates.documentVault;
    if (updates.checklist) {
      dataUpdates.checklist = updates.checklist.map((item: any, i: number) => ({
        id: item.id || `check_${Date.now()}_${i}`,
        text: item.text,
        completed: item.completed || false,
      }));
    }

    ctx.updateNode(nodeId, dataUpdates);

    const changedFields = Object.keys(dataUpdates).join(', ');
    return {
      success: true,
      toolName: 'update_node',
      description: `Atualizado "${node.data.label}": ${changedFields}`,
      nodesUpdated: [nodeId],
    };
  }

  private execDeleteNode(input: any, ctx: ExecutionContext): ExecutionResult {
    const nodeId = input?.nodeId ?? input?.node_id;
    const reason = input?.reason;
    if (!nodeId || typeof nodeId !== 'string') {
      return {
        success: false,
        toolName: 'delete_node',
        description: 'nodeId ausente no delete_node',
        error: 'Missing nodeId',
      };
    }

    const node = ctx.nodes.find(n => n.id === nodeId);
    if (!node) {
      return { success: false, toolName: 'delete_node', description: `Nó ${nodeId} não encontrado`, error: 'Node not found' };
    }

    const label = node.data.label;
    ctx.deleteNode(nodeId);

    return {
      success: true,
      toolName: 'delete_node',
      description: `Removido "${label}"${reason ? ` (motivo: ${reason})` : ''}`,
      nodesDeleted: [nodeId],
    };
  }

  private execCreateEdge(input: any, ctx: ExecutionContext): ExecutionResult {
    const sourceId = input?.sourceId ?? input?.source_id;
    const targetId = input?.targetId ?? input?.target_id;
    const label = input?.label;
    if (!sourceId || !targetId) {
      return {
        success: false,
        toolName: 'create_edge',
        description: 'sourceId/targetId ausentes em create_edge',
        error: 'Missing sourceId or targetId',
      };
    }

    const edge = ctx.createEdge(sourceId, targetId, label);
    if (!edge) {
      return { success: false, toolName: 'create_edge', description: 'Falha ao criar conexão', error: 'Edge creation failed' };
    }

    return {
      success: true,
      toolName: 'create_edge',
      description: `Conexão criada: ${sourceId} → ${targetId}`,
      edgesCreated: [{ source: sourceId, target: targetId }],
    };
  }

  private execCreateEdges(input: any, ctx: ExecutionContext): ExecutionResult {
    const edges = Array.isArray(input?.edges) ? input.edges : [];
    if (edges.length === 0) {
      return { success: false, toolName: 'create_edges', description: 'Nenhuma conexão para criar', error: 'Empty edges array' };
    }

    const created: Array<{ source: string; target: string }> = [];

    for (const edge of edges) {
      const normalized = {
        sourceId: edge.source_id ?? edge.sourceId,
        targetId: edge.target_id ?? edge.targetId,
        label: edge.label,
      };
      const result = this.execCreateEdge(normalized, ctx);
      if (result.success && result.edgesCreated?.length) {
        created.push(...result.edgesCreated);
      }
    }

    return {
      success: true,
      toolName: 'create_edges',
      description: `${created.length} conexões criadas`,
      edgesCreated: created,
    };
  }

  private execDeleteEdge(input: any, ctx: ExecutionContext): ExecutionResult {
    const sourceId = input?.sourceId ?? input?.source_id;
    const targetId = input?.targetId ?? input?.target_id;
    if (!sourceId || !targetId) {
      return {
        success: false,
        toolName: 'delete_edge',
        description: 'sourceId/targetId ausentes em delete_edge',
        error: 'Missing sourceId or targetId',
      };
    }

    ctx.deleteEdge(sourceId, targetId);

    return {
      success: true,
      toolName: 'delete_edge',
      description: `Conexão removida: ${sourceId} → ${targetId}`,
      edgesDeleted: [{ source: sourceId, target: targetId }],
    };
  }

  private execBatchCreate(input: any, ctx: ExecutionContext): ExecutionResult {
    const { nodes: nodeSpecs } = input;
    if (!Array.isArray(nodeSpecs) || nodeSpecs.length === 0) {
      return { success: false, toolName: 'batch_create_nodes', description: 'Nenhum nó para criar', error: 'Empty nodes array' };
    }

    const idMap: Record<string, string> = {};
    const createdIds: string[] = [];

    // Group nodes by parent for intelligent positioning
    const nodesByParent = new Map<string, typeof nodeSpecs>();
    for (const spec of nodeSpecs) {
      const parentKey = spec.parentId || spec.parent_id || '__root__';
      if (!nodesByParent.has(parentKey)) nodesByParent.set(parentKey, []);
      nodesByParent.get(parentKey)!.push(spec);
    }

    for (const spec of nodeSpecs) {
      // Resolve parentId: could be a tempId or real ID
      let resolvedParentId = spec.parentId || spec.parent_id;
      if (resolvedParentId && idMap[resolvedParentId]) {
        resolvedParentId = idMap[resolvedParentId];
      }

      const node = ctx.createNode(
        normalizeNodeType(spec.type || 'idea'),
        spec.label,
        resolvedParentId,
      );

      // Map tempId → real ID
      if (spec.tempId) {
        idMap[spec.tempId] = node.id;
      }

      // Apply extra data
      const updates: Partial<NeuralNodeData> = {};
      if (spec.description) updates.description = spec.description;
      if (spec.status) updates.status = spec.status;
      if (spec.priority) updates.priority = spec.priority;
      if (spec.tags) updates.tags = spec.tags;
      if (spec.progress !== undefined) updates.progress = spec.progress;
      if (spec.dueDate) updates.dueDate = spec.dueDate;
      if (spec.checklist) {
        updates.checklist = spec.checklist.map((item: any, i: number) => ({
          id: `check_${Date.now()}_${i}`,
          text: item.text,
          completed: item.completed || false,
        }));
      }
      if (spec.chart) updates.chart = spec.chart;
      if (spec.table) updates.table = spec.table;
      updates.ai = { generated: true, model: 'claude-haiku', confidence: 0.9 };

      if (Object.keys(updates).length > 0) {
        ctx.updateNode(node.id, updates);
      }

      createdIds.push(node.id);
    }

    return {
      success: true,
      toolName: 'batch_create_nodes',
      description: `${createdIds.length} nós criados em lote`,
      nodesCreated: createdIds,
      data: { idMap },
    };
  }

  private execBatchUpdate(input: any, ctx: ExecutionContext): ExecutionResult {
    const { updates } = input;
    if (!Array.isArray(updates) || updates.length === 0) {
      return { success: false, toolName: 'batch_update_nodes', description: 'Nenhuma atualização', error: 'Empty updates array' };
    }

    const updatedIds: string[] = [];
    for (const upd of updates) {
      const nodeId = upd?.nodeId ?? upd?.node_id;
      const { nodeId: _nodeId, node_id: _legacyNodeId, ...fields } = upd ?? {};
      if (!nodeId || typeof nodeId !== 'string') {
        continue;
      }
      const node = ctx.nodes.find(n => n.id === nodeId);
      if (!node) continue;

      if (fields.type !== undefined) {
        fields.type = normalizeNodeType(fields.type);
      }

      ctx.updateNode(nodeId, fields);
      updatedIds.push(nodeId);
    }

    return {
      success: true,
      toolName: 'batch_update_nodes',
      description: `${updatedIds.length} nós atualizados em lote`,
      nodesUpdated: updatedIds,
    };
  }

  private execAnalyzeMap(input: any, ctx: ExecutionContext): ExecutionResult {
    const { nodes, edges } = ctx;
    const focus = input.focus || 'all';

    // Compute analytics
    const typeCount = nodes.reduce((acc, n) => { acc[n.data.type] = (acc[n.data.type] || 0) + 1; return acc; }, {} as Record<string, number>);
    const statusCount = nodes.reduce((acc, n) => { acc[n.data.status] = (acc[n.data.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    const priorityCount = nodes.reduce((acc, n) => { acc[n.data.priority] = (acc[n.data.priority] || 0) + 1; return acc; }, {} as Record<string, number>);
    
    const totalProgress = nodes.reduce((s, n) => s + (n.data.progress || 0), 0);
    const avgProgress = nodes.length > 0 ? Math.round(totalProgress / nodes.length) : 0;
    
    const tasks = nodes.filter(n => n.data.type === 'task');
    const completedTasks = tasks.filter(n => n.data.status === 'completed').length;
    
    const orphans = nodes.filter(n => !edges.some(e => e.source === n.id || e.target === n.id));
    const aiNodes = nodes.filter(n => n.data.ai?.generated);

    // Connection density
    const maxEdges = nodes.length * (nodes.length - 1) / 2;
    const density = maxEdges > 0 ? edges.length / maxEdges : 0;

    // Most connected nodes
    const connectionCount = nodes.map(n => ({
      id: n.id,
      label: n.data.label,
      connections: edges.filter(e => e.source === n.id || e.target === n.id).length,
    })).sort((a, b) => b.connections - a.connections);

    const analysis = {
      summary: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        avgProgress,
        tasks: tasks.length,
        completedTasks,
        orphanNodes: orphans.length,
        aiGeneratedNodes: aiNodes.length,
        connectionDensity: Math.round(density * 100),
      },
      byType: typeCount,
      byStatus: statusCount,
      byPriority: priorityCount,
      topConnected: connectionCount.slice(0, 5),
      issues: [] as string[],
      suggestions: [] as string[],
    };

    // Identify issues
    if (orphans.length > 0) analysis.issues.push(`${orphans.length} nós desconectados`);
    if (avgProgress < 20 && tasks.length > 0) analysis.issues.push('Progresso geral muito baixo');
    if (nodes.filter(n => !n.data.description).length > nodes.length * 0.5) {
      analysis.issues.push('Mais de 50% dos nós sem descrição');
    }

    // Suggestions
    if (tasks.length === 0) analysis.suggestions.push('Converter ideias principais em tarefas acionáveis');
    if (density < 0.1) analysis.suggestions.push('Adicionar mais conexões entre nós relacionados');
    if (nodes.filter(n => n.data.type === 'research').length === 0) {
      analysis.suggestions.push('Adicionar nós de pesquisa para aprofundar o tema');
    }

    return {
      success: true,
      toolName: 'analyze_map',
      description: `Análise completa: ${nodes.length} nós, ${edges.length} conexões, ${avgProgress}% progresso`,
      data: analysis,
    };
  }

  private execReorganizeMap(input: any, ctx: ExecutionContext): ExecutionResult {
    // Note: actual repositioning happens in the UI layer via ReactFlow
    // Here we return the reorganization plan
    const { strategy } = input;
    
    return {
      success: true,
      toolName: 'reorganize_map',
      description: `Reorganização planejada: estratégia ${strategy}`,
      data: { strategy, applied: true },
    };
  }

  private execCreateTasks(input: any, ctx: ExecutionContext): ExecutionResult {
    const tasks = Array.isArray(input?.tasks) ? input.tasks : [];
    if (tasks.length === 0) {
      return { success: false, toolName: 'create_tasks', description: 'Nenhuma tarefa para criar', error: 'Empty tasks array' };
    }

    const createdIds: string[] = [];

    for (const task of tasks) {
      const normalized = {
        type: 'task',
        label: task.title,
        description: task.description,
        parentId: task.node_id ?? task.parentId,
        priority: task.priority,
        tags: task.tags,
        checklist: task.checklist,
      };
      const result = this.execCreateNode(normalized, ctx);
      if (result.success && result.nodesCreated?.length) {
        createdIds.push(...result.nodesCreated);
      }
    }

    return {
      success: true,
      toolName: 'create_tasks',
      description: `${createdIds.length} tarefas criadas como nós`,
      nodesCreated: createdIds,
    };
  }

  private execCreateClusters(input: any, _ctx: ExecutionContext): ExecutionResult {
    const clusters = Array.isArray(input?.clusters) ? input.clusters : [];
    return {
      success: true,
      toolName: 'create_clusters',
      description: `${clusters.length} clusters sugeridos`,
      data: { clusters },
    };
  }

  private execUpdateLayout(input: any, _ctx: ExecutionContext): ExecutionResult {
    return {
      success: true,
      toolName: 'update_layout',
      description: 'Layout sugerido pelo agente',
      data: input,
    };
  }

  private execAddCitations(input: any, _ctx: ExecutionContext): ExecutionResult {
    return {
      success: true,
      toolName: 'add_citations',
      description: 'Citações registradas',
      data: input,
    };
  }

  private execGenerateReport(input: any, _ctx: ExecutionContext): ExecutionResult {
    return {
      success: true,
      toolName: 'generate_report',
      description: 'Relatório gerado',
      data: input,
    };
  }

  private execFindPatterns(input: any, _ctx: ExecutionContext): ExecutionResult {
    return {
      success: true,
      toolName: 'find_patterns',
      description: 'Padrões analisados',
      data: input,
    };
  }

  private execFindNodes(input: any, ctx: ExecutionContext): ExecutionResult {
    const { query, type, status, priority, tags } = input;
    
    let results = [...ctx.nodes];
    
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(n => 
        n.data.label.toLowerCase().includes(q) || 
        (n.data.description || '').toLowerCase().includes(q)
      );
    }
    if (type) results = results.filter(n => n.data.type === type);
    if (status) results = results.filter(n => n.data.status === status);
    if (priority) results = results.filter(n => n.data.priority === priority);
    if (tags?.length) {
      results = results.filter(n => tags.some((t: string) => n.data.tags?.includes(t)));
    }

    const found = results.map(n => ({
      id: n.id,
      type: n.data.type,
      label: n.data.label,
      status: n.data.status,
      priority: n.data.priority,
    }));

    return {
      success: true,
      toolName: 'find_nodes',
      description: `${found.length} nós encontrados`,
      data: { nodes: found },
    };
  }

  // ─── Helper: Resolve tempIds in inputs ────────────────────────────────

  private resolveIds(input: any, idMap: Map<string, string>): any {
    if (!input || typeof input !== 'object') return input;
    
    const resolved = { ...input };
    for (const key of ['parentId', 'nodeId', 'sourceId', 'targetId', 'centerNodeId', 'parent_id', 'node_id', 'source_id', 'target_id', 'center_node_id']) {
      if (resolved[key] && idMap.has(resolved[key])) {
        resolved[key] = idMap.get(resolved[key]);
      }
    }
    
    // Resolve arrays of node specs (for batch operations)
    if (Array.isArray(resolved.nodes)) {
      resolved.nodes = resolved.nodes.map((n: any) => this.resolveIds(n, idMap));
    }
    if (Array.isArray(resolved.updates)) {
      resolved.updates = resolved.updates.map((u: any) => this.resolveIds(u, idMap));
    }
    
    return resolved;
  }
}

// Singleton
export const actionExecutor = new ActionExecutor();




