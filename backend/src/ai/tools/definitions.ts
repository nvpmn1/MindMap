/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Tool Definitions Registry
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Complete tool definitions for Claude tool-use.
 * Uses strict schemas (Structured Outputs) for guaranteed conformance.
 * 
 * Categories:
 * - Map Manipulation: create, update, delete nodes and edges
 * - Map Analysis: patterns, clusters, gaps
 * - Task Management: create and organize tasks
 * - Search: web search integration
 * - Organization: auto-layout, clustering
 * - Data Extraction: structured data from content
 */

import type { ToolDefinition } from '../core/types';

// ═══════════════════════════════════════════════════════════════════════════
// MAP MANIPULATION TOOLS
// ═══════════════════════════════════════════════════════════════════════════

export const createNodesToolDef: ToolDefinition = {
  name: 'create_nodes',
  description: 'Cria um ou mais nós no mapa mental. Use para adicionar novas ideias, conceitos, tópicos ou qualquer tipo de informação ao mapa. Cada nó pode ter um rótulo, conteúdo detalhado, tipo, cor e ícone. Suporta criação em lote de múltiplos nós com hierarquia.',
  input_schema: {
    type: 'object',
    properties: {
      nodes: {
        type: 'array',
        description: 'Lista de nós a serem criados',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'Título curto do nó (max 80 chars)' },
            content: { type: 'string', description: 'Descrição detalhada ou conteúdo do nó (opcional)' },
            type: { 
              type: 'string', 
              description: 'Tipo do nó',
              enum: ['idea', 'task', 'note', 'reference', 'process', 'data', 'question', 'decision', 'risk', 'opportunity'],
            },
            parent_id: { type: 'string', description: 'ID do nó pai (null para raiz)' },
            color: { type: 'string', description: 'Cor hex do nó (ex: #FF6B6B)' },
            icon: { type: 'string', description: 'Emoji ou ícone do nó' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            tags: {
              type: 'array',
              description: 'Tags para categorização',
              items: { type: 'string' },
            },
          },
          required: ['label', 'type'],
        },
      },
    },
    required: ['nodes'],
  },
  category: 'map_manipulation',
  cacheable: true,
  strict: true,
};

export const createEdgesToolDef: ToolDefinition = {
  name: 'create_edges',
  description: 'Cria conexões entre nós no mapa mental. Use para estabelecer relações, dependências, fluxos ou associações entre conceitos. Pode especificar o tipo de relação e adicionar rótulo.',
  input_schema: {
    type: 'object',
    properties: {
      edges: {
        type: 'array',
        description: 'Lista de conexões a criar',
        items: {
          type: 'object',
          properties: {
            source_id: { type: 'string', description: 'ID do nó de origem' },
            target_id: { type: 'string', description: 'ID do nó de destino' },
            type: {
              type: 'string',
              description: 'Tipo da conexão',
              enum: ['default', 'causal', 'temporal', 'hierarchical', 'associative', 'contradictory', 'dependency'],
            },
            label: { type: 'string', description: 'Rótulo da conexão (opcional)' },
            strength: { type: 'number', description: 'Força da conexão 0-1 (opcional)' },
          },
          required: ['source_id', 'target_id', 'type'],
        },
      },
    },
    required: ['edges'],
  },
  category: 'map_manipulation',
  cacheable: true,
  strict: true,
};

export const updateNodeToolDef: ToolDefinition = {
  name: 'update_node',
  description: 'Atualiza propriedades de um nó existente no mapa. Use para modificar rótulo, conteúdo, tipo, cor, ícone ou quaisquer metadados de um nó.',
  input_schema: {
    type: 'object',
    properties: {
      node_id: { type: 'string', description: 'ID do nó a atualizar' },
      updates: {
        type: 'object',
        description: 'Campos a atualizar',
        properties: {
          label: { type: 'string', description: 'Novo rótulo' },
          content: { type: 'string', description: 'Novo conteúdo' },
          type: { type: 'string', enum: ['idea', 'task', 'note', 'reference', 'process', 'data', 'question', 'decision', 'risk', 'opportunity'] },
          color: { type: 'string', description: 'Nova cor hex' },
          icon: { type: 'string', description: 'Novo ícone' },
        },
        required: [],
      },
    },
    required: ['node_id', 'updates'],
  },
  category: 'map_manipulation',
  cacheable: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// MAP ANALYSIS TOOLS
// ═══════════════════════════════════════════════════════════════════════════

export const analyzeMapToolDef: ToolDefinition = {
  name: 'analyze_map',
  description: 'Analisa a estrutura completa do mapa mental. Identifica padrões, clusters temáticos, lacunas, forças e fraquezas. Gera recomendações acionáveis para melhorar o mapa. Use quando precisar entender a qualidade e completude do mapa.',
  input_schema: {
    type: 'object',
    properties: {
      analysis_type: {
        type: 'string',
        description: 'Tipo de análise a realizar',
        enum: ['full', 'patterns', 'gaps', 'swot', 'clusters', 'quality'],
      },
      focus_node_ids: {
        type: 'array',
        description: 'IDs de nós para focar a análise (vazio = mapa inteiro)',
        items: { type: 'string' },
      },
      depth: {
        type: 'number',
        description: 'Profundidade da análise (1=superficial, 3=profunda)',
      },
    },
    required: ['analysis_type'],
  },
  category: 'map_analysis',
  cacheable: false,
};

export const findPatternsToolDef: ToolDefinition = {
  name: 'find_patterns',
  description: 'Descobre padrões ocultos, temas recorrentes e relações não-óbvias entre os nós do mapa. Usa raciocínio avançado para identificar conexões que humanos podem não perceber.',
  input_schema: {
    type: 'object',
    properties: {
      pattern_types: {
        type: 'array',
        description: 'Tipos de padrões a buscar',
        items: {
          type: 'string',
          enum: ['themes', 'hierarchies', 'cycles', 'convergences', 'divergences', 'analogies', 'contradictions'],
        },
      },
      min_confidence: {
        type: 'number',
        description: 'Confiança mínima 0-1 para reportar um padrão',
      },
    },
    required: ['pattern_types'],
  },
  category: 'map_analysis',
  cacheable: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// TASK MANAGEMENT TOOLS
// ═══════════════════════════════════════════════════════════════════════════

export const createTasksToolDef: ToolDefinition = {
  name: 'create_tasks',
  description: 'Cria tarefas acionáveis a partir de nós do mapa. Cada tarefa inclui título com verbo de ação, descrição, prioridade, estimativa de esforço, tags, checklist de subtarefas e dependências.',
  input_schema: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        description: 'Lista de tarefas a criar',
        items: {
          type: 'object',
          properties: {
            node_id: { type: 'string', description: 'ID do nó de origem' },
            title: { type: 'string', description: 'Título com verbo de ação' },
            description: { type: 'string', description: 'Descrição detalhada' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            estimated_hours: { type: 'number', description: 'Estimativa em horas' },
            tags: { type: 'array', items: { type: 'string' } },
            checklist: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  done: { type: 'boolean' },
                },
                required: ['text', 'done'],
              },
            },
            dependencies: {
              type: 'array',
              description: 'IDs de tarefas das quais esta depende',
              items: { type: 'string' },
            },
          },
          required: ['title', 'priority'],
        },
      },
    },
    required: ['tasks'],
  },
  category: 'task_management',
  cacheable: true,
  strict: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH TOOLS
// ═══════════════════════════════════════════════════════════════════════════

export const searchWebToolDef: ToolDefinition = {
  name: 'search_web',
  description: 'Pesquisa na web para encontrar informações relevantes e atualizadas. Use quando o usuário precisa de dados externos, verificação de fatos, tendências recentes ou complementar o mapa com conhecimento externo. Retorna resultados com fontes citáveis.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Termos de busca' },
      max_results: { type: 'number', description: 'Máximo de resultados (1-10)' },
      focus: {
        type: 'string',
        description: 'Foco da pesquisa',
        enum: ['general', 'academic', 'news', 'technical', 'statistics'],
      },
    },
    required: ['query'],
  },
  category: 'search',
  cacheable: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// ORGANIZATION TOOLS
// ═══════════════════════════════════════════════════════════════════════════

export const reorganizeMapToolDef: ToolDefinition = {
  name: 'reorganize_map',
  description: 'Reorganiza a estrutura do mapa mental para melhor clareza e lógica. Move nós, cria novos agrupamentos e otimiza a hierarquia sem perder conteúdo.',
  input_schema: {
    type: 'object',
    properties: {
      strategy: {
        type: 'string',
        description: 'Estratégia de reorganização',
        enum: ['hierarchical', 'thematic', 'chronological', 'priority_based', 'complexity_based'],
      },
      scope: {
        type: 'string',
        description: 'Escopo da reorganização',
        enum: ['full_map', 'selected_branch', 'flat_nodes'],
      },
      preserve_connections: { type: 'boolean', description: 'Manter conexões existentes' },
    },
    required: ['strategy', 'scope'],
  },
  category: 'organization',
  cacheable: false,
};

export const createClustersToolDef: ToolDefinition = {
  name: 'create_clusters',
  description: 'Agrupa nós automaticamente em clusters temáticos com base em similaridade de conteúdo, relações e contexto.',
  input_schema: {
    type: 'object',
    properties: {
      clusters: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Nome do cluster' },
            node_ids: { type: 'array', items: { type: 'string' } },
            color: { type: 'string', description: 'Cor do cluster' },
            description: { type: 'string' },
          },
          required: ['name', 'node_ids'],
        },
      },
    },
    required: ['clusters'],
  },
  category: 'organization',
  cacheable: false,
};

export const updateLayoutToolDef: ToolDefinition = {
  name: 'update_layout',
  description: 'Sugere e aplica melhorias no layout visual do mapa: posicionamento, espaçamento, cores, ícones e estilos de conexão.',
  input_schema: {
    type: 'object',
    properties: {
      layout_type: {
        type: 'string',
        enum: ['radial', 'tree', 'force_directed', 'grid', 'horizontal', 'vertical'],
      },
      color_scheme: {
        type: 'object',
        properties: {
          strategy: { type: 'string', enum: ['by_type', 'by_depth', 'by_cluster', 'gradient', 'custom'] },
          colors: { type: 'array', items: { type: 'string' } },
        },
        required: ['strategy'],
      },
      spacing: {
        type: 'object',
        properties: {
          horizontal: { type: 'number' },
          vertical: { type: 'number' },
        },
        required: [],
      },
    },
    required: ['layout_type'],
  },
  category: 'visualization',
  cacheable: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// DATA EXTRACTION TOOLS
// ═══════════════════════════════════════════════════════════════════════════

export const addCitationsToolDef: ToolDefinition = {
  name: 'add_citations',
  description: 'Adiciona citações e referências a nós do mapa. Cada citação inclui fonte, URL, título e texto citado.',
  input_schema: {
    type: 'object',
    properties: {
      citations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            node_id: { type: 'string' },
            source: { type: 'string' },
            url: { type: 'string' },
            title: { type: 'string' },
            cited_text: { type: 'string' },
          },
          required: ['node_id', 'source'],
        },
      },
    },
    required: ['citations'],
  },
  category: 'data_extraction',
  cacheable: false,
};

export const generateReportToolDef: ToolDefinition = {
  name: 'generate_report',
  description: 'Gera um relatório estruturado a partir do conteúdo do mapa mental. Pode incluir sumário executivo, análise SWOT, plano de ação e conclusões.',
  input_schema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['executive_summary', 'full_report', 'action_plan', 'swot_report', 'progress_report'],
      },
      include_sections: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['overview', 'analysis', 'findings', 'recommendations', 'timeline', 'risks', 'next_steps'],
        },
      },
      output_format: {
        type: 'string',
        enum: ['markdown', 'json', 'html'],
      },
    },
    required: ['format'],
  },
  category: 'data_extraction',
  cacheable: false,
};

// ═══════════════════════════════════════════════════════════════════════════
// TOOL REGISTRY
// ═══════════════════════════════════════════════════════════════════════════

/** All available tools indexed by name */
export const TOOL_REGISTRY: Record<string, ToolDefinition> = {
  create_nodes: createNodesToolDef,
  create_edges: createEdgesToolDef,
  update_node: updateNodeToolDef,
  analyze_map: analyzeMapToolDef,
  find_patterns: findPatternsToolDef,
  create_tasks: createTasksToolDef,
  search_web: searchWebToolDef,
  reorganize_map: reorganizeMapToolDef,
  create_clusters: createClustersToolDef,
  update_layout: updateLayoutToolDef,
  add_citations: addCitationsToolDef,
  generate_report: generateReportToolDef,
};

/**
 * Get tools for a specific agent type
 */
export function getToolsForAgent(
  requiredToolNames: string[],
  optionalToolNames: string[] = [],
): ToolDefinition[] {
  const tools: ToolDefinition[] = [];

  for (const name of requiredToolNames) {
    if (TOOL_REGISTRY[name]) {
      tools.push(TOOL_REGISTRY[name]);
    }
  }

  for (const name of optionalToolNames) {
    if (TOOL_REGISTRY[name]) {
      tools.push(TOOL_REGISTRY[name]);
    }
  }

  return tools;
}

/**
 * Get all tool definitions as an array
 */
export function getAllTools(): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: string): ToolDefinition[] {
  return Object.values(TOOL_REGISTRY).filter(t => t.category === category);
}
