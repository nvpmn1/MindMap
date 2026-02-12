/**
 * ═══════════════════════════════════════════════════════════════════════════
 * NeuralMap AI Engine — Streaming & SSE System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Implements Claude's streaming protocol with:
 * - Server-Sent Events (SSE) for real-time streaming
 * - Event types: text, thinking, tool_use, progress, error, done
 * - Back-pressure handling
 * - Connection keepalive
 * - Graceful disconnection
 */

import type { Response } from 'express';
import type { AgentType, ModelId, ToolDefinition, ConversationMessage } from '../core/types';
import { ClaudeClient } from '../core/client';
import { AGENT_REGISTRY } from '../core/constants';
import { selectModel, analyzeComplexity } from '../core/models';
import { buildSystemPrompt, buildUserPrompt } from '../prompts/index';
import { getToolsForAgent } from '../tools/definitions';
import { truncateHistory, estimateTokens, calculateContextBudget, conversationMemory } from '../memory';
import { logger } from '../../utils/logger';

// ═══════════════════════════════════════════════════════════════════════════
// SSE EVENT TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SSEEvent {
  event: string;
  data: any;
}

export type StreamEventType =
  | 'stream_start'
  | 'text_delta'
  | 'thinking_delta'
  | 'tool_use_start'
  | 'tool_use_delta'
  | 'tool_result'
  | 'content_block_start'
  | 'content_block_stop'
  | 'progress'
  | 'usage'
  | 'error'
  | 'done';

// ═══════════════════════════════════════════════════════════════════════════
// SSE WRITER
// ═══════════════════════════════════════════════════════════════════════════

export class SSEWriter {
  private res: Response;
  private closed = false;
  private keepaliveInterval: NodeJS.Timeout | null = null;

  constructor(res: Response) {
    this.res = res;
    this.setupSSE();
  }

  /**
   * Configure response headers for SSE
   */
  private setupSSE(): void {
    this.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
    });

    // Send initial keepalive
    this.res.write(':ok\n\n');

    // Setup keepalive ping every 15 seconds
    this.keepaliveInterval = setInterval(() => {
      if (!this.closed) {
        this.res.write(':ping\n\n');
      }
    }, 15000);

    // Handle client disconnect
    this.res.on('close', () => {
      this.close();
    });
  }

  /**
   * Send an SSE event
   */
  send(event: StreamEventType, data: any): void {
    if (this.closed) {return;}

    try {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      this.res.write(`event: ${event}\ndata: ${payload}\n\n`);
    } catch (error) {
      logger.error({ err: error }, 'SSE write error');
      this.close();
    }
  }

  /**
   * Send text delta (most common event)
   */
  sendText(text: string): void {
    this.send('text_delta', { text });
  }

  /**
   * Send thinking delta
   */
  sendThinking(text: string): void {
    this.send('thinking_delta', { thinking: text });
  }

  /**
   * Send tool use event
   */
  sendToolUse(toolName: string, toolId: string, input: any): void {
    this.send('tool_use_start', { tool_name: toolName, tool_id: toolId, input });
  }

  /**
   * Send progress update
   */
  sendProgress(stage: string, percent?: number): void {
    this.send('progress', { stage, percent });
  }

  /**
   * Send error event
   */
  sendError(message: string, code?: string): void {
    this.send('error', { message, code });
  }

  /**
   * Send completion event and close
   */
  sendDone(metadata?: Record<string, any>): void {
    this.send('done', { completed: true, ...metadata });
    this.close();
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    if (this.closed) {return;}
    this.closed = true;

    if (this.keepaliveInterval) {
      clearInterval(this.keepaliveInterval);
      this.keepaliveInterval = null;
    }

    try {
      this.res.end();
    } catch {
      // Already closed
    }
  }

  get isClosed(): boolean {
    return this.closed;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STREAMING AGENT EXECUTOR
// ═══════════════════════════════════════════════════════════════════════════

export interface StreamOptions {
  agentType: AgentType;
  input: Record<string, any>;
  mapId: string;
  userId: string;
  sessionId?: string;
  modelOverride?: ModelId;
  res: Response;
}

/**
 * Execute an agent with streaming response
 */
export async function executeWithStreaming(
  client: ClaudeClient,
  options: StreamOptions,
): Promise<void> {
  const { agentType, input, mapId, userId, sessionId, modelOverride, res } = options;
  const writer = new SSEWriter(res);
  const startTime = Date.now();

  try {
    // 1) Send start event
    writer.send('stream_start', { agent: agentType, timestamp: new Date().toISOString() });
    writer.sendProgress('Inicializando agente...', 0);

    // 2) Analyze and select model — ALWAYS Haiku
    const complexity = analyzeComplexity(agentType, input);
    const selection = selectModel(agentType, input);
    // FIXED: Force Haiku regardless of selection
    const model = 'claude-haiku-4-5' as any;

    // Send model_selected event (frontend expects this)
    writer.send('model_selected' as any, {
      model: 'Claude Haiku 4.5',
      reason: 'Claude Haiku 4.5 — modelo fixo para máxima economia e velocidade',
      complexity: complexity.level,
    });

    // 3) Build system prompt and tools
    const config = AGENT_REGISTRY[agentType] || AGENT_REGISTRY.chat;
    const systemPrompt = buildSystemPrompt(agentType, {
      enableCaching: true,
      enableChainOfThought: true,
    });
    const system = typeof systemPrompt === 'string'
      ? systemPrompt
      : (systemPrompt as any[]).map((s: any) => s.text).join('\n\n');

    const tools = getToolsForAgent(config.requiredTools, config.optionalTools);
    const toolChoice = getToolChoice(agentType, tools);

    // 4) Build messages with context management
    const userPrompt = buildUserPrompt(agentType, input, input.options || {});
    const messages: ConversationMessage[] = [];

    // Add history for chat
    if (input.conversation_history) {
      const budget = calculateContextBudget(model, system, tools, config.maxTokens);
      const userTokens = estimateTokens(userPrompt);
      const available = budget.availableForContent - userTokens;
      if (available > 0) {
        const truncated = truncateHistory(input.conversation_history, available);
        messages.push(...truncated.messages);
      }
    }

    messages.push({ role: 'user', content: userPrompt });
    
    // Send thinking_start event (frontend expects this)
    writer.send('thinking_start' as any, { message: 'Analisando e gerando resposta...' });

    // 5) Stream from Claude
    const stream = client.createStream({
      model,
      system,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      tool_choice: toolChoice,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.7,
    });

    let fullText = '';
    let fullThinking = '';
    const toolCalls: any[] = [];
    let inputTokens = 0;
    let outputTokens = 0;
    let textStarted = false;
    let currentToolId: string | null = null;
    let currentToolName: string | null = null;
    let currentToolJson = '';

    // 6) Process stream events
    for await (const event of stream) {
      if (writer.isClosed) {break;}

      switch (event.type) {
        case 'content_block_start': {
          if (event.content_block?.type === 'tool_use') {
            currentToolId = event.content_block.id;
            currentToolName = event.content_block.name;
            currentToolJson = '';
            // Send tool_start event (frontend expects this name)
            writer.send('tool_start' as any, {
              name: event.content_block.name,
              id: event.content_block.id,
            });
          }
          break;
        }

        case 'content_block_delta': {
          const delta = event.delta;
          if (delta?.type === 'text_delta' && delta.text) {
            // Send text_start on first text delta (frontend expects this)
            if (!textStarted) {
              writer.send('text_start' as any, {});
              textStarted = true;
            }
            fullText += delta.text;
            // Frontend expects {text, accumulated} in text_delta
            writer.send('text_delta' as any, { text: delta.text, accumulated: fullText });
          } else if ((delta as any)?.type === 'thinking_delta' && (delta as any).thinking) {
            fullThinking += (delta as any).thinking;
            writer.sendThinking((delta as any).thinking);
          } else if (delta?.type === 'input_json_delta' && delta.partial_json) {
            currentToolJson += delta.partial_json;
            writer.send('tool_use_delta' as any, { partial_json: delta.partial_json });
          }
          break;
        }

        case 'content_block_stop': {
          if (currentToolName) {
            let parsedInput: any = {};
            if (currentToolJson.trim().length > 0) {
              try {
                parsedInput = JSON.parse(currentToolJson);
              } catch {
                parsedInput = { _raw: currentToolJson };
              }
            }

            toolCalls.push({
              name: currentToolName,
              id: currentToolId,
              input: parsedInput,
            });

            writer.send('tool_complete' as any, {
              name: currentToolName,
              input: parsedInput,
            });

            currentToolId = null;
            currentToolName = null;
            currentToolJson = '';
          }
          break;
        }

        case 'message_delta': {
          if (event.usage) {
            outputTokens = event.usage.output_tokens || 0;
          }
          break;
        }

        case 'message_start': {
          if (event.message?.usage) {
            inputTokens = event.message.usage.input_tokens || 0;
          }
          break;
        }

        case 'message_stop': {
          break;
        }

        default: {
          if ((event as any).type === 'error') {
            writer.send('error' as any, { error: (event as any).error?.message || 'Erro no stream' });
          }
          break;
        }
      }
    }

    // Send text_complete event (frontend expects this)
    if (fullText) {
      writer.send('text_complete' as any, { text: fullText });
    }

    // 7) Send 'complete' event (frontend expects this instead of 'usage')
    const executionTimeMs = Date.now() - startTime;
    writer.send('complete' as any, {
      content: fullText,
      model,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      },
      execution_time_ms: executionTimeMs,
    });

    // 8) Update memory for chat
    if (agentType === 'chat' && sessionId) {
      conversationMemory.add(sessionId, mapId, [
        { role: 'user', content: input.message || userPrompt },
        { role: 'assistant', content: fullText },
      ]);
    }

    // 9) Send done
    writer.sendDone({
      agent: agentType,
      model,
      execution_time_ms: executionTimeMs,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
    });

  } catch (error: any) {
    logger.error({ err: error }, `Streaming agent ${agentType} failed`);
    // Frontend expects { error: string } format 
    writer.send('error' as any, { error: error.message || 'Erro interno do servidor' });
    writer.sendDone({ error: true });
  }
}

function getToolChoice(agentType: AgentType, tools: ToolDefinition[]): { type: 'auto' } | { type: 'any' } {
  if (!tools.length) {
    return { type: 'auto' };
  }

  const forceToolAgents: AgentType[] = [
    'generate',
    'expand',
    'organize',
    'connect',
    'visualize',
    'task_convert',
    'research',
    'hypothesize',
  ];

  return forceToolAgents.includes(agentType) ? { type: 'any' } : { type: 'auto' };
}
