/**
 * AI Agent Service - Powerful AI Integration for MindMap Hub
 * Uses Claude API through backend for intelligent mind mapping
 * Includes local fallback for demo purposes
 */

import { aiApi } from '@/lib/api';

// Configuration - set to true to use local AI simulation for demo
const USE_LOCAL_AI = true;

// Types for AI Agent
export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokensUsed?: number;
    agentType?: string;
    suggestions?: AISuggestion[];
  };
}

export interface AISuggestion {
  id: string;
  label: string;
  type: 'idea' | 'task' | 'process' | 'data' | 'reference' | 'note';
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  children?: AISuggestion[];
}

export interface AIGenerateOptions {
  count?: number;
  style?: 'creative' | 'analytical' | 'structured' | 'brainstorm';
  depth?: number;
  includeConnections?: boolean;
}

export interface AIExpandOptions {
  count?: number;
  direction?: 'children' | 'siblings' | 'both';
  depth?: number;
}

export interface AIAgent {
  type: 'generate' | 'expand' | 'summarize' | 'toTasks' | 'chat' | 'analyze' | 'organize';
  name: string;
  description: string;
  icon: string;
  color: string;
}

// Available AI Agents
export const AI_AGENTS: AIAgent[] = [
  {
    type: 'generate',
    name: 'Gerador de Ideias',
    description: 'Gera novas ideias e conceitos baseados em um tema',
    icon: '💡',
    color: '#FFB800',
  },
  {
    type: 'expand',
    name: 'Expansor Neural',
    description: 'Expande um nó com sub-ideias relacionadas',
    icon: '🧠',
    color: '#00D9FF',
  },
  {
    type: 'summarize',
    name: 'Sintetizador',
    description: 'Resume e sintetiza informações do mapa',
    icon: '📝',
    color: '#00FFC8',
  },
  {
    type: 'toTasks',
    name: 'Conversor de Tarefas',
    description: 'Transforma ideias em tarefas acionáveis',
    icon: '✅',
    color: '#34D399',
  },
  {
    type: 'chat',
    name: 'Assistente IA',
    description: 'Converse sobre seu mapa mental',
    icon: '💬',
    color: '#A78BFA',
  },
  {
    type: 'analyze',
    name: 'Analisador',
    description: 'Analisa padrões e conexões no mapa',
    icon: '🔍',
    color: '#F472B6',
  },
  {
    type: 'organize',
    name: 'Organizador',
    description: 'Reorganiza e estrutura o mapa automaticamente',
    icon: '📊',
    color: '#60A5FA',
  },
];

// Local AI templates for demo
const LOCAL_AI_TEMPLATES = {
  ideaExpansions: {
    'pesquisa': ['Revisão Bibliográfica', 'Metodologia', 'Coleta de Dados', 'Análise', 'Conclusões'],
    'projeto': ['Planejamento', 'Design', 'Implementação', 'Testes', 'Deploy'],
    'negócio': ['Modelo de Negócio', 'Análise de Mercado', 'Estratégia', 'Marketing', 'Finanças'],
    'produto': ['Pesquisa de Usuários', 'Features', 'MVP', 'Roadmap', 'Métricas'],
    'marketing': ['Público-alvo', 'Canais', 'Conteúdo', 'SEO', 'Conversão'],
    'tecnologia': ['Arquitetura', 'Frontend', 'Backend', 'Banco de Dados', 'DevOps'],
    'ia': ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Agentes Autônomos'],
    'default': ['Subtópico 1', 'Subtópico 2', 'Detalhes', 'Próximos Passos', 'Referências'],
  },
  chatResponses: [
    'Analisei seu mapa e identifiquei alguns padrões interessantes. Posso sugerir expansões para os nós principais?',
    'Seu mapa está bem estruturado! Recomendo adicionar mais conexões entre os conceitos relacionados.',
    'Identifiquei que alguns nós podem ser convertidos em tarefas acionáveis. Deseja que eu faça isso?',
    'Baseado no contexto do seu mapa, posso gerar ideias complementares para expandir o tema principal.',
    'Notei que há oportunidades de criar sub-categorias para melhor organização. Gostaria de sugestões?',
  ],
  taskTemplates: [
    { prefix: 'Pesquisar sobre', priority: 'medium' as const },
    { prefix: 'Documentar', priority: 'low' as const },
    { prefix: 'Implementar', priority: 'high' as const },
    { prefix: 'Revisar', priority: 'medium' as const },
    { prefix: 'Validar', priority: 'high' as const },
  ],
};

/**
 * Local AI simulation for demo purposes
 */
class LocalAISimulator {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generate(prompt: string, count: number = 5): Promise<AISuggestion[]> {
    await this.delay(800 + Math.random() * 500);
    
    const words = prompt.toLowerCase().split(' ');
    let template = LOCAL_AI_TEMPLATES.ideaExpansions.default;
    
    for (const word of words) {
      for (const [key, expansions] of Object.entries(LOCAL_AI_TEMPLATES.ideaExpansions)) {
        if (word.includes(key) || key.includes(word)) {
          template = expansions;
          break;
        }
      }
    }

    return template.slice(0, count).map((label, i) => ({
      id: `gen-${Date.now()}-${i}`,
      label: `${label}`,
      type: i < 2 ? 'idea' : i < 4 ? 'process' : 'reference' as any,
      description: `Ideia gerada para: ${prompt}`,
      priority: (['medium', 'high', 'low'] as const)[i % 3],
      tags: [prompt.split(' ')[0], label.split(' ')[0]].filter(Boolean),
    }));
  }

  async expand(node: { label: string; type: string }, count: number = 4): Promise<AISuggestion[]> {
    await this.delay(600 + Math.random() * 400);
    
    const baseLabel = node.label.toLowerCase();
    let expansions = LOCAL_AI_TEMPLATES.ideaExpansions.default;

    for (const [key, values] of Object.entries(LOCAL_AI_TEMPLATES.ideaExpansions)) {
      if (baseLabel.includes(key)) {
        expansions = values;
        break;
      }
    }

    const types: AISuggestion['type'][] = ['idea', 'task', 'note', 'reference', 'process', 'data'];
    
    return expansions.slice(0, count).map((label, i) => ({
      id: `exp-${Date.now()}-${i}`,
      label: `${label}`,
      type: types[i % types.length],
      description: `Expansão de "${node.label}"`,
      priority: (['medium', 'high', 'low', 'medium'] as const)[i % 4],
      tags: [node.type, label.split(' ')[0]].filter(Boolean),
    }));
  }

  async summarize(nodes: Array<{ label: string; type: string }>): Promise<{ summary: string; insights: string[] }> {
    await this.delay(1000 + Math.random() * 500);
    
    const nodeLabels = nodes.map(n => n.label).join(', ');
    const types = [...new Set(nodes.map(n => n.type))];
    
    return {
      summary: `Este mapa mental contém ${nodes.length} nós organizados em categorias: ${types.join(', ')}. Os principais temas abordados são: ${nodes.slice(0, 5).map(n => n.label).join(', ')}.`,
      insights: [
        `Total de ${nodes.length} conceitos mapeados`,
        `Predominância de nós do tipo "${types[0]}"`,
        `Boa estrutura hierárquica identificada`,
        `Sugestão: Adicionar mais conexões entre ideias relacionadas`,
        `Oportunidade de expandir os conceitos principais`,
      ],
    };
  }

  async toTasks(nodes: Array<{ label: string; type: string }>): Promise<AISuggestion[]> {
    await this.delay(700 + Math.random() * 400);
    
    return nodes.slice(0, 5).map((node, i) => {
      const template = LOCAL_AI_TEMPLATES.taskTemplates[i % LOCAL_AI_TEMPLATES.taskTemplates.length];
      return {
        id: `task-${Date.now()}-${i}`,
        label: `${template.prefix} ${node.label}`,
        type: 'task' as const,
        description: `Tarefa criada a partir do nó "${node.label}"`,
        priority: template.priority,
        tags: ['gerado-ia', node.type],
      };
    });
  }

  async chat(message: string, nodes?: Array<{ label: string }>): Promise<string> {
    await this.delay(500 + Math.random() * 800);
    
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('ajud') || lowerMessage.includes('help')) {
      return `Posso ajudar você de várias formas:
      
🔹 **Gerar ideias**: Digite um tema e usarei IA para criar novos nós
🔹 **Expandir nós**: Selecione um nó e peça para expandir
🔹 **Criar tarefas**: Converto ideias em tarefas acionáveis
🔹 **Resumir**: Faço um resumo de todo o seu mapa
🔹 **Analisar**: Identifico padrões e sugiro conexões

O que você gostaria de fazer?`;
    }
    
    if (lowerMessage.includes('gerar') || lowerMessage.includes('criar') || lowerMessage.includes('ideia')) {
      return `Ótimo! Identifiquei que você quer gerar novas ideias. Para melhor resultado:

1. Selecione o botão **"Gerar"** no menu de agentes
2. Descreva o tema com detalhes
3. Eu criarei ${nodes?.length || 5}+ sugestões relevantes

Posso gerar ideias sobre qualquer tópico: negócios, tecnologia, pesquisa, projetos e muito mais!`;
    }
    
    if (lowerMessage.includes('tarefa') || lowerMessage.includes('task')) {
      return `Posso converter seus conceitos em tarefas! ${nodes ? `\n\nVejo que você tem ${nodes.length} nós no mapa. Selecione "Converter em Tarefas" para transformar ideias em ações.` : ''}`;
    }

    // Default response
    return LOCAL_AI_TEMPLATES.chatResponses[Math.floor(Math.random() * LOCAL_AI_TEMPLATES.chatResponses.length)] +
      (nodes?.length ? `\n\nSeu mapa atual tem ${nodes.length} nós. Posso ajudar a expandir ou organizar melhor.` : '');
  }

  async analyze(nodes: Array<{ label: string; type: string }>): Promise<{
    patterns: string[];
    connections: Array<{ from: string; to: string; reason: string }>;
    recommendations: string[];
  }> {
    await this.delay(1200 + Math.random() * 600);
    
    const types = nodes.map(n => n.type);
    const typeCount = types.reduce((acc, t) => {
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const patterns = [
      `Estrutura com ${nodes.length} nós identificados`,
      `Tipo predominante: ${Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'idea'}`,
      `Distribuição de tipos: ${Object.entries(typeCount).map(([k, v]) => `${k}(${v})`).join(', ')}`,
      `Profundidade de conceitos adequada para brainstorming`,
    ];

    const connections = nodes.length >= 2 ? [
      { from: nodes[0].label, to: nodes[1]?.label || 'Novo nó', reason: 'Relação conceitual identificada' },
      ...(nodes.length > 3 ? [{ from: nodes[2].label, to: nodes[3]?.label || 'Novo nó', reason: 'Possível dependência' }] : []),
    ] : [];

    const recommendations = [
      'Considere adicionar mais sub-nós aos conceitos principais',
      'Recomendo criar conexões entre ideias relacionadas',
      'Adicione descrições detalhadas para melhor contexto',
      'Converta ideias maduras em tarefas acionáveis',
    ];

    return { patterns, connections, recommendations };
  }
}

/**
 * AI Agent Service Class
 */
class AIAgentService {
  private conversationHistory: AIMessage[] = [];
  private isProcessing: boolean = false;
  private localAI = new LocalAISimulator();

  /**
   * Generate new ideas based on a prompt
   */
  async generate(
    mapId: string,
    prompt: string,
    parentNodeId?: string,
    options: AIGenerateOptions = {}
  ): Promise<{ suggestions: AISuggestion[]; message: string }> {
    this.isProcessing = true;
    
    try {
      if (USE_LOCAL_AI) {
        const suggestions = await this.localAI.generate(prompt, options.count || 5);
        return {
          suggestions,
          message: `Gerado ${suggestions.length} ideias baseadas em "${prompt}"`,
        };
      }

      const response = await aiApi.generate({
        map_id: mapId,
        prompt,
        parent_node_id: parentNodeId,
        options: {
          count: options.count || 5,
          style: options.style || 'creative',
        },
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to generate ideas');
      }

      const data = response.data as any;
      const suggestions = this.parseSuggestions(data.suggestions || []);

      return {
        suggestions,
        message: `Gerado ${suggestions.length} ideias baseadas em "${prompt}"`,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Expand a node with related sub-ideas
   */
  async expand(
    mapId: string,
    node: { id: string; label: string; type: string; content?: string },
    options: AIExpandOptions = {}
  ): Promise<{ suggestions: AISuggestion[]; message: string }> {
    this.isProcessing = true;
    
    try {
      if (USE_LOCAL_AI) {
        const suggestions = await this.localAI.expand(node, options.count || 4);
        return {
          suggestions,
          message: `Expandido "${node.label}" com ${suggestions.length} sub-ideias`,
        };
      }

      const response = await aiApi.expand({
        map_id: mapId,
        node_id: node.id,
        context: { node },
        options: {
          count: options.count || 4,
          direction: options.direction || 'children',
        },
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to expand node');
      }

      const data = response.data as any;
      const suggestions = this.parseSuggestions(data.suggestions || []);

      return {
        suggestions,
        message: `Expandido "${node.label}" com ${suggestions.length} sub-ideias`,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Summarize nodes in the map
   */
  async summarize(
    mapId: string,
    nodes: Array<{ id: string; label: string; type: string; content?: string }>,
    format: 'brief' | 'detailed' | 'bullets' = 'brief'
  ): Promise<{ summary: string; insights: string[] }> {
    this.isProcessing = true;
    
    try {
      if (USE_LOCAL_AI) {
        return await this.localAI.summarize(nodes);
      }

      const response = await aiApi.summarize({
        map_id: mapId,
        context: { nodes },
        options: { format, length: format === 'brief' ? 'short' : 'medium' },
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to summarize');
      }

      const data = response.data as any;

      return {
        summary: data.summary || 'Não foi possível gerar um resumo.',
        insights: this.extractInsights(data.summary || ''),
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Convert nodes to actionable tasks
   */
  async toTasks(
    mapId: string,
    nodes: Array<{ id: string; label: string; type: string; content?: string }>,
    includeSubtasks: boolean = true
  ): Promise<{ tasks: AISuggestion[]; message: string }> {
    this.isProcessing = true;
    
    try {
      if (USE_LOCAL_AI) {
        const tasks = await this.localAI.toTasks(nodes);
        return {
          tasks,
          message: `Criadas ${tasks.length} tarefas a partir de ${nodes.length} nós`,
        };
      }

      const response = await aiApi.toTasks({
        map_id: mapId,
        node_ids: nodes.map(n => n.id),
        context: { nodes },
        options: { include_subtasks: includeSubtasks },
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to convert to tasks');
      }

      const data = response.data as any;
      const tasks = this.parseTaskSuggestions(data.suggestions || []);

      return {
        tasks,
        message: `Criadas ${tasks.length} tarefas a partir de ${nodes.length} nós`,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Chat with AI about the map
   */
  async chat(
    mapId: string,
    message: string,
    nodes?: Array<{ id: string; label: string }>
  ): Promise<AIMessage> {
    this.isProcessing = true;
    
    // Add user message to history
    const userMessage: AIMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    this.conversationHistory.push(userMessage);

    try {
      if (USE_LOCAL_AI) {
        const responseText = await this.localAI.chat(message, nodes);
        const assistantMessage: AIMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
          metadata: { agentType: 'chat' },
        };
        this.conversationHistory.push(assistantMessage);
        return assistantMessage;
      }

      const response = await aiApi.chat({
        map_id: mapId,
        message,
        context: {
          nodes,
          conversation_history: this.conversationHistory
            .slice(-10) // Last 10 messages
            .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        },
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to chat');
      }

      const data = response.data as any;
      
      const assistantMessage: AIMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.response || 'Desculpe, não consegui processar sua mensagem.',
        timestamp: new Date(),
        metadata: {
          tokensUsed: data.tokensOutput,
          agentType: 'chat',
        },
      };
      
      this.conversationHistory.push(assistantMessage);
      
      return assistantMessage;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Analyze map patterns and connections
   */
  async analyze(
    mapId: string,
    nodes: Array<{ id: string; label: string; type: string; content?: string }>
  ): Promise<{
    patterns: string[];
    connections: Array<{ from: string; to: string; reason: string }>;
    recommendations: string[];
  }> {
    this.isProcessing = true;
    
    try {
      if (USE_LOCAL_AI) {
        return await this.localAI.analyze(nodes);
      }

      // Use chat endpoint with analysis prompt
      const response = await aiApi.chat({
        map_id: mapId,
        message: `Analise este mapa mental e identifique:
1. Padrões principais (liste 3-5)
2. Conexões potenciais entre conceitos
3. Recomendações de melhoria

Nós do mapa: ${nodes.map(n => n.label).join(', ')}

Responda em JSON com as chaves: patterns, connections, recommendations`,
        context: { nodes },
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to analyze');
      }

      const data = response.data as any;
      
      // Try to parse JSON from response
      try {
        const jsonMatch = data.response?.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            patterns: parsed.patterns || [],
            connections: parsed.connections || [],
            recommendations: parsed.recommendations || [],
          };
        }
      } catch {
        // If parsing fails, return structured defaults
      }

      return {
        patterns: ['Análise não disponível'],
        connections: [],
        recommendations: ['Continue expandindo seu mapa para melhores insights'],
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get AI agent by type
   */
  getAgent(type: string): AIAgent | undefined {
    return AI_AGENTS.find(a => a.type === type);
  }

  /**
   * Get all available agents
   */
  getAllAgents(): AIAgent[] {
    return AI_AGENTS;
  }

  /**
   * Get conversation history
   */
  getHistory(): AIMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }

  /**
   * Check if AI is processing
   */
  get processing(): boolean {
    return this.isProcessing;
  }

  // Private helpers
  private parseSuggestions(raw: any[]): AISuggestion[] {
    return raw.map((item, index) => ({
      id: `suggestion-${Date.now()}-${index}`,
      label: item.label || item.title || item.name || `Ideia ${index + 1}`,
      type: this.mapNodeType(item.type),
      description: item.description || item.content || '',
      priority: item.priority || 'medium',
      tags: item.tags || [],
    }));
  }

  private parseTaskSuggestions(raw: any[]): AISuggestion[] {
    return raw.map((item, index) => ({
      id: `task-${Date.now()}-${index}`,
      label: item.title || item.label || `Tarefa ${index + 1}`,
      type: 'task',
      description: item.description || '',
      priority: item.priority || 'medium',
      tags: item.tags || [],
    }));
  }

  private mapNodeType(type?: string): AISuggestion['type'] {
    const typeMap: Record<string, AISuggestion['type']> = {
      idea: 'idea',
      concept: 'idea',
      task: 'task',
      action: 'task',
      process: 'process',
      workflow: 'process',
      data: 'data',
      info: 'data',
      reference: 'reference',
      link: 'reference',
      note: 'note',
      comment: 'note',
    };
    return typeMap[type?.toLowerCase() || ''] || 'idea';
  }

  private extractInsights(text: string): string[] {
    // Extract bullet points or numbered items
    const lines = text.split('\n')
      .map(l => l.trim())
      .filter(l => l.match(/^[-*•]\s+/) || l.match(/^\d+\.\s+/))
      .map(l => l.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, ''));
    
    return lines.length > 0 ? lines : [text.substring(0, 200)];
  }
}

// Export singleton instance
export const aiAgent = new AIAgentService();
