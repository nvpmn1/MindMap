import Anthropic from '@anthropic-ai/sdk';
import { env } from '../utils/env';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../services/supabase';
import { generatePrompt, expandPrompt, summarizePrompt, toTasksPrompt, chatPrompt } from './prompts';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: env.CLAUDE_API_KEY,
});

// ─── Auto Model Selection System ─────────────────────────────────────────────

/**
 * Available Claude models with characteristics
 * Latest models as of February 2026
 * Ordered from cheapest to most powerful
 */
export const AVAILABLE_MODELS = {
  haiku: {
    id: 'claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    costPer1kTokens: 0.001,
    tier: 'lightweight',
    maxContextTokens: 200000,
    bestFor: ['quick_answers', 'simple_analysis', 'chat', 'real-time_tasks'],
    description: 'Rápido e econômico - ideal para tarefas simples e tempo real',
  },
  sonnet45: {
    id: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    costPer1kTokens: 0.003,
    tier: 'balanced',
    maxContextTokens: 200000,
    bestFor: ['analysis', 'writing', 'code_generation', 'creative_tasks', 'reasoning'],
    description: 'Balanceado e inteligente - padrão para maioria das tarefas',
  },
  opus46: {
    id: 'claude-opus-4-6',
    name: 'Claude Opus 4.6',
    costPer1kTokens: 0.005,
    tier: 'advanced',
    maxContextTokens: 200000,
    bestFor: ['complex_analysis', 'research', 'advanced_coding', 'deep_reasoning', 'enterprise_tasks'],
    description: 'Mais poderoso e inteligente - para tarefas muito complexas e críticas',
  },
};

/**
 * Complexity analyzer - detects task complexity from input
 */
function analyzeComplexity(
  agentType: AIAgentType,
  input: Record<string, any>,
  contextLength: number = 0
): {
  level: 'simple' | 'moderate' | 'complex';
  score: number;
  reasoning: string;
} {
  let score = 0;
  let reasoning = '';

  // Agent type base score
  const agentTypeScores: Record<AIAgentType, number> = {
    chat: 2,           // Simple conversation
    summarize: 3,      // Moderate - needs understanding
    generate: 4,       // Moderate - needs creativity
    expand: 5,         // Complex - needs deep understanding
    to_tasks: 4,       // Moderate - structured output
  };

  score += agentTypeScores[agentType] || 3;

  // Context length scoring (more context = more complex)
  if (contextLength > 10000) score += 3;
  else if (contextLength > 5000) score += 2;
  else if (contextLength > 1000) score += 1;

  // Input content analysis
  const inputStr = JSON.stringify(input).toLowerCase();

  // Keywords indicating complexity
  const complexKeywords = {
    code: 2,
    algorithm: 3,
    architecture: 3,
    research: 2,
    analysis: 2,
    deep: 2,
    complex: 3,
    optimize: 2,
    security: 2,
    performance: 2,
  };

  Object.entries(complexKeywords).forEach(([keyword, points]) => {
    if (inputStr.includes(keyword)) score += points;
  });

  // Simple keywords (reduce score)
  const simpleKeywords = ['hello', 'hi', 'quick', 'simple', 'fast', 'easy', 'brief'];
  simpleKeywords.forEach(keyword => {
    if (inputStr.includes(keyword)) score = Math.max(1, score - 1);
  });

  // Determine level
  let level: 'simple' | 'moderate' | 'complex';
  if (score <= 3) {
    level = 'simple';
    reasoning = 'Tarefa simples - perguntas diretas, respostas rápidas';
  } else if (score <= 7) {
    level = 'moderate';
    reasoning = 'Tarefa moderada - análise e criatividade balanceadas';
  } else {
    level = 'complex';
    reasoning = 'Tarefa complexa - análise profunda, raciocínio avançado';
  }

  return { level, score, reasoning };
}

/**
 * Auto select best model based on complexity and cost efficiency
 */
export function autoSelectModel(
  agentType: AIAgentType,
  input: Record<string, any>,
  contextLength: number = 0
): {
  modelId: string;
  modelName: string;
  reason: string;
  complexityLevel: string;
} {
  const complexity = analyzeComplexity(agentType, input, contextLength);

  let selectedModel = AVAILABLE_MODELS.sonnet45; // Default balanced choice
  let reason = '';

  if (complexity.level === 'simple') {
    selectedModel = AVAILABLE_MODELS.haiku;
    reason = `Modelo Haiku selecionado - tarefa simples, economiza ${((AVAILABLE_MODELS.sonnet45.costPer1kTokens / AVAILABLE_MODELS.haiku.costPer1kTokens).toFixed(0))}x no custo`;
  } else if (complexity.level === 'complex') {
    selectedModel = AVAILABLE_MODELS.opus46;
    reason = 'Modelo Opus 4.6 selecionado - tarefa complexa requer raciocínio avançado';
  } else {
    reason = 'Modelo Sonnet 4.5 selecionado - balanceado para maioria das tarefas';
  }

  logger.debug({
    complexityScore: complexity.score,
    complexityLevel: complexity.level,
    selectedModel: selectedModel.id,
    costSavings: complexity.level === 'simple'
      ? `${((AVAILABLE_MODELS.sonnet45.costPer1kTokens / AVAILABLE_MODELS.haiku.costPer1kTokens).toFixed(1))}x cheaper`
      : 'baseline',
  }, 'Auto model selection');

  return {
    modelId: selectedModel.id,
    modelName: selectedModel.name,
    reason,
    complexityLevel: complexity.level,
  };
}

// Agent types
export type AIAgentType = 'generate' | 'expand' | 'summarize' | 'to_tasks' | 'chat';

// Raw Agent call params (tool-use mode)
interface AgentRawParams {
  model: string;
  systemPrompt: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  tools: Array<{ name: string; description: string; input_schema: any }>;
  maxTokens: number;
  temperature: number;
}

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

  // ─── Agent Raw: Direct Claude Tool-Use Call ─────────────────────────────

  /**
   * Call Claude API directly with tool-use support (Agent Mode)
   * This is the REAL Claude API call with tools
   */
  async callAgentRaw(params: AgentRawParams): Promise<any> {
    let { model, systemPrompt, messages, tools, maxTokens, temperature } = params;

    // Auto-select model based on complexity
    let selectedModel = model;
    let modelSelection: any = null;

    if (model === 'auto' || !model) {
      const inputContent = `${systemPrompt}\n${messages.map(m => m.content).join('\n')}`;
      const contextLength = inputContent.length;
      
      modelSelection = autoSelectModel('chat', { 
        systemPrompt, 
        messageCount: messages.length,
        toolCount: tools.length,
        inputLength: contextLength
      }, contextLength);
      
      selectedModel = modelSelection.modelId;
    }

    logger.info({
      requestedModel: model,
      selectedModel,
      autoSelected: !!modelSelection,
      modelName: modelSelection?.modelName,
      reason: modelSelection?.reason,
      messageCount: messages.length,
      toolCount: tools.length,
      maxTokens,
    }, 'callAgentRaw: Calling Claude API with tool-use');

    // Build Anthropic API request
    const anthropicMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Convert tool definitions to Anthropic format
    const anthropicTools = tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));

    try {
      const response = await anthropic.messages.create({
        model: selectedModel,
        max_tokens: maxTokens || this.maxTokens,
        temperature: temperature ?? 0.7,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: anthropicTools as any,
      });

      logger.info({
        model: response.model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        stopReason: response.stop_reason,
        contentBlocks: response.content.length,
        autoSelected: !!modelSelection,
      }, 'callAgentRaw: Claude API response received');

      return response;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error({ error: errMsg, model: selectedModel }, 'callAgentRaw: Claude API call failed');
      throw error;
    }
  }

  // ─── Agent Streaming: SSE Stream for real-time thinking ─────────────────

  /**
   * Stream Claude API response via SSE for real-time Agent Mode experience
   * Shows thinking, TODO list, and tool calls in real-time
   */
  async streamAgentRaw(
    params: AgentRawParams,
    onEvent: (event: string, data: any) => void,
  ): Promise<void> {
    let { model, systemPrompt, messages, tools, maxTokens, temperature } = params;

    // Auto-select model based on complexity
    let selectedModel = model;
    let modelSelection: any = null;

    if (model === 'auto' || !model) {
      const inputContent = `${systemPrompt}\n${messages.map(m => m.content).join('\n')}`;
      const contextLength = inputContent.length;
      
      modelSelection = autoSelectModel('chat', { 
        systemPrompt, 
        messageCount: messages.length,
        toolCount: tools.length,
        inputLength: contextLength
      }, contextLength);
      
      selectedModel = modelSelection.modelId;

      // Inform user about model selection
      onEvent('model_selected', {
        model: modelSelection.modelName,
        reason: modelSelection.reason,
        complexity: modelSelection.complexityLevel,
      });
    }

    logger.info({
      requestedModel: model,
      selectedModel,
      autoSelected: !!modelSelection,
      modelName: modelSelection?.modelName,
      reason: modelSelection?.reason,
      messageCount: messages.length,
      toolCount: tools.length,
    }, 'streamAgentRaw: Starting Claude streaming');

    const anthropicMessages = messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const anthropicTools = tools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));

    try {
      // Emit thinking start
      onEvent('thinking_start', { message: 'Analisando contexto e planejando ações...' });

      const stream = anthropic.messages.stream({
        model: selectedModel,
        max_tokens: maxTokens || this.maxTokens,
        temperature: temperature ?? 0.7,
        system: systemPrompt,
        messages: anthropicMessages,
        tools: anthropicTools as any,
      });

      let currentBlockType: string | null = null;
      let currentBlockIndex = -1;
      let currentToolName = '';
      let textAccumulator = '';

      // Use the SDK's built-in high-level events
      stream.on('text', (textDelta: string, textSnapshot: string) => {
        textAccumulator = textSnapshot;
        onEvent('text_delta', { text: textDelta, accumulated: textSnapshot });
      });

      stream.on('inputJson', (partialJson: string, _jsonSnapshot: unknown) => {
        onEvent('tool_input_delta', {
          name: currentToolName,
          partialJson,
        });
      });

      stream.on('contentBlock', (block: any) => {
        if (block.type === 'tool_use') {
          onEvent('tool_complete', {
            name: block.name,
            input: block.input,
          });
          currentToolName = '';
        } else if (block.type === 'text') {
          onEvent('text_complete', { text: block.text });
        }
      });

      // Use streamEvent for lower-level block start detection
      stream.on('streamEvent', (event: any) => {
        if (event.type === 'content_block_start') {
          currentBlockIndex++;
          if (event.content_block?.type === 'text') {
            currentBlockType = 'text';
            onEvent('text_start', { index: currentBlockIndex });
          } else if (event.content_block?.type === 'tool_use') {
            currentBlockType = 'tool_use';
            currentToolName = event.content_block.name;
            onEvent('tool_start', {
              index: currentBlockIndex,
              name: currentToolName,
              id: event.content_block.id,
            });
          }
        }
      });

      // Wait for stream to complete
      const finalMessage = await stream.finalMessage();

      onEvent('complete', {
        content: finalMessage.content,
        model: finalMessage.model,
        usage: finalMessage.usage,
        stop_reason: finalMessage.stop_reason,
      });

      logger.info({
        model: finalMessage.model,
        inputTokens: finalMessage.usage.input_tokens,
        outputTokens: finalMessage.usage.output_tokens,
        stopReason: finalMessage.stop_reason,
      }, 'streamAgentRaw: Stream completed');

    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error({ error: errMsg, model }, 'streamAgentRaw: Stream failed');
      onEvent('error', { error: errMsg });
      throw error;
    }
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();
