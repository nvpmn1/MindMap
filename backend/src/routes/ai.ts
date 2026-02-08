import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, asyncHandler } from '../middleware';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { supabaseAdmin } from '../services/supabase';

// ═══ New NeuralMap AI Engine ═══
import { getOrchestrator } from '../ai/orchestrator/index';
import { aiMiddleware } from '../ai/middleware';
import { getAvailableAgents, getAgentInfo } from '../ai/agents';
import { conversationMemory } from '../ai/memory';
import type { AgentType, ConversationMessage } from '../ai/core/types';
import { AGENT_REGISTRY } from '../ai/core/constants';

// Legacy import for backward compatibility with /agent endpoint
import { aiOrchestrator, AIAgentType } from '../ai/orchestrator.legacy';

const router = Router();

// Validation schemas
const generateSchema = z.object({
  map_id: z.string().uuid('Invalid map ID'),
  prompt: z.string().min(1, 'Prompt required').max(2000, 'Prompt too long'),
  parent_node_id: z.string().uuid().nullable().optional(),
  context: z.object({
    existing_nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.string(),
      content: z.string().nullable().optional(),
    })).optional(),
    map_title: z.string().optional(),
    map_description: z.string().nullable().optional(),
  }).optional(),
  options: z.object({
    count: z.number().min(1).max(20).optional().default(5),
    depth: z.number().min(1).max(3).optional().default(1),
    style: z.enum(['brainstorm', 'structured', 'detailed']).optional().default('brainstorm'),
  }).optional(),
});

const expandSchema = z.object({
  map_id: z.string().uuid('Invalid map ID'),
  node_id: z.string().uuid('Invalid node ID'),
  context: z.object({
    node: z.object({
      id: z.string(),
      label: z.string(),
      type: z.string(),
      content: z.string().nullable().optional(),
    }),
    parent: z.object({
      id: z.string(),
      label: z.string(),
    }).nullable().optional(),
    siblings: z.array(z.object({
      id: z.string(),
      label: z.string(),
    })).optional(),
    map_title: z.string().optional(),
  }),
  options: z.object({
    count: z.number().min(1).max(10).optional().default(4),
    direction: z.enum(['deeper', 'related', 'both']).optional().default('deeper'),
  }).optional(),
});

const summarizeSchema = z.object({
  map_id: z.string().uuid('Invalid map ID'),
  node_ids: z.array(z.string().uuid()).min(1).max(50).optional(),
  context: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.string(),
      content: z.string().nullable().optional(),
      children: z.array(z.string()).optional(),
    })),
    map_title: z.string().optional(),
  }),
  options: z.object({
    format: z.enum(['paragraph', 'bullets', 'executive']).optional().default('paragraph'),
    length: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  }).optional(),
});

const toTasksSchema = z.object({
  map_id: z.string().uuid('Invalid map ID'),
  node_ids: z.array(z.string().uuid()).min(1).max(20),
  context: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.string(),
      content: z.string().nullable().optional(),
    })),
    team_members: z.array(z.object({
      id: z.string(),
      name: z.string(),
    })).optional(),
  }),
  options: z.object({
    include_subtasks: z.boolean().optional().default(true),
    estimate_priority: z.boolean().optional().default(true),
    suggest_assignees: z.boolean().optional().default(false),
  }).optional(),
});

const chatSchema = z.object({
  map_id: z.string().uuid('Invalid map ID'),
  message: z.string().min(1, 'Message required').max(2000, 'Message too long'),
  context: z.object({
    nodes: z.array(z.object({
      id: z.string(),
      label: z.string(),
      type: z.string(),
      content: z.string().nullable().optional(),
    })).optional(),
    selected_node_id: z.string().uuid().nullable().optional(),
    map_title: z.string().optional(),
    conversation_history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).max(10).optional(),
  }).optional(),
});

/**
 * POST /api/ai/generate
 * Generate new ideas/nodes from a prompt — Uses new NeuralOrchestrator
 */
router.post(
  '/generate',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = generateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { map_id, prompt, parent_node_id, context, options } = parsed.data;

    logger.info({ mapId: map_id, userId: req.user!.id, prompt: prompt.substring(0, 100) }, 'AI generate request');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'generate',
      prompt,
      mapId: map_id,
      userId: req.user!.id,
      existing_nodes: context?.existing_nodes,
      map_title: context?.map_title,
      map_description: context?.map_description,
      options: { ...options, parent_node_id },
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/ai/expand
 * Expand a specific node with sub-ideas — Uses new NeuralOrchestrator
 */
router.post(
  '/expand',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = expandSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { map_id, node_id, context, options } = parsed.data;

    logger.info({ mapId: map_id, nodeId: node_id, userId: req.user!.id }, 'AI expand request');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'expand',
      mapId: map_id,
      userId: req.user!.id,
      node: context.node,
      parent: context.parent,
      siblings: context.siblings,
      map_title: context.map_title,
      options: { ...options, node_id },
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/ai/summarize
 * Summarize selected nodes or entire map — Uses new NeuralOrchestrator
 */
router.post(
  '/summarize',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = summarizeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { map_id, node_ids, context, options } = parsed.data;

    logger.info({ mapId: map_id, nodeCount: node_ids?.length || context.nodes.length, userId: req.user!.id }, 'AI summarize request');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'summarize',
      mapId: map_id,
      userId: req.user!.id,
      nodes: context.nodes,
      map_title: context.map_title,
      options: { ...options, node_ids },
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/ai/to-tasks
 * Convert nodes to actionable tasks — Uses new NeuralOrchestrator
 */
router.post(
  '/to-tasks',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = toTasksSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { map_id, node_ids, context, options } = parsed.data;

    logger.info({ mapId: map_id, nodeIds: node_ids, userId: req.user!.id }, 'AI to-tasks request');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'task_convert',
      mapId: map_id,
      userId: req.user!.id,
      nodes: context.nodes,
      options: { ...options, node_ids, team_members: context.team_members },
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/ai/chat
 * Chat with AI about the map — Uses new NeuralOrchestrator
 */
router.post(
  '/chat',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { map_id, message, context } = parsed.data;

    logger.info({ mapId: map_id, userId: req.user!.id, message: message.substring(0, 100) }, 'AI chat request');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'chat',
      message,
      mapId: map_id,
      userId: req.user!.id,
      sessionId: req.user!.id, // Use userId as sessionId for simplicity
      nodes: context?.nodes,
      map_title: context?.map_title,
      conversation_history: context?.conversation_history as ConversationMessage[] | undefined,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/ai/history/:mapId
 * Get AI run history for a map
 */
router.get(
  '/history/:mapId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { mapId } = req.params;
    const { limit = '20', offset = '0' } = req.query;

    const { data: runs, error, count } = await req.supabase!
      .from('ai_runs')
      .select(`
        *,
        user:profiles!ai_runs_user_id_fkey (
          id,
          display_name,
          avatar_url,
          color
        )
      `, { count: 'exact' })
      .eq('map_id', mapId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      throw new Error('Failed to fetch AI history');
    }

    res.json({
      success: true,
      data: runs,
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: (count || 0) > Number(offset) + Number(limit),
      },
    });
  })
);

/**
 * GET /api/ai/run/:runId
 * Get specific AI run details
 */
router.get(
  '/run/:runId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { runId } = req.params;

    const { data: run, error } = await req.supabase!
      .from('ai_runs')
      .select(`
        *,
        user:profiles!ai_runs_user_id_fkey (
          id,
          display_name,
          avatar_url,
          color
        )
      `)
      .eq('id', runId)
      .single();

    if (error || !run) {
      throw new ValidationError('AI run not found');
    }

    res.json({
      success: true,
      data: run,
    });
  })
);

/**
 * POST /api/ai/apply/:runId
 * Apply AI suggestions to the map
 */
router.post(
  '/apply/:runId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { runId } = req.params;
    const { selected_items } = req.body; // Array of indices to apply

    // Get the AI run
    const { data: run, error } = await req.supabase!
      .from('ai_runs')
      .select('*')
      .eq('id', runId)
      .eq('status', 'completed')
      .single();

    if (error || !run) {
      throw new ValidationError('AI run not found or not completed');
    }

    const result = run.output_result as any;
    if (!result || !result.suggestions) {
      throw new ValidationError('No suggestions to apply');
    }

    // Filter suggestions if specific items selected
    let suggestions = result.suggestions;
    if (selected_items && Array.isArray(selected_items)) {
      suggestions = suggestions.filter((_: any, i: number) => selected_items.includes(i));
    }

    // Apply based on agent type
    const applied: any[] = [];

    if (run.agent_type === 'generate' || run.agent_type === 'expand') {
      // Create nodes
      for (const suggestion of suggestions) {
        const { data: node } = await req.supabase!
          .from('nodes')
          .insert({
            map_id: run.map_id,
            parent_id: suggestion.parent_id || null,
            type: suggestion.type || 'idea',
            label: suggestion.label,
            content: suggestion.content || null,
            position_x: suggestion.position_x || 0,
            position_y: suggestion.position_y || 0,
            created_by: req.user!.id,
          })
          .select()
          .single();

        if (node) {
          applied.push(node);

          // Create edge if parent specified
          if (suggestion.parent_id) {
            await req.supabase!.from('edges').insert({
              map_id: run.map_id,
              source_id: suggestion.parent_id,
              target_id: node.id,
              type: 'default',
            });
          }
        }
      }
    } else if (run.agent_type === 'to_tasks') {
      // Create tasks
      for (const suggestion of suggestions) {
        const { data: task } = await req.supabase!
          .from('tasks')
          .insert({
            node_id: suggestion.node_id,
            title: suggestion.title,
            description: suggestion.description || null,
            status: 'todo',
            priority: suggestion.priority || 'medium',
            tags: suggestion.tags || [],
            created_by: req.user!.id,
          })
          .select()
          .single();

        if (task) {
          applied.push(task);
        }
      }
    }

    logger.info({ runId, appliedCount: applied.length, userId: req.user!.id }, 'AI suggestions applied');

    res.json({
      success: true,
      data: {
        applied,
        count: applied.length,
      },
    });
  })
);

/**
 * GET /api/ai/usage
 * Get AI usage stats for current user
 */
router.get(
  '/usage',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const { data: runs } = await req.supabase!
      .from('ai_runs')
      .select('agent_type, tokens_input, tokens_output, duration_ms, status, created_at')
      .eq('user_id', req.user!.id)
      .gte('created_at', startDate.toISOString());

    if (!runs) {
      return res.json({
        success: true,
        data: {
          totalRuns: 0,
          totalTokens: 0,
          byAgentType: {},
          avgDuration: 0,
        },
      });
    }

    const stats = {
      totalRuns: runs.length,
      successfulRuns: runs.filter(r => r.status === 'completed').length,
      totalTokensInput: runs.reduce((sum, r) => sum + (r.tokens_input || 0), 0),
      totalTokensOutput: runs.reduce((sum, r) => sum + (r.tokens_output || 0), 0),
      byAgentType: {} as Record<string, number>,
      avgDuration: 0,
    };

    let totalDuration = 0;
    for (const run of runs) {
      stats.byAgentType[run.agent_type] = (stats.byAgentType[run.agent_type] || 0) + 1;
      if (run.duration_ms) totalDuration += run.duration_ms;
    }

    stats.avgDuration = runs.length > 0 ? Math.round(totalDuration / runs.length) : 0;

    res.json({
      success: true,
      data: stats,
    });
  })
);

// ─────────────────────────────────────────────────────────────────────────
// POST /agent — Claude Tool-Use Agent Mode (Real Claude API)
// ─────────────────────────────────────────────────────────────────────────

const agentSchema = z.object({
  model: z.string().optional(),
  mode: z.string().optional().default('agent'),
  systemPrompt: z.string().min(1),
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })),
  tools: z.array(z.object({
    name: z.string(),
    description: z.string(),
    input_schema: z.any(),
  })),
  maxTokens: z.number().optional().default(4096),
  temperature: z.number().optional().default(0.7),
});

router.post(
  '/agent',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = agentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const { model, mode, systemPrompt, messages, tools, maxTokens, temperature } = parsed.data;
    const startTime = Date.now();

    // Use auto-selection by default for best cost efficiency
    // Auto intelligently chooses: Haiku (simple) → Sonnet 3.5 (balanced) → Opus (complex)
    const selectedModel = model || 'auto';

    logger.info({
      mode,
      model: selectedModel,
      messageCount: messages.length,
      toolCount: tools.length,
      userId: req.user?.id,
    }, 'AI Agent request received');

    try {
      // Call Claude with tool-use support via the REAL callAgentRaw method
      const response = await aiOrchestrator.callAgentRaw({
        model: selectedModel,
        systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.input_schema,
        })),
        maxTokens,
        temperature,
      });

      const durationMs = Date.now() - startTime;

      logger.info({
        model: selectedModel,
        durationMs,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        stopReason: response.stop_reason,
        userId: req.user?.id,
      }, 'AI Agent response completed');

      // Return Claude response in structured format
      res.json({
        success: true,
        data: {
          content: response.content,
          stop_reason: response.stop_reason,
          model: response.model,
          usage: response.usage,
        },
        content: response.content,
        stop_reason: response.stop_reason,
        model: response.model,
        usage: response.usage,
        durationMs,
      });
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        model: selectedModel,
        error: errorMessage,
        durationMs,
        userId: req.user?.id,
      }, 'AI Agent error');

      // Detect rate limit
      if (errorMessage.includes('rate_limit') || errorMessage.includes('429')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Aguarde um momento.',
          retryAfter: 30,
        });
      }

      // Detect invalid API key
      if (errorMessage.includes('authentication') || errorMessage.includes('401') || errorMessage.includes('api_key')) {
        return res.status(401).json({
          success: false,
          error: 'API key inválida. Configure CLAUDE_API_KEY no backend.',
        });
      }

      res.status(500).json({
        success: false,
        error: `Agent error: ${errorMessage}`,
      });
    }
  })
);

// ─────────────────────────────────────────────────────────────────────────
// POST /agent/stream — Real-time Streaming Agent Mode (SSE)
// ─────────────────────────────────────────────────────────────────────────

router.post(
  '/agent/stream',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = agentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors.map(e => e.message).join(', '));
    }

    const { model, mode, systemPrompt, messages, tools, maxTokens, temperature } = parsed.data;
    const selectedModel = model || 'auto';

    logger.info({
      mode,
      model: selectedModel,
      messageCount: messages.length,
      userId: req.user?.id,
    }, 'AI Agent STREAM request received');

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      await aiOrchestrator.streamAgentRaw(
        {
          model: selectedModel,
          systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          tools: tools.map(t => ({ name: t.name, description: t.description, input_schema: t.input_schema })),
          maxTokens,
          temperature,
        },
        sendEvent,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      sendEvent('error', { error: errMsg });
    } finally {
      sendEvent('done', {});
      res.end();
    }
  })
);

// ═══════════════════════════════════════════════════════════════════════════
// NEW NeuralOrchestrator-powered routes
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/ai/neural — Unified agent endpoint
 * Accepts any agent type via request body, auto-detects if not specified
 */
const neuralSchema = z.object({
  map_id: z.string().min(1, 'map_id is required'),
  agent_type: z.string().optional(),
  message: z.string().min(1).max(10000),
  context: z.object({
    nodes: z.array(z.any()).optional(),
    edges: z.array(z.any()).optional(),
    selected_node: z.any().optional(),
    map_title: z.string().optional(),
    map_description: z.string().nullable().optional(),
    conversation_history: z.array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })).max(50).optional(),
  }).optional(),
  options: z.record(z.any()).optional(),
  model: z.string().optional(),
  stream: z.boolean().optional().default(false),
});

router.post(
  '/neural',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = neuralSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { map_id, agent_type, message, context, options, model, stream } = parsed.data;

    const orchestrator = getOrchestrator();

    // Auto-detect agent type if not specified
    const detectedAgent = agent_type
      ? agent_type as AgentType
      : orchestrator.detectAgentType(message);

    logger.info({
      mapId: map_id,
      agentType: detectedAgent,
      userId: req.user!.id,
      stream,
      message: message.substring(0, 100),
    }, 'Neural agent request');

    const result = await orchestrator.execute({
      agentType: detectedAgent,
      message,
      mapId: map_id,
      userId: req.user!.id,
      sessionId: req.user!.id,
      nodes: context?.nodes,
      edges: context?.edges,
      selected_node: context?.selected_node,
      map_title: context?.map_title,
      map_description: context?.map_description,
      conversation_history: context?.conversation_history as ConversationMessage[] | undefined,
      options: options || {},
      model_override: model as any,
      stream,
      res: stream ? res : undefined,
    });

    // If streaming, response was already sent
    if (!stream && result) {
      res.json({
        success: true,
        data: result,
      });
    }
  })
);

/**
 * POST /api/ai/neural/stream — Streaming version of neural endpoint
 */
router.post(
  '/neural/stream',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = neuralSchema.safeParse({ ...req.body, stream: true });
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { map_id, agent_type, message, context, options, model } = parsed.data;

    const orchestrator = getOrchestrator();
    const detectedAgent = agent_type
      ? agent_type as AgentType
      : orchestrator.detectAgentType(message);

    logger.info({
      mapId: map_id,
      agentType: detectedAgent,
      userId: req.user!.id,
    }, 'Neural stream request');

    await orchestrator.execute({
      agentType: detectedAgent,
      message,
      mapId: map_id,
      userId: req.user!.id,
      sessionId: req.user!.id,
      nodes: context?.nodes,
      edges: context?.edges,
      selected_node: context?.selected_node,
      map_title: context?.map_title,
      map_description: context?.map_description,
      conversation_history: context?.conversation_history as ConversationMessage[] | undefined,
      options: options || {},
      model_override: model as any,
      stream: true,
      res,
    });
  })
);

/**
 * POST /api/ai/analyze — Deep analysis of the map
 */
router.post(
  '/analyze',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { map_id, nodes, edges, map_title, analysis_type } = req.body;

    if (!map_id) throw new ValidationError('map_id is required');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'analyze',
      mapId: map_id,
      userId: req.user!.id,
      nodes,
      edges,
      map_title,
      options: { analysis_type },
    });

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/ai/organize — Reorganize map structure
 */
router.post(
  '/organize',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { map_id, nodes, edges, map_title, strategy } = req.body;

    if (!map_id) throw new ValidationError('map_id is required');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'organize',
      mapId: map_id,
      userId: req.user!.id,
      nodes,
      edges,
      map_title,
      options: { strategy },
    });

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/ai/research — Web research and enrichment
 */
router.post(
  '/research',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { map_id, topic, message, nodes, map_title } = req.body;

    if (!map_id) throw new ValidationError('map_id is required');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'research',
      message: topic || message,
      mapId: map_id,
      userId: req.user!.id,
      nodes,
      map_title,
    });

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/ai/hypothesize — Generate hypotheses and scenarios
 */
router.post(
  '/hypothesize',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { map_id, message, nodes, map_title } = req.body;

    if (!map_id) throw new ValidationError('map_id is required');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'hypothesize',
      message,
      mapId: map_id,
      userId: req.user!.id,
      nodes,
      map_title,
    });

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/ai/critique — Critical analysis
 */
router.post(
  '/critique',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { map_id, nodes, edges, map_title } = req.body;

    if (!map_id) throw new ValidationError('map_id is required');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'critique',
      mapId: map_id,
      userId: req.user!.id,
      nodes,
      edges,
      map_title,
    });

    res.json({ success: true, data: result });
  })
);

/**
 * POST /api/ai/connect — Discover hidden connections
 */
router.post(
  '/connect',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { map_id, nodes, edges, map_title } = req.body;

    if (!map_id) throw new ValidationError('map_id is required');

    const orchestrator = getOrchestrator();
    const result = await orchestrator.execute({
      agentType: 'connect',
      mapId: map_id,
      userId: req.user!.id,
      nodes,
      edges,
      map_title,
    });

    res.json({ success: true, data: result });
  })
);

/**
 * GET /api/ai/agents — List all available agents with their configs
 */
router.get(
  '/agents',
  authenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    const agents = getAvailableAgents().map(name => ({
      name,
      ...getAgentInfo(name),
    }));

    res.json({
      success: true,
      data: agents,
    });
  })
);

/**
 * GET /api/ai/session/stats — Get AI session statistics
 */
router.get(
  '/session/stats',
  authenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    const orchestrator = getOrchestrator();
    const stats = orchestrator.getSessionStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * DELETE /api/ai/session/memory — Clear conversation memory
 */
router.delete(
  '/session/memory',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { map_id } = req.query;
    const orchestrator = getOrchestrator();
    orchestrator.clearSession(req.user!.id, map_id as string);

    res.json({ success: true, message: 'Memory cleared' });
  })
);

export default router;
