/**
 * AI Prompt Templates
 * Structured prompts for each AI agent type
 */

/**
 * Generate new ideas prompt
 */
export function generatePrompt(input: Record<string, any>, options: Record<string, any>): string {
  const { prompt, existing_nodes, map_title, map_description, parent_node_id } = input;
  const { count = 5, depth = 1, style = 'brainstorm' } = options;

  let contextInfo = '';
  
  if (map_title) {
    contextInfo += `\n**Título do Mapa:** ${map_title}`;
  }
  
  if (map_description) {
    contextInfo += `\n**Descrição:** ${map_description}`;
  }

  if (existing_nodes && existing_nodes.length > 0) {
    contextInfo += `\n\n**Nós existentes no mapa:**\n`;
    for (const node of existing_nodes.slice(0, 20)) {
      contextInfo += `- ${node.label}${node.content ? `: ${node.content.substring(0, 100)}` : ''}\n`;
    }
  }

  const styleInstructions = {
    brainstorm: 'Seja criativo e divergente, explore múltiplas direções sem julgamento.',
    structured: 'Organize as ideias de forma lógica e hierárquica, com categorias claras.',
    detailed: 'Forneça ideias bem desenvolvidas com descrições e contexto adicional.',
  };

  return `
## Tarefa: Gerar Novas Ideias

**Prompt do usuário:** ${prompt}
${contextInfo}

**Instruções:**
${styleInstructions[style as keyof typeof styleInstructions]}

Gere ${count} ideias relacionadas ao prompt.
${depth > 1 ? `Para cada ideia principal, sugira ${depth - 1} sub-ideias.` : ''}
${parent_node_id ? 'Estas ideias serão filhas do nó selecionado, então devem ser relacionadas a ele.' : ''}

**Formato de Resposta (JSON):**
\`\`\`json
[
  {
    "label": "Título curto da ideia (max 50 chars)",
    "content": "Descrição mais detalhada da ideia (opcional)",
    "type": "idea",
    "children": [
      {
        "label": "Sub-ideia",
        "type": "idea"
      }
    ]
  }
]
\`\`\`

Retorne APENAS o JSON, sem texto adicional antes ou depois.
`;
}

/**
 * Expand node prompt
 */
export function expandPrompt(input: Record<string, any>, options: Record<string, any>): string {
  const { node, parent, siblings, map_title } = input;
  const { count = 4, direction = 'deeper' } = options;

  let contextInfo = '';
  
  if (map_title) {
    contextInfo += `**Contexto do Mapa:** ${map_title}\n`;
  }

  if (parent) {
    contextInfo += `**Nó pai:** ${parent.label}\n`;
  }

  if (siblings && siblings.length > 0) {
    contextInfo += `**Nós irmãos:** ${siblings.map((s: any) => s.label).join(', ')}\n`;
  }

  const directionInstructions = {
    deeper: 'Gere sub-conceitos que aprofundam e detalham este tema.',
    related: 'Gere conceitos relacionados que expandem horizontalmente.',
    both: 'Gere uma mistura de sub-conceitos (aprofundamento) e conceitos relacionados.',
  };

  return `
## Tarefa: Expandir Nó

**Nó a expandir:** ${node.label}
${node.content ? `**Conteúdo:** ${node.content}` : ''}
**Tipo:** ${node.type}

${contextInfo}

**Instruções:**
${directionInstructions[direction as keyof typeof directionInstructions]}

Gere ${count} expansões para este nó.
Considere o contexto (pai, irmãos) para evitar repetições e manter coerência.

**Formato de Resposta (JSON):**
\`\`\`json
[
  {
    "label": "Título da expansão",
    "content": "Descrição opcional",
    "type": "idea",
    "relation": "child" | "sibling"
  }
]
\`\`\`

Retorne APENAS o JSON, sem texto adicional.
`;
}

/**
 * Summarize nodes prompt
 */
export function summarizePrompt(input: Record<string, any>, options: Record<string, any>): string {
  const { nodes, map_title, node_ids } = input;
  const { format = 'paragraph', length = 'medium' } = options;

  const lengthGuide = {
    short: '2-3 frases',
    medium: '1-2 parágrafos',
    long: '3-4 parágrafos com detalhes',
  };

  const formatGuide = {
    paragraph: 'texto corrido em parágrafos',
    bullets: 'lista de pontos principais em tópicos',
    executive: 'resumo executivo com destaques e conclusões',
  };

  // Build node tree representation
  let nodesInfo = '';
  for (const node of nodes) {
    nodesInfo += `- **${node.label}**${node.content ? `: ${node.content.substring(0, 200)}` : ''}\n`;
    if (node.children && node.children.length > 0) {
      for (const childId of node.children.slice(0, 5)) {
        const child = nodes.find((n: any) => n.id === childId);
        if (child) {
          nodesInfo += `  - ${child.label}\n`;
        }
      }
    }
  }

  return `
## Tarefa: Resumir Conteúdo

${map_title ? `**Mapa:** ${map_title}\n` : ''}
${node_ids ? `**Resumindo ${node_ids.length} nós selecionados**\n` : `**Resumindo ${nodes.length} nós**\n`}

**Estrutura do conteúdo:**
${nodesInfo}

**Instruções:**
Crie um resumo em formato de ${formatGuide[format as keyof typeof formatGuide]}.
Tamanho: ${lengthGuide[length as keyof typeof lengthGuide]}.

O resumo deve:
- Capturar os temas principais
- Identificar conexões e padrões
- Destacar insights importantes
- Manter a essência das ideias

**Formato de Resposta:**
Retorne apenas o texto do resumo, sem formatação JSON.
`;
}

/**
 * Convert to tasks prompt
 */
export function toTasksPrompt(input: Record<string, any>, options: Record<string, any>): string {
  const { nodes, node_ids, team_members } = input;
  const { include_subtasks = true, estimate_priority = true, suggest_assignees = false } = options;

  // Filter selected nodes
  const selectedNodes = node_ids 
    ? nodes.filter((n: any) => node_ids.includes(n.id))
    : nodes;

  let nodesInfo = '';
  for (const node of selectedNodes) {
    nodesInfo += `- **${node.label}**${node.content ? `: ${node.content.substring(0, 150)}` : ''}\n`;
  }

  let teamInfo = '';
  if (suggest_assignees && team_members && team_members.length > 0) {
    teamInfo = `\n**Membros da equipe disponíveis:**\n`;
    for (const member of team_members) {
      teamInfo += `- ${member.name} (ID: ${member.id})\n`;
    }
  }

  return `
## Tarefa: Converter em Tarefas Acionáveis

**Nós para converter:**
${nodesInfo}
${teamInfo}

**Instruções:**
Transforme cada nó em uma ou mais tarefas acionáveis.

Para cada tarefa:
- Use verbos de ação no título (Criar, Desenvolver, Revisar, etc.)
- Seja específico sobre o que precisa ser feito
- A descrição deve detalhar os passos ou critérios de conclusão
${estimate_priority ? '- Estime a prioridade (low, medium, high, urgent)' : ''}
${include_subtasks ? '- Inclua subtarefas quando apropriado (como checklist)' : ''}
${suggest_assignees ? '- Sugira um responsável da lista de membros quando relevante' : ''}

**Formato de Resposta (JSON):**
\`\`\`json
[
  {
    "node_id": "id do nó de origem",
    "title": "Título da tarefa com verbo de ação",
    "description": "Descrição detalhada do que fazer",
    "priority": "low" | "medium" | "high" | "urgent",
    "tags": ["tag1", "tag2"],
    ${include_subtasks ? `"checklist": [
      { "id": "1", "text": "Subtarefa 1", "done": false },
      { "id": "2", "text": "Subtarefa 2", "done": false }
    ],` : ''}
    ${suggest_assignees ? `"suggested_assignee_id": "id do membro sugerido ou null",` : ''}
    "estimated_hours": 2
  }
]
\`\`\`

Retorne APENAS o JSON, sem texto adicional.
`;
}

/**
 * Chat prompt
 */
export function chatPrompt(input: Record<string, any>, _options: Record<string, any>): string {
  const { message, nodes, selected_node_id, map_title, conversation_history } = input;

  let contextInfo = '';
  
  if (map_title) {
    contextInfo += `**Mapa atual:** ${map_title}\n`;
  }

  if (nodes && nodes.length > 0) {
    contextInfo += `\n**Nós no mapa (${nodes.length} total):**\n`;
    for (const node of nodes.slice(0, 15)) {
      contextInfo += `- ${node.label}${node.type !== 'idea' ? ` [${node.type}]` : ''}\n`;
    }
    if (nodes.length > 15) {
      contextInfo += `... e mais ${nodes.length - 15} nós\n`;
    }
  }

  if (selected_node_id) {
    const selectedNode = nodes?.find((n: any) => n.id === selected_node_id);
    if (selectedNode) {
      contextInfo += `\n**Nó selecionado:** ${selectedNode.label}\n`;
      if (selectedNode.content) {
        contextInfo += `**Conteúdo:** ${selectedNode.content.substring(0, 300)}\n`;
      }
    }
  }

  let historyInfo = '';
  if (conversation_history && conversation_history.length > 0) {
    historyInfo = '\n**Histórico da conversa:**\n';
    for (const msg of conversation_history.slice(-5)) {
      historyInfo += `${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.content.substring(0, 200)}\n`;
    }
  }

  return `
## Contexto do Mapa Mental
${contextInfo}
${historyInfo}

## Mensagem do Usuário
${message}

## Instruções
Responda à mensagem do usuário considerando o contexto do mapa mental.
Você pode:
- Responder perguntas sobre o conteúdo do mapa
- Sugerir melhorias ou adições
- Ajudar a organizar ideias
- Explicar conexões entre conceitos
- Dar feedback sobre a estrutura

Seja conciso mas útil. Se o usuário pedir para fazer algo específico (gerar ideias, criar tarefas, etc.), 
sugira usar as ferramentas apropriadas da plataforma.

Responda diretamente, sem formato JSON.
`;
}
