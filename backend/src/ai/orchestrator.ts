import Anthropic from '@anthropic-ai/sdk';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../services/supabase';
import { generatePrompt, expandPrompt, summarizePrompt, toTasksPrompt, chatPrompt } from './prompts';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: env.CLAUDE_API_KEY,
});

// Agent types
export type AIAgentType = 'generate' | 'expand' | 'summarize' | 'to_tasks' | 'chat';

// Orchestrator input
interface OrchestratorInput {
  agentType: AIAgentType;
  mapId: string;
  userId: string;
  input: Record<string, any>;
  options: Record<string, any>;
}

// Orchestrator result
interface OrchestratorResult {
  runId: string;
  agentType: AIAgentType;
  status: 'completed' | 'failed';
  suggestions?: any[];
  summary?: string;
  response?: string;
  tokensInput: number;
  tokensOutput: number;
  durationMs: number;
  error?: string;
}

/**
 * AI Orchestrator
 * Manages AI agent execution, logging, and response processing
 */
class AIOrchestrator {
  private model: string;
  private maxTokens: number;

  constructor() {
    this.model = env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
    this.maxTokens = 4096;
  }

  /**
   * Execute an AI agent
   */
  async execute(params: OrchestratorInput): Promise<OrchestratorResult> {
    const startTime = Date.now();
    let runId: string | undefined;

    try {
      // Create AI run record
      const aiRunData: any = {
        map_id: params.mapId,
        user_id: params.userId,
        agent_type: params.agentType,
        input_context: params.input,
        model_used: this.model,
        status: 'running',
      };
      
      const { data: run, error: insertError } = await supabaseAdmin
        .from('ai_runs')
        .insert(aiRunData)
        .select('id')
        .single() as any;

      if (insertError || !run) {
        throw new Error('Failed to create AI run record');
      }

      runId = run.id;

      // Build prompt based on agent type
      const prompt = this.buildPrompt(params.agentType, params.input, params.options);

      logger.debug({ 
        runId, 
        agentType: params.agentType, 
        promptLength: prompt.length 
      }, 'Executing AI agent');

      // Call Claude API
      const response = await anthropic.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: this.getSystemPrompt(params.agentType),
      });

      const durationMs = Date.now() - startTime;

      // Extract text content
      const textContent = response.content.find(c => c.type === 'text');
      const rawResponse = textContent?.text || '';

      // Parse response based on agent type
      const parsedResult = this.parseResponse(params.agentType, rawResponse);

      // Update AI run record
      const updateData: any = {
        output_result: parsedResult,
        tokens_input: response.usage.input_tokens,
        tokens_output: response.usage.output_tokens,
        duration_ms: durationMs,
        status: 'completed',
        completed_at: new Date().toISOString(),
      };
      
      await supabaseAdmin
        .from('ai_runs')
        .update(updateData)
        .eq('id', runId);

      logger.info({ 
        runId, 
        agentType: params.agentType,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        durationMs,
      }, 'AI agent completed');

      return {
        runId,
        agentType: params.agentType,
        status: 'completed',
        ...parsedResult,
        tokensInput: response.usage.input_tokens,
        tokensOutput: response.usage.output_tokens,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error({ 
        runId, 
        agentType: params.agentType, 
        error: errorMessage,
        durationMs,
      }, 'AI agent failed');

      // Update AI run record with failure
      if (runId) {
        const failedData: any = {
          status: 'failed',
          error_message: errorMessage,
          duration_ms: durationMs,
          completed_at: new Date().toISOString(),
        };
        
        await supabaseAdmin
          .from('ai_runs')
          .update(failedData)
          .eq('id', runId);
      }

      return {
        runId: runId || '',
        agentType: params.agentType,
        status: 'failed',
        tokensInput: 0,
        tokensOutput: 0,
        durationMs,
        error: errorMessage,
      };
    }
  }

  /**
   * Get system prompt based on agent type
   */
  private getSystemPrompt(agentType: AIAgentType): string {
    const basePrompt = `Você é um assistente inteligente especializado em mapas mentais colaborativos. 
Você ajuda equipes a organizar ideias, criar estruturas de conhecimento e transformar conceitos em ações.
Sempre responda em português brasileiro, a menos que o usuário escreva em outro idioma.
Suas respostas devem ser práticas, criativas e bem estruturadas.`;

    const agentPrompts: Record<AIAgentType, string> = {
      generate: `${basePrompt}
Você é especialista em brainstorming e geração de ideias. 
Ao gerar ideias, seja criativo mas relevante ao contexto fornecido.
Sempre retorne as ideias em formato JSON estruturado.`,
      
      expand: `${basePrompt}
Você é especialista em aprofundar e expandir conceitos.
Ao expandir um nó, gere sub-ideias que sejam logicamente conectadas ao conceito pai.
Considere múltiplas perspectivas e dimensões do tema.
Sempre retorne as expansões em formato JSON estruturado.`,
      
      summarize: `${basePrompt}
Você é especialista em sintetizar e resumir informações complexas.
Ao resumir, capture a essência das ideias preservando os pontos mais importantes.
Identifique padrões, conexões e insights principais.`,
      
      to_tasks: `${basePrompt}
Você é especialista em transformar ideias em ações concretas e mensuráveis.
Ao criar tarefas, use verbos de ação e seja específico sobre o que precisa ser feito.
Considere dependências, prioridades e possíveis responsáveis.
Sempre retorne as tarefas em formato JSON estruturado.`,
      
      chat: `${basePrompt}
Você é um assistente conversacional para ajudar com o mapa mental.
Responda perguntas, dê sugestões e ajude a organizar ideias através do diálogo.
Seja conciso mas completo em suas respostas.`,
    };

    return agentPrompts[agentType];
  }

  /**
   * Build prompt based on agent type
   */
  private buildPrompt(agentType: AIAgentType, input: Record<string, any>, options: Record<string, any>): string {
    switch (agentType) {
      case 'generate':
        return generatePrompt(input, options);
      case 'expand':
        return expandPrompt(input, options);
      case 'summarize':
        return summarizePrompt(input, options);
      case 'to_tasks':
        return toTasksPrompt(input, options);
      case 'chat':
        return chatPrompt(input, options);
      default:
        throw new Error(`Unknown agent type: ${agentType}`);
    }
  }

  /**
   * Parse AI response based on agent type
   */
  private parseResponse(agentType: AIAgentType, rawResponse: string): Record<string, any> {
    try {
      // Try to extract JSON from response
      const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                        rawResponse.match(/\{[\s\S]*\}/) ||
                        rawResponse.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        switch (agentType) {
          case 'generate':
          case 'expand':
            return {
              suggestions: Array.isArray(parsed) ? parsed : parsed.suggestions || parsed.ideas || [parsed],
            };
          
          case 'to_tasks':
            return {
              suggestions: Array.isArray(parsed) ? parsed : parsed.tasks || [parsed],
            };
          
          case 'summarize':
            return {
              summary: typeof parsed === 'string' ? parsed : parsed.summary || rawResponse,
            };
          
          case 'chat':
            return {
              response: typeof parsed === 'string' ? parsed : parsed.response || rawResponse,
            };
          
          default:
            return { raw: parsed };
        }
      }

      // If no JSON found, treat as plain text
      switch (agentType) {
        case 'generate':
        case 'expand':
          // Try to parse line-by-line as suggestions
          const lines = rawResponse.split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'))
            .map((l, i) => ({
              label: l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''),
              type: 'idea',
            }));
          return { suggestions: lines };
        
        case 'to_tasks':
          const taskLines = rawResponse.split('\n')
            .map(l => l.trim())
            .filter(l => l && !l.startsWith('#'))
            .map((l, i) => ({
              title: l.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, ''),
              priority: 'medium',
            }));
          return { suggestions: taskLines };
        
        case 'summarize':
          return { summary: rawResponse };
        
        case 'chat':
          return { response: rawResponse };
        
        default:
          return { raw: rawResponse };
      }
    } catch (error) {
      logger.warn({ error, agentType }, 'Failed to parse AI response as JSON');
      
      // Return raw response on parse failure
      return agentType === 'summarize' 
        ? { summary: rawResponse }
        : agentType === 'chat'
          ? { response: rawResponse }
          : { suggestions: [], raw: rawResponse };
    }
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();
