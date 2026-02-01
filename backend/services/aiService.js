const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompts for different AI operations
const SYSTEM_PROMPTS = {
  generateMap: `Você é um especialista em criação de mapas mentais estruturados. Sua tarefa é gerar estruturas hierárquicas de ideias baseadas no prompt do usuário.

REGRAS IMPORTANTES:
1. Retorne APENAS um JSON válido, sem markdown ou texto extra
2. O formato deve ser um array de objetos com a estrutura: { "content": "título", "description": "descrição opcional", "children": [...] }
3. Crie uma estrutura lógica e bem organizada
4. Use títulos concisos (2-5 palavras) e descrições mais detalhadas quando relevante
5. Não ultrapasse 3 níveis de profundidade
6. Crie entre 3-6 ramos principais
7. Adapte a estrutura ao tema solicitado

Exemplo de output:
[
  {
    "content": "Introdução",
    "description": "Contexto inicial do projeto",
    "children": [
      { "content": "Objetivo", "description": "Meta principal" },
      { "content": "Escopo", "description": "Abrangência do trabalho" }
    ]
  },
  {
    "content": "Metodologia",
    "children": [
      { "content": "Coleta de Dados" },
      { "content": "Análise" }
    ]
  }
]`,

  expandNode: `Você é um assistente criativo de brainstorming. Sua tarefa é sugerir ideias relacionadas a um tópico específico.

REGRAS:
1. Retorne APENAS um array JSON de strings com as sugestões
2. Sugira ideias relevantes e diversificadas
3. Evite repetir conceitos já existentes (serão fornecidos como contexto)
4. Seja criativo mas relevante ao tema
5. Sugira entre 3-5 ideias

Exemplo de output:
["Ideia 1", "Ideia 2", "Ideia 3"]`,

  summarize: `Você é um especialista em síntese de informações. Sua tarefa é criar resumos concisos e informativos.

REGRAS:
1. Crie um resumo claro e estruturado
2. Destaque os pontos principais
3. Use linguagem objetiva
4. O resumo deve ter no máximo 3 parágrafos
5. Se houver muitos itens, agrupe-os por categorias`,

  chat: `Você é um assistente inteligente integrado a uma plataforma de mapas mentais colaborativos. Seu nome é MindBot.

CONTEXTO:
- Você ajuda uma equipe de 3 pessoas: Guilherme, Helen e Pablo
- Eles usam a plataforma para brainstorming e gerenciamento de projetos
- A plataforma combina mapas mentais, listas e quadros Kanban

CAPACIDADES:
- Sugerir ideias e expansões para o mapa mental
- Ajudar a organizar e priorizar tarefas
- Responder dúvidas sobre os projetos (com base no contexto fornecido)
- Dar dicas de produtividade e colaboração
- Auxiliar na escrita e estruturação de conteúdo

PERSONALIDADE:
- Seja amigável e prestativo
- Use português brasileiro
- Seja conciso mas completo
- Ofereça sugestões proativas quando apropriado`
};

// Parse AI response to handle potential JSON wrapped in markdown
function parseAIResponse(text, expectJson = true) {
  if (!expectJson) return text;
  
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    text = jsonMatch[1].trim();
  }
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    console.error('Raw response:', text);
    throw new Error('Failed to parse AI response as JSON');
  }
}

module.exports = {
  /**
   * Generate a complete mind map structure from a prompt
   */
  async generateMap(prompt, options = {}) {
    const { depth = 2, maxBranches = 5 } = options;
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPTS.generateMap,
      messages: [
        {
          role: 'user',
          content: `Crie um mapa mental sobre: "${prompt}"

Configurações:
- Profundidade máxima: ${depth} níveis
- Ramos principais: máximo ${maxBranches}

Retorne APENAS o JSON, sem explicações.`
        }
      ]
    });

    const text = response.content[0].text;
    return parseAIResponse(text, true);
  },

  /**
   * Expand a node with AI-generated suggestions
   */
  async expandNode(nodeContent, context = {}) {
    const { siblings = [], parentContent = '', mapContext = '' } = context;
    
    const siblingsList = siblings.length > 0 
      ? `\nItens irmãos existentes (evite repetir): ${siblings.join(', ')}`
      : '';
    
    const parentInfo = parentContent 
      ? `\nTópico pai: ${parentContent}`
      : '';

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPTS.expandNode,
      messages: [
        {
          role: 'user',
          content: `Sugira ideias relacionadas a: "${nodeContent}"
${parentInfo}
${siblingsList}

${mapContext ? `Contexto do mapa: ${mapContext}` : ''}

Retorne APENAS um array JSON de strings com 3-5 sugestões.`
        }
      ]
    });

    const text = response.content[0].text;
    return parseAIResponse(text, true);
  },

  /**
   * Summarize content (nodes, attachments, or text)
   */
  async summarize(content, options = {}) {
    const { type = 'nodes', title = '' } = options;
    
    let contentStr;
    if (Array.isArray(content)) {
      // Array of nodes
      contentStr = content.map(n => {
        let str = `- ${n.content}`;
        if (n.description) str += `: ${n.description}`;
        if (n.children && n.children.length > 0) {
          str += `\n  Subitens: ${n.children.map(c => c.content).join(', ')}`;
        }
        return str;
      }).join('\n');
    } else {
      contentStr = content;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPTS.summarize,
      messages: [
        {
          role: 'user',
          content: `${title ? `Título: ${title}\n\n` : ''}Conteúdo para resumir:

${contentStr}

Crie um resumo estruturado e informativo.`
        }
      ]
    });

    return response.content[0].text;
  },

  /**
   * Chat with AI assistant
   */
  async chat(message, context = {}) {
    const { history = [], mapContext = '', currentUser = '' } = context;
    
    // Build messages array with history
    const messages = [];
    
    // Add previous messages from history
    for (const msg of history.slice(-10)) { // Keep last 10 messages for context
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }
    
    // Build context info
    let contextInfo = '';
    if (currentUser) {
      contextInfo += `\n[Usuário atual: ${currentUser}]`;
    }
    if (mapContext) {
      contextInfo += `\n[Contexto do mapa atual: ${mapContext}]`;
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: contextInfo ? `${contextInfo}\n\nMensagem: ${message}` : message
    });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPTS.chat,
      messages: messages
    });

    return response.content[0].text;
  },

  /**
   * Generate task suggestions based on project context
   */
  async suggestTasks(projectContext, options = {}) {
    const { existingTasks = [], users = [] } = options;
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `Você é um assistente de gerenciamento de projetos. Sugira tarefas práticas e acionáveis.

REGRAS:
1. Retorne APENAS um array JSON
2. Cada tarefa deve ter: content (título), description (descrição), priority (high/medium/low), suggestedAssignee (nome do usuário ou null)
3. Sugira 3-5 tarefas relevantes
4. Considere as habilidades de cada usuário se fornecidas`,
      messages: [
        {
          role: 'user',
          content: `Contexto do projeto:
${projectContext}

${existingTasks.length > 0 ? `Tarefas já existentes: ${existingTasks.join(', ')}` : ''}
${users.length > 0 ? `Usuários disponíveis: ${users.map(u => `${u.name} (${u.title || 'membro'})`).join(', ')}` : ''}

Sugira novas tarefas relevantes.`
        }
      ]
    });

    const text = response.content[0].text;
    return parseAIResponse(text, true);
  },

  /**
   * Analyze project for insights and improvements
   */
  async analyzeProject(nodes, options = {}) {
    const { includeRisks = true, includeSuggestions = true } = options;
    
    const nodesStr = nodes.map(n => {
      let str = `- ${n.content}`;
      if (n.status) str += ` [${n.status}]`;
      if (n.assigned_to) str += ` (atribuído)`;
      return str;
    }).join('\n');

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: `Você é um analista de projetos experiente. Analise a estrutura do projeto e forneça insights valiosos.`,
      messages: [
        {
          role: 'user',
          content: `Analise este projeto:

${nodesStr}

Forneça:
${includeRisks ? '1. Possíveis riscos ou pontos cegos' : ''}
${includeSuggestions ? '2. Sugestões de melhoria' : ''}
3. Avaliação geral da estrutura

Seja conciso e prático.`
        }
      ]
    });

    return response.content[0].text;
  }
};
