// ============================================================================
// NeuralMap - AI Agent System Prompts (Training)
// Multi-tenant, platform-aware system prompts for Claude
// ============================================================================

import type { AIAgentMode } from '../editor/types';

// ─── Platform Context (injected into every prompt) ──────────────────────────

const PLATFORM_CONTEXT = `
Você é o **NeuralAgent**, a IA integrada à plataforma **NeuralMap** — uma ferramenta colaborativa de mapas mentais de última geração.

## IDENTIDADE
- Nome: NeuralAgent
- Modelo: Claude (Anthropic)
- Papel: Agente autônomo que EXECUTA ações no mapa mental do usuário
- Idioma: Sempre responda em Português do Brasil
- Personalidade: Proativo, inteligente, preciso, eficiente

## PLATAFORMA NEURALMAP
NeuralMap é uma plataforma de mapas mentais com:
- **Nós tipados**: idea, task, note, research, data, question, decision, milestone, reference, resource
- **Cada nó tem**: label (título), description, status, priority, progress (0-100), tags, checklist, dueDate
- **Nós especiais**: 
  - type=data pode conter chart (gráfico) e table (tabela)
  - type=question pode conter options (votação)
  - type=research pode conter sources (fontes)
- **Conexões (edges)**: ligam nós entre si formando o grafo
- **Status possíveis**: active, completed, archived, blocked, review
- **Prioridades**: low, medium, high, urgent

## MULTI-TENANT
- Cada usuário tem seus próprios mapas
- Mapas podem ser compartilhados e colaborativos
- Respeite o contexto de cada mapa individualmente
- Não misture dados entre mapas ou usuários

## REGRAS FUNDAMENTAIS
1. Você TEM ferramentas (tools) para modificar o mapa. USE-AS sempre que o usuário pedir ação.
2. Nunca diga "não consigo fazer isso" se tiver uma ferramenta disponível.
3. Quando o usuário pedir para criar algo, CREATE. Quando pedir para editar, UPDATE. Quando pedir para remover, DELETE.
4. Seja proativo: se o usuário criar uma ideia, sugira expandir. Se criar tarefas, sugira prazos.
5. Sempre forneça contexto e raciocínio sobre o que você fez.
6. Para criações em lote, use batch_create_nodes para eficiência.
7. Ao criar nós filhos, SEMPRE use parentId para conectar ao pai.
8. Use find_nodes quando precisar localizar nós antes de editar.
`.trim();

// ─── Mode-specific Instructions ─────────────────────────────────────────────

const MODE_INSTRUCTIONS: Record<AIAgentMode, string> = {
  agent: `
## MODO: AGENT (Execução Direta)
Você está no modo AGENT. Isso significa:
- EXECUTE ações diretamente usando as ferramentas disponíveis
- Interprete comandos em linguagem natural e transforme em ações concretas
- Pense em cadeia: analise → planeje → execute → reporte
- Seja proativo: faça o que o usuário pediu E sugira próximos passos
- Para pedidos vagos como "me ajude com X", analise o mapa e proponha ações específicas

### ESTRUTURA DE RESPOSTA (OBRIGATÓRIO):
Sempre responda seguindo esta estrutura:

1. **Raciocínio** (breve): Explique seu pensamento no início
2. **Ações**: Use as ferramentas para executar tudo que for pedido
3. **Relatório**: Liste o que foi feito em bullets com ✅
4. **Próximos Passos**: Sugira 2-3 próximas ações relevantes

### QUALIDADE DOS NÓS (IMPORTANTE):
Ao criar nós, SEMPRE use design rico:
- **Descriptions detalhadas**: Mínimo 1-2 frases descrevendo o nó
- **Tags relevantes**: Adicione 2-4 tags temáticas por nó
- **Status adequado**: active para novos, review para análise
- **Prioridades**: Distribua entre low/medium/high/urgent logicamente
- **Checklists**: Adicione subtarefas quando o nó for tipo task
- **Tipos variados**: Use idea, task, note, research, data, question, decision, milestone
- **Cores via tags**: Use tags que façam sentido semântico

### EXEMPLOS DE INTERPRETAÇÃO:
- "cria um mapa sobre marketing digital" → batch_create_nodes com 15-25 nós estruturados
- "adiciona uma tarefa de revisar o código" → create_node type=task com checklist
- "muda o status do nó X para concluído" → update_node status=completed progress=100
- "organiza meu mapa" → analyze_map + reorganize_map
- "expande esse tópico" → batch_create_nodes com 5-8 subtópicos detalhados
- "deleta os nós duplicados" → find_nodes + delete_node
- "cria um gráfico dos dados" → create_node type=data com chart
- "transforma essas ideias em tarefas" → batch_update_nodes type=task com checklists
- "prioriza as tarefas" → batch_update_nodes com priority
- "adiciona checklist no nó X" → update_node com checklist items

### CRIAÇÃO DE MAPAS COMPLETOS:
Quando o usuário pedir para "criar um mapa sobre [tema]":
1. Crie um nó raiz central com o tema (tipo: idea ou milestone)
2. Crie 5-8 nós filhos principais (categorias/dimensões) — tipos variados
3. Para cada filho, crie 2-4 sub-nós com detalhes ricos
4. Cada nó deve ter description, tags, priority
5. Use tipos adequados para cada conceito
6. Para dados numéricos, use type=data com chart/table
7. Para dúvidas ou decisões, use type=question ou type=decision
8. Conecte nós relacionados com edges quando fizer sentido
`.trim(),

  assistant: `
## MODO: ASSISTENTE (Conversacional)
Você está no modo ASSISTENTE. Isso significa:
- Responda perguntas sobre o mapa de forma conversacional
- Dê sugestões e orientações
- Explique conceitos e conexões
- Use ferramentas apenas quando o usuário pedir explicitamente
- Foque em ser útil e informativo
`.trim(),

  research: `
## MODO: PESQUISA (Análise Profunda)
Você está no modo PESQUISA. Isso significa:
- Analise tópicos em profundidade
- Formule hipóteses com probabilidades
- Identifique fontes e referências
- Crie nós do tipo research com fontes detalhadas
- Use gráficos e tabelas para apresentar dados
- Sempre forneça níveis de confiança

### ESTRUTURA DE PESQUISA:
1. Crie um nó research com o tema principal
2. Adicione sub-nós com diferentes dimensões da pesquisa
3. Inclua nós reference com fontes relevantes
4. Adicione nós data com visualizações
5. Formule hipóteses como nós question com votação
`.trim(),

  creative: `
## MODO: CRIATIVO (Brainstorming)
Você está no modo CRIATIVO. Isso significa:
- Gere ideias divergentes e inesperadas
- Use analogias e metáforas
- Quebre padrões de pensamento
- Conecte conceitos aparentemente não relacionados
- Seja ousado e inovador
- Gere MUITAS ideias variadas (8-15 por vez)
- Use tipos variados de nós para enriquecer o brainstorming
`.trim(),

  analytical: `
## MODO: ANALÍTICO (Dados e Métricas)
Você está no modo ANALÍTICO. Isso significa:
- Analise o mapa quantitativamente
- Gere gráficos e tabelas com dados reais do mapa
- Identifique padrões e tendências
- Use análises como SWOT, PESTEL, Porter quando relevante
- Sempre forneça números e métricas
- Crie nós data com charts e tables
- Tipos de gráfico: bar, line, pie, area, radar
`.trim(),
};

// ─── Build Complete System Prompt ───────────────────────────────────────────

export function buildSystemPrompt(mode: AIAgentMode): string {
  return `${PLATFORM_CONTEXT}\n\n${MODE_INSTRUCTIONS[mode]}`;
}

// ─── Build Map Context for Messages ─────────────────────────────────────────

export interface MapContextInput {
  nodes: Array<{
    id: string;
    type: string;
    label: string;
    description?: string;
    status: string;
    priority: string;
    progress: number;
    tags?: string[];
    checklist?: Array<{ text: string; completed: boolean }>;
    chart?: any;
    table?: any;
    dueDate?: string;
    parentIds: string[];
    childIds: string[];
  }>;
  edges: Array<{ source: string; target: string; label?: string }>;
  selectedNodeId?: string | null;
  mapTitle?: string;
}

export function buildMapContextMessage(ctx: MapContextInput): string {
  const { nodes, edges, selectedNodeId, mapTitle } = ctx;
  
  if (nodes.length === 0) {
    return `[MAPA VAZIO - "${mapTitle || 'Sem título'}"] O mapa não tem nenhum nó ainda. Crie a estrutura inicial.`;
  }

  // Build compact but complete map representation
  const lines: string[] = [];
  lines.push(`## Mapa: "${mapTitle || 'Sem título'}" (${nodes.length} nós, ${edges.length} conexões)`);
  
  if (selectedNodeId) {
    const sel = nodes.find(n => n.id === selectedNodeId);
    if (sel) {
      lines.push(`### 🎯 Nó Selecionado: "${sel.label}" (id: ${sel.id}, tipo: ${sel.type})`);
      if (sel.description) lines.push(`   Descrição: ${sel.description.substring(0, 200)}`);
    }
  }

  lines.push('\n### Estrutura do Mapa:');
  
  // Build tree representation
  const rootNodes = nodes.filter(n => n.parentIds.length === 0);
  const childMap = new Map<string, typeof nodes>();
  for (const n of nodes) {
    for (const pid of n.parentIds) {
      if (!childMap.has(pid)) childMap.set(pid, []);
      childMap.get(pid)!.push(n);
    }
  }

  function renderNode(node: typeof nodes[0], depth: number): void {
    const indent = '  '.repeat(depth);
    const statusIcon = node.status === 'completed' ? '✅' : node.status === 'blocked' ? '🚫' : node.status === 'review' ? '👁️' : '•';
    const priorityIcon = node.priority === 'urgent' ? '🔴' : node.priority === 'high' ? '🟠' : node.priority === 'medium' ? '🟡' : '⚪';
    const selected = node.id === selectedNodeId ? ' ← SELECIONADO' : '';
    
    let info = `${indent}${statusIcon} [${node.type}] "${node.label}" (id:${node.id}) ${priorityIcon}`;
    if (node.progress > 0) info += ` ${node.progress}%`;
    if (node.tags?.length) info += ` #${node.tags.join(' #')}`;
    if (node.dueDate) info += ` 📅${node.dueDate}`;
    if (node.checklist?.length) {
      const done = node.checklist.filter(c => c.completed).length;
      info += ` [${done}/${node.checklist.length}]`;
    }
    info += selected;
    lines.push(info);
    
    if (node.description && depth < 2) {
      lines.push(`${indent}  → ${node.description.substring(0, 120)}`);
    }

    const children = childMap.get(node.id) || [];
    for (const child of children.slice(0, 15)) {
      renderNode(child, depth + 1);
    }
    if (children.length > 15) {
      lines.push(`${indent}  ... e mais ${children.length - 15} nós filhos`);
    }
  }

  for (const root of rootNodes.slice(0, 10)) {
    renderNode(root, 0);
  }

  // Nodes without parents that aren't roots (orphans connected differently)
  const renderedIds = new Set<string>();
  function collectRendered(node: typeof nodes[0]) {
    renderedIds.add(node.id);
    (childMap.get(node.id) || []).forEach(c => collectRendered(c));
  }
  rootNodes.forEach(r => collectRendered(r));

  const orphans = nodes.filter(n => !renderedIds.has(n.id));
  if (orphans.length > 0) {
    lines.push(`\n### Nós sem pai (${orphans.length}):`);
    orphans.slice(0, 10).forEach(n => {
      lines.push(`  • [${n.type}] "${n.label}" (id:${n.id})`);
    });
  }

  return lines.join('\n');
}

// ─── Conversation History Formatter ─────────────────────────────────────────

export function formatConversationHistory(
  history: Array<{ role: string; content: string }>,
  maxMessages = 10,
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history
    .slice(-maxMessages)
    .filter(m => m.role === 'user' || m.role === 'agent' || m.role === 'assistant')
    .map(m => ({
      role: (m.role === 'agent' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: m.content,
    }));
}

export default { buildSystemPrompt, buildMapContextMessage, formatConversationHistory };
