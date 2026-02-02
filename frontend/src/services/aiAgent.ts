/**
 * AI Agent Service - Powerful AI Integration for MindMap Hub
 * Uses Claude API through backend for intelligent mind mapping
 */

import { aiApi } from '@/lib/api';

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

/**
 * AI Agent Service Class
 */
class AIAgentService {
  private conversationHistory: AIMessage[] = [];
  private isProcessing: boolean = false;

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
