// ============================================================================
// NeuralMap - AI Agent Tool Definitions
// Complete tool registry for Claude tool-use API
// ============================================================================

/**
 * Each tool represents one atomic action the AI can perform on the map.
 * The AI receives these definitions and returns structured tool_use calls,
 * which are then executed by the ActionExecutor.
 */

// ─── Tool Input Schemas (Anthropic tool_use format) ─────────────────────────

export interface ToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// ─── Complete Tool Registry ─────────────────────────────────────────────────

export const AGENT_TOOLS: ToolDefinition[] = [

  // ━━━ NODE CREATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    name: 'create_node',
    description: `Cria um novo nó no mapa mental. Use para adicionar ideias, tarefas, notas, pesquisas, dados, questões, decisões, marcos, referências ou recursos. 
Sempre forneça parentId para conectar ao mapa existente (use o id de um nó existente). 
Se o usuário pedir para criar múltiplos nós, chame esta ferramenta múltiplas vezes.
Tipos disponíveis: idea, task, note, research, data, question, decision, milestone, reference, resource.`,
    input_schema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['idea', 'task', 'note', 'research', 'data', 'question', 'decision', 'milestone', 'reference', 'resource'],
          description: 'Tipo do nó. Escolha o mais adequado: idea=conceito, task=ação executável, note=anotação, research=pesquisa, data=dados/gráficos, question=pergunta/votação, decision=decisão, milestone=marco, reference=fonte, resource=recurso/ferramenta.',
        },
        label: {
          type: 'string',
          description: 'Título curto do nó (max 80 chars). Seja claro e descritivo.',
        },
        description: {
          type: 'string',
          description: 'Descrição detalhada do conteúdo do nó. Pode ser longa e rica.',
        },
        parentId: {
          type: 'string',
          description: 'ID do nó pai para conectar. Use um ID existente do mapa. Se não souber, use o ID do nó raiz ou do nó selecionado.',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'archived', 'blocked', 'review'],
          description: 'Status do nó. Padrão: active.',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
          description: 'Prioridade do nó. Padrão: medium.',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags para categorizar o nó.',
        },
        progress: {
          type: 'number',
          description: 'Progresso de 0 a 100. Use para tarefas e marcos.',
        },
        dueDate: {
          type: 'string',
          description: 'Data limite no formato YYYY-MM-DD. Use para tarefas e marcos.',
        },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              completed: { type: 'boolean' },
            },
          },
          description: 'Lista de checklist para tarefas. Cada item tem text e completed.',
        },
        chart: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['bar', 'line', 'pie', 'area', 'radar'] },
            title: { type: 'string' },
            labels: { type: 'array', items: { type: 'string' } },
            datasets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                  data: { type: 'array', items: { type: 'number' } },
                  color: { type: 'string' },
                },
              },
            },
          },
          description: 'Dados de gráfico para nós do tipo data. Suporta bar, line, pie, area, radar.',
        },
        table: {
          type: 'object',
          properties: {
            columns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string', enum: ['text', 'number', 'status', 'date'] },
                },
              },
            },
            rows: {
              type: 'array',
              items: { type: 'object' },
            },
          },
          description: 'Dados de tabela para nós do tipo data.',
        },
      },
      required: ['type', 'label'],
    },
  },

  // ━━━ NODE EDITING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    name: 'update_node',
    description: `Atualiza um nó existente no mapa. Use para editar título, descrição, status, prioridade, progresso, tags, data, checklist, gráficos, tabelas, etc. 
Passe APENAS os campos que deseja alterar. Campos omitidos permanecem inalterados.
Para editar um nó, você PRECISA saber seu ID. Consulte o contexto do mapa para encontrar o ID.`,
    input_schema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID do nó a ser atualizado. OBRIGATÓRIO.',
        },
        label: { type: 'string', description: 'Novo título do nó.' },
        description: { type: 'string', description: 'Nova descrição.' },
        type: {
          type: 'string',
          enum: ['idea', 'task', 'note', 'research', 'data', 'question', 'decision', 'milestone', 'reference', 'resource'],
          description: 'Mudar o tipo do nó.',
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'archived', 'blocked', 'review'],
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'urgent'],
        },
        progress: { type: 'number', description: '0-100' },
        tags: { type: 'array', items: { type: 'string' } },
        dueDate: { type: 'string' },
        impact: { type: 'number', description: '0-100' },
        effort: { type: 'number', description: '0-100' },
        confidence: { type: 'number', description: '0-100' },
        checklist: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              text: { type: 'string' },
              completed: { type: 'boolean' },
            },
          },
        },
        chart: { type: 'object', description: 'Novos dados de gráfico.' },
        table: { type: 'object', description: 'Novos dados de tabela.' },
      },
      required: ['nodeId'],
    },
  },

  // ━━━ NODE DELETION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    name: 'delete_node',
    description: `Remove um nó do mapa mental. Use com cuidado - esta ação é irreversível. 
Também remove automaticamente todas as conexões (edges) do nó.
Sempre confirme com o usuário antes de deletar nós importantes.`,
    input_schema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID do nó a ser removido.',
        },
        reason: {
          type: 'string',
          description: 'Motivo da remoção (para log e transparência).',
        },
      },
      required: ['nodeId'],
    },
  },

  // ━━━ EDGE/CONNECTION MANAGEMENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    name: 'create_edge',
    description: `Cria uma conexão (aresta) entre dois nós existentes. Use para estabelecer relações entre conceitos.`,
    input_schema: {
      type: 'object',
      properties: {
        sourceId: {
          type: 'string',
          description: 'ID do nó de origem (de onde sai a conexão).',
        },
        targetId: {
          type: 'string',
          description: 'ID do nó de destino (para onde vai a conexão).',
        },
        label: {
          type: 'string',
          description: 'Rótulo opcional para a conexão (ex: "depende de", "relacionado a").',
        },
      },
      required: ['sourceId', 'targetId'],
    },
  },

  {
    name: 'delete_edge',
    description: `Remove uma conexão entre dois nós.`,
    input_schema: {
      type: 'object',
      properties: {
        sourceId: { type: 'string', description: 'ID do nó de origem.' },
        targetId: { type: 'string', description: 'ID do nó de destino.' },
      },
      required: ['sourceId', 'targetId'],
    },
  },

  // ━━━ BATCH OPERATIONS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    name: 'batch_create_nodes',
    description: `Cria múltiplos nós de uma vez com suas conexões. Ideal para gerar estruturas complexas como planos de ação, brainstorming, mapas de pesquisa.
Use quando o usuário pedir para criar várias coisas ao mesmo tempo ou gerar uma estrutura completa.`,
    input_schema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tempId: { type: 'string', description: 'ID temporário para referência interna (ex: "temp_1")' },
              type: { type: 'string', enum: ['idea', 'task', 'note', 'research', 'data', 'question', 'decision', 'milestone', 'reference', 'resource'] },
              label: { type: 'string' },
              description: { type: 'string' },
              parentId: { type: 'string', description: 'ID real de um nó existente OU tempId de um nó neste batch.' },
              status: { type: 'string', enum: ['active', 'completed', 'archived', 'blocked', 'review'] },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
              tags: { type: 'array', items: { type: 'string' } },
              progress: { type: 'number' },
              checklist: {
                type: 'array',
                items: { type: 'object', properties: { text: { type: 'string' }, completed: { type: 'boolean' } } },
              },
            },
            required: ['tempId', 'type', 'label'],
          },
          description: 'Array de nós para criar. Cada nó pode referenciar outro nó do batch via tempId.',
        },
      },
      required: ['nodes'],
    },
  },

  {
    name: 'batch_update_nodes',
    description: `Atualiza múltiplos nós de uma vez. Ideal para mudanças em massa como alterar status de várias tarefas, ajustar prioridades, etc.`,
    input_schema: {
      type: 'object',
      properties: {
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nodeId: { type: 'string' },
              label: { type: 'string' },
              description: { type: 'string' },
              status: { type: 'string', enum: ['active', 'completed', 'archived', 'blocked', 'review'] },
              priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
              progress: { type: 'number' },
              tags: { type: 'array', items: { type: 'string' } },
            },
            required: ['nodeId'],
          },
        },
      },
      required: ['updates'],
    },
  },

  // ━━━ MAP ANALYSIS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    name: 'analyze_map',
    description: `Analisa o mapa mental completo e retorna insights, estatísticas, padrões e sugestões de melhoria. Use quando o usuário pedir análise, resumo, ou quiser entender melhor seu mapa.`,
    input_schema: {
      type: 'object',
      properties: {
        focus: {
          type: 'string',
          enum: ['structure', 'progress', 'quality', 'gaps', 'all'],
          description: 'Foco da análise: structure=estrutura e conexões, progress=andamento de tarefas, quality=qualidade do conteúdo, gaps=lacunas identificadas, all=análise completa.',
        },
      },
      required: [],
    },
  },

  // ━━━ MAP REORGANIZATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    name: 'reorganize_map',
    description: `Sugere e executa reorganização do mapa: mudança de hierarquia, agrupamento, reordenação.`,
    input_schema: {
      type: 'object',
      properties: {
        strategy: {
          type: 'string',
          enum: ['by_type', 'by_priority', 'by_status', 'hierarchical', 'radial'],
          description: 'Estratégia de reorganização.',
        },
        centerNodeId: {
          type: 'string',
          description: 'ID do nó central para layout radial.',
        },
      },
      required: ['strategy'],
    },
  },

  // ━━━ SEARCH/FIND ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  {
    name: 'find_nodes',
    description: `Busca nós no mapa por critérios. Útil quando precisa encontrar nós para editar, conectar ou referenciar. Retorna os nós encontrados para uso posterior.`,
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Texto para buscar no label ou description.' },
        type: { type: 'string', enum: ['idea', 'task', 'note', 'research', 'data', 'question', 'decision', 'milestone', 'reference', 'resource'] },
        status: { type: 'string', enum: ['active', 'completed', 'archived', 'blocked', 'review'] },
        priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: [],
    },
  },
];

// ─── Tool Names Enum ────────────────────────────────────────────────────────

export type AgentToolName =
  | 'create_node'
  | 'update_node'
  | 'delete_node'
  | 'create_edge'
  | 'delete_edge'
  | 'batch_create_nodes'
  | 'batch_update_nodes'
  | 'analyze_map'
  | 'reorganize_map'
  | 'find_nodes';

export default AGENT_TOOLS;
