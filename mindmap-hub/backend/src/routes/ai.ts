import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, asyncHandler } from '../middleware';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { aiOrchestrator, AIAgentType } from '../ai/orchestrator';
import { supabaseAdmin } from '../services/supabase';

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
 * Generate new ideas/nodes from a prompt
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

    const result = await aiOrchestrator.execute({
      agentType: 'generate',
      mapId: map_id,
      userId: req.user!.id,
      input: {
        prompt,
        parent_node_id,
        ...context,
      },
      options: options || {},
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/ai/expand
 * Expand a specific node with sub-ideas
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

    const result = await aiOrchestrator.execute({
      agentType: 'expand',
      mapId: map_id,
      userId: req.user!.id,
      input: {
        node_id,
        ...context,
      },
      options: options || {},
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/ai/summarize
 * Summarize selected nodes or entire map
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

    const result = await aiOrchestrator.execute({
      agentType: 'summarize',
      mapId: map_id,
      userId: req.user!.id,
      input: {
        node_ids,
        ...context,
      },
      options: options || {},
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/ai/to-tasks
 * Convert nodes to actionable tasks
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

    const result = await aiOrchestrator.execute({
      agentType: 'to_tasks',
      mapId: map_id,
      userId: req.user!.id,
      input: {
        node_ids,
        ...context,
      },
      options: options || {},
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * POST /api/ai/chat
 * Chat with AI about the map
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

    const result = await aiOrchestrator.execute({
      agentType: 'chat',
      mapId: map_id,
      userId: req.user!.id,
      input: {
        message,
        ...context,
      },
      options: {},
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

export default router;
