import type { AgentToolName } from './tools';

export type AgentPlaybookId =
  | 'chat'
  | 'generate'
  | 'expand'
  | 'summarize'
  | 'analyze'
  | 'organize'
  | 'research'
  | 'hypothesize'
  | 'task_convert'
  | 'critique'
  | 'connect'
  | 'visualize'
  | 'chart';

export interface ExecutionTargets {
  minMutatingActions: number;
  minImpactScore: number;
  minNodesCreated?: number;
  minNodesUpdated?: number;
  minEdgesCreated?: number;
  minUniqueMutatingTools?: number;
}

export interface AgentPlaybook {
  id: AgentPlaybookId;
  label: string;
  mission: string;
  quickActionPrompt: string;
  allowedTools: AgentToolName[];
  preferredTools: AgentToolName[];
  executionTargets: ExecutionTargets;
  systemDirectives: string[];
  completionChecklist: string[];
}

const CORE_EXECUTION_TOOLS: AgentToolName[] = [
  'create_node',
  'update_node',
  'delete_node',
  'create_edge',
  'delete_edge',
  'batch_create_nodes',
  'batch_update_nodes',
  'analyze_map',
  'reorganize_map',
  'find_nodes',
];

const DEFAULT_PLAYBOOK: AgentPlaybook = {
  id: 'chat',
  label: 'Neural Agent',
  mission: 'Executar melhorias praticas no mapa com qualidade alta.',
  quickActionPrompt:
    'Analise o estado atual do mapa e execute um pacote de melhorias praticas com mudancas reais.',
  allowedTools: CORE_EXECUTION_TOOLS,
  preferredTools: ['analyze_map', 'find_nodes', 'batch_create_nodes', 'create_edge', 'update_node'],
  executionTargets: {
    minMutatingActions: 2,
    minImpactScore: 8,
    minNodesCreated: 1,
    minUniqueMutatingTools: 1,
  },
  systemDirectives: [
    'Nao finalize sem executar mudancas reais no mapa.',
    'Use IDs existentes do contexto; nao invente parentId.',
    'Crie nos antes de criar arestas que dependem deles.',
  ],
  completionChecklist: [
    'Executar diagnostico rapido do mapa.',
    'Aplicar mudancas mutaveis.',
    'Confirmar conexoes e coerencia estrutural.',
  ],
};

const PLAYBOOKS: Record<AgentPlaybookId, AgentPlaybook> = {
  chat: DEFAULT_PLAYBOOK,
  generate: {
    id: 'generate',
    label: 'Gerar Ideias',
    mission: 'Construir uma rede de ideias ampla, com variedade semantica e conexoes claras.',
    quickActionPrompt:
      'Gere uma estrutura completa de ideias para este mapa, com clusters, subniveis e conexoes relevantes.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'batch_create_nodes', 'create_edge', 'update_node'],
    executionTargets: {
      minMutatingActions: 4,
      minImpactScore: 22,
      minNodesCreated: 6,
      minEdgesCreated: 4,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Crie clusters com no central e filhos tematicos.',
      'Distribua tipos de no (idea, task, note, research, question, data, reference).',
      'Adicione conexoes transversais entre clusters relacionados.',
    ],
    completionChecklist: [
      'Criar base principal e ramificacoes.',
      'Adicionar conexoes entre ramificacoes.',
      'Refinar labels e descricoes de valor.',
    ],
  },
  expand: {
    id: 'expand',
    label: 'Expandir',
    mission: 'Aprofundar topicos com detalhe pratico e progressao de profundidade.',
    quickActionPrompt:
      'Expanda o topico mais relevante com novos subtopicos, detalhes aplicaveis e conexoes internas.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['find_nodes', 'batch_create_nodes', 'create_edge', 'update_node'],
    executionTargets: {
      minMutatingActions: 3,
      minImpactScore: 16,
      minNodesCreated: 4,
      minEdgesCreated: 3,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Priorize profundidade util em vez de lista superficial.',
      'Cada novo no deve acrescentar contexto pratico.',
      'Conecte os novos nos ao pai e entre si quando fizer sentido.',
    ],
    completionChecklist: [
      'Selecionar alvo de expansao.',
      'Criar subestrutura de alto valor.',
      'Conectar subestrutura ao fluxo existente.',
    ],
  },
  summarize: {
    id: 'summarize',
    label: 'Sintetizar',
    mission: 'Transformar volume em sintese executavel com resumo e consolidacao estrutural.',
    quickActionPrompt:
      'Sintetize o mapa em uma visao executiva e salve essa sintese dentro do proprio mapa.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'find_nodes', 'create_node', 'batch_update_nodes'],
    executionTargets: {
      minMutatingActions: 2,
      minImpactScore: 8,
      minNodesCreated: 1,
      minNodesUpdated: 2,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Crie um no resumo de nivel executivo.',
      'Atualize nos-chave com tags/descricao para consolidar narrativa.',
      'Evite apenas explicar: persistir sintese no mapa e revisar estrutura.',
    ],
    completionChecklist: [
      'Extrair temas centrais.',
      'Criar no de sintese.',
      'Atualizar nos criticos para coerencia.',
    ],
  },
  analyze: {
    id: 'analyze',
    label: 'Analisar Mapa',
    mission: 'Diagnosticar lacunas, riscos e melhorias e aplicar correcoes de alto impacto.',
    quickActionPrompt:
      'Analise o mapa de ponta a ponta e aplique melhorias praticas para fechar lacunas estruturais.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'find_nodes', 'batch_update_nodes', 'create_node', 'create_edge'],
    executionTargets: {
      minMutatingActions: 3,
      minImpactScore: 12,
      minNodesCreated: 2,
      minNodesUpdated: 2,
      minEdgesCreated: 1,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Executar analise primeiro, depois intervencoes.',
      'Adicionar nos para lacunas relevantes.',
      'Atualizar nos fracos e conectar pontos orfaos.',
    ],
    completionChecklist: [
      'Gerar diagnostico de problemas.',
      'Aplicar correcoes no grafo.',
      'Registrar ganhos obtidos.',
    ],
  },
  organize: {
    id: 'organize',
    label: 'Organizar',
    mission: 'Reestruturar o mapa para legibilidade, hierarquia e navegacao eficiente.',
    quickActionPrompt:
      'Reorganize o mapa com hierarquia clara, padronizacao de metadados e conexoes mais limpas.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'reorganize_map', 'batch_update_nodes', 'create_edge', 'delete_edge'],
    executionTargets: {
      minMutatingActions: 3,
      minImpactScore: 10,
      minNodesUpdated: 4,
      minEdgesCreated: 1,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Padronize labels, status e prioridades de nos principais.',
      'Remova conexoes redundantes e crie conexoes estruturais necessarias.',
      'Nao quebrar continuidade sem criar alternativa melhor.',
    ],
    completionChecklist: [
      'Mapear desorganizacoes.',
      'Executar normalizacao de nos.',
      'Ajustar relacoes entre blocos.',
    ],
  },
  research: {
    id: 'research',
    label: 'Pesquisar',
    mission: 'Enriquecer o mapa com trilhas de pesquisa, referencias e perguntas investigativas.',
    quickActionPrompt:
      'Construa um bloco de pesquisa aprofundada com fontes, perguntas e dados aplicaveis ao tema do mapa.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'find_nodes', 'batch_create_nodes', 'create_edge', 'update_node'],
    executionTargets: {
      minMutatingActions: 4,
      minImpactScore: 18,
      minNodesCreated: 5,
      minEdgesCreated: 3,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Criar nos research/reference/question para guiar investigacao.',
      'Conectar novas evidencias aos topicos existentes.',
      'Adicionar proximos passos de validacao no proprio mapa.',
    ],
    completionChecklist: [
      'Criar estrutura de pesquisa.',
      'Inserir referencias e questoes.',
      'Conectar pesquisa ao mapa atual.',
    ],
  },
  hypothesize: {
    id: 'hypothesize',
    label: 'Hipoteses',
    mission: 'Gerar hipoteses testaveis e cenarios com trilhas de validacao.',
    quickActionPrompt:
      'Formule hipoteses e cenarios alternativos e registre no mapa com planos de validacao.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'find_nodes', 'batch_create_nodes', 'create_edge', 'update_node'],
    executionTargets: {
      minMutatingActions: 4,
      minImpactScore: 16,
      minNodesCreated: 4,
      minEdgesCreated: 2,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Representar hipoteses como no question com criterio de teste.',
      'Criar cenarios concorrentes (otimista, base, risco).',
      'Conectar cada hipotese a evidencias e tarefas de validacao.',
    ],
    completionChecklist: [
      'Criar hipoteses principais.',
      'Criar trilha de teste para cada hipotese.',
      'Conectar hipoteses ao restante do mapa.',
    ],
  },
  task_convert: {
    id: 'task_convert',
    label: 'Criar Tarefas',
    mission: 'Converter estrategia em plano operacional com tarefas, dependencias e prioridades.',
    quickActionPrompt:
      'Converta os topicos em tarefas executaveis com prioridade, prazos e dependencias explicitas.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['find_nodes', 'batch_create_nodes', 'create_edge', 'batch_update_nodes'],
    executionTargets: {
      minMutatingActions: 4,
      minImpactScore: 18,
      minNodesCreated: 5,
      minEdgesCreated: 4,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Criar no task com checklist e prioridade coerente.',
      'Conectar tarefas por dependencia quando aplicavel.',
      'Atualizar nos origem com status de planejamento operacional.',
    ],
    completionChecklist: [
      'Selecionar blocos para operacionalizacao.',
      'Criar backlog inicial de tarefas.',
      'Ligar dependencias criticas.',
    ],
  },
  critique: {
    id: 'critique',
    label: 'Critica Construtiva',
    mission: 'Aplicar critica objetiva no mapa e corrigir pontos fracos com intervencoes concretas.',
    quickActionPrompt:
      'Faça uma critica construtiva profunda e aplique as correcoes mais importantes no mapa agora.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'find_nodes', 'batch_update_nodes', 'create_node', 'create_edge'],
    executionTargets: {
      minMutatingActions: 3,
      minImpactScore: 10,
      minNodesCreated: 1,
      minNodesUpdated: 3,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Identificar gargalos (lacuna, conflito, ambiguidade, excesso).',
      'Corrigir diretamente os nos impactados.',
      'Criar no de recomendacoes finais com prioridades.',
    ],
    completionChecklist: [
      'Gerar diagnostico de qualidade.',
      'Executar correcoes objetivas.',
      'Registrar recomendacoes priorizadas.',
    ],
  },
  connect: {
    id: 'connect',
    label: 'Descobrir Conexoes',
    mission: 'Revelar relacoes ocultas entre blocos e fortalecer o grafo com conexoes de valor.',
    quickActionPrompt:
      'Descubra e implemente conexoes nao obvias entre conceitos, criando um grafo mais inteligente.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'find_nodes', 'create_edge', 'create_node', 'batch_update_nodes'],
    executionTargets: {
      minMutatingActions: 3,
      minImpactScore: 10,
      minNodesCreated: 1,
      minEdgesCreated: 4,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Priorizar conexoes entre clusters antes isolados.',
      'Quando faltar ponte conceitual, criar no intermediario.',
      'Evitar arestas aleatorias: cada conexao precisa justificativa estrutural.',
    ],
    completionChecklist: [
      'Identificar blocos desconectados.',
      'Criar pontes e novas arestas.',
      'Validar consistencia das novas relacoes.',
    ],
  },
  visualize: {
    id: 'visualize',
    label: 'Melhorar Visual',
    mission: 'Aumentar clareza visual via padronizacao semantica e limpeza de relacoes.',
    quickActionPrompt:
      'Melhore a leitura visual do mapa com reorganizacao, padronizacao de nos e ajuste de conexoes.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'reorganize_map', 'batch_update_nodes', 'create_edge', 'delete_edge'],
    executionTargets: {
      minMutatingActions: 3,
      minImpactScore: 10,
      minNodesUpdated: 4,
      minEdgesCreated: 1,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Uniformizar labels, status e prioridades para leitura rapida.',
      'Eliminar conexoes ruins e reforcar trilhas principais.',
      'Adicionar nos de agrupamento quando necessario.',
    ],
    completionChecklist: [
      'Identificar ruído visual.',
      'Executar normalizacao semantica.',
      'Consolidar fluxo visual final.',
    ],
  },
  chart: {
    id: 'chart',
    label: 'Dashboard',
    mission: 'Criar camada analitica no mapa com metricas, dados e indicadores acionaveis.',
    quickActionPrompt:
      'Monte um dashboard analitico no mapa com nos de dados, indicadores e leituras de decisao.',
    allowedTools: CORE_EXECUTION_TOOLS,
    preferredTools: ['analyze_map', 'find_nodes', 'create_node', 'batch_update_nodes', 'create_edge'],
    executionTargets: {
      minMutatingActions: 3,
      minImpactScore: 12,
      minNodesCreated: 2,
      minNodesUpdated: 2,
      minEdgesCreated: 1,
      minUniqueMutatingTools: 2,
    },
    systemDirectives: [
      'Criar nos data com chart ou table util para decisao.',
      'Conectar indicadores aos nos de origem.',
      'Atualizar nos executivos com leitura de metricas.',
    ],
    completionChecklist: [
      'Criar nos de dados principais.',
      'Conectar metricas ao contexto.',
      'Publicar leitura final no mapa.',
    ],
  },
};

export const EXECUTION_IMPACT_WEIGHTS = {
  nodesCreated: 3,
  nodesUpdated: 2,
  nodesDeleted: 2,
  edgesCreated: 2,
  edgesDeleted: 1,
  mutatingActions: 1,
} as const;

export function getAgentPlaybook(agentType?: string): AgentPlaybook {
  if (!agentType) {
    return DEFAULT_PLAYBOOK;
  }

  const key = agentType.trim().toLowerCase() as AgentPlaybookId;
  return PLAYBOOKS[key] || DEFAULT_PLAYBOOK;
}

export function describeExecutionTargets(targets: ExecutionTargets): string {
  const chunks: string[] = [
    `${targets.minMutatingActions}+ acoes mutaveis`,
    `impacto >= ${targets.minImpactScore}`,
  ];
  if (typeof targets.minNodesCreated === 'number') {
    chunks.push(`${targets.minNodesCreated}+ nos criados`);
  }
  if (typeof targets.minNodesUpdated === 'number') {
    chunks.push(`${targets.minNodesUpdated}+ nos atualizados`);
  }
  if (typeof targets.minEdgesCreated === 'number') {
    chunks.push(`${targets.minEdgesCreated}+ arestas criadas`);
  }
  if (typeof targets.minUniqueMutatingTools === 'number') {
    chunks.push(`${targets.minUniqueMutatingTools}+ tools mutaveis diferentes`);
  }
  return chunks.join(', ');
}

export function buildQuickActionPrompt(playbook: AgentPlaybook): string {
  const checklist = playbook.completionChecklist.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
  return [
    playbook.quickActionPrompt,
    '',
    'Contrato de execucao obrigatorio:',
    `- Missao: ${playbook.mission}`,
    `- Metas: ${describeExecutionTargets(playbook.executionTargets)}`,
    '- Use somente IDs reais do mapa para parent/source/target.',
    '- Use apenas tipos de no validos: idea, task, note, reference, image, group, research, data, question.',
    '- Nao finalize sem atingir as metas de execucao.',
    '',
    'Checklist de entrega:',
    checklist,
  ].join('\n');
}

