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
    if (this.closed) return;

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
    if (this.closed) return;
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

    // 2) Analyze and select model
    const complexity = analyzeComplexity(agentType, input);
    const selection = selectModel(agentType, input);
    const model = modelOverride || selection.modelId;
    writer.sendProgress('Preparando contexto...', 10);

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
    writer.sendProgress('Gerando resposta...', 20);

    // 5) Stream from Claude
    const stream = client.createStream({
      model,
      system,
      messages,
      tools: tools.length > 0 ? tools : undefined,
      max_tokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.7,
    });

    let fullText = '';
    let fullThinking = '';
    const toolCalls: any[] = [];
    let inputTokens = 0;
    let outputTokens = 0;

    // 6) Process stream events
    for await (const event of stream) {
      if (writer.isClosed) break;

      switch (event.type) {
        case 'content_block_start': {
          if (event.content_block?.type === 'tool_use') {
            writer.sendToolUse(
              event.content_block.name,
              event.content_block.id,
              {},
            );
          }
          break;
        }

        case 'content_block_delta': {
          const delta = event.delta;
          if (delta?.type === 'text_delta' && delta.text) {
            fullText += delta.text;
            writer.sendText(delta.text);
          } else if ((delta as any)?.type === 'thinking_delta' && (delta as any).thinking) {
            fullThinking += (delta as any).thinking;
            writer.sendThinking((delta as any).thinking);
          } else if (delta?.type === 'input_json_delta' && delta.partial_json) {
            writer.send('tool_use_delta', { partial_json: delta.partial_json });
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

        case 'content_block_stop': {
          break;
        }

        case 'message_stop': {
          break;
        }

        default: {
          // Handle 'error' and other event types
          if ((event as any).type === 'error') {
            writer.sendError((event as any).error?.message || 'Erro no stream');
          }
          break;
        }
      }
    }

    // 7) Send usage info
    const executionTimeMs = Date.now() - startTime;
    writer.send('usage', {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      model,
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
    writer.sendError(error.message || 'Erro interno do servidor');
    writer.sendDone({ error: true });
  }
}
