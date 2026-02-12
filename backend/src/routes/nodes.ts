import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, asyncHandler } from '../middleware';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../utils/env';
import { supabaseAdmin } from '../services/supabase';
import { Insertable, Updatable } from '../types/database';

const router = Router();

// Validation schemas
const createNodeSchema = z.object({
  map_id: z.string().uuid('Invalid map ID'),
  parent_id: z.string().uuid().nullable().optional(),
  type: z
    .enum(['idea', 'task', 'note', 'reference', 'image', 'group', 'research', 'data', 'question'])
    .default('idea'),
  label: z.string().min(1, 'Label required').max(500, 'Label too long'),
  content: z.string().max(10000).nullable().optional(),
  position_x: z.number().default(0),
  position_y: z.number().default(0),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  style: z.record(z.any()).optional().default({}),
  data: z.record(z.any()).optional().default({}),
  collapsed: z.boolean().optional().default(false),
});

const updateNodeSchema = z.object({
  parent_id: z.string().uuid().nullable().optional(),
  type: z
    .enum(['idea', 'task', 'note', 'reference', 'image', 'group', 'research', 'data', 'question'])
    .optional(),
  label: z.string().min(1).max(500).optional(),
  content: z.string().max(10000).nullable().optional(),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
  style: z.record(z.any()).optional(),
  data: z.record(z.any()).optional(),
  collapsed: z.boolean().optional(),
});

const batchUpdateSchema = z.object({
  nodes: z
    .array(
      z.object({
        id: z.string().uuid(),
        position_x: z.number().optional(),
        position_y: z.number().optional(),
        width: z.number().nullable().optional(),
        height: z.number().nullable().optional(),
        collapsed: z.boolean().optional(),
        style: z.record(z.any()).optional(),
        data: z.record(z.any()).optional(),
      })
    )
    .min(1)
    .max(100),
});

const createEdgeSchema = z.object({
  map_id: z.string().uuid('Invalid map ID'),
  source_id: z.string().uuid('Invalid source node ID'),
  target_id: z.string().uuid('Invalid target node ID'),
  type: z.enum(['default', 'step', 'smoothstep', 'straight', 'bezier']).default('default'),
  label: z.string().max(200).nullable().optional(),
  style: z.record(z.any()).optional().default({}),
  animated: z.boolean().optional().default(false),
});

/**
 * GET /api/nodes/map/:mapId
 * Get all nodes for a map
 */
router.get(
  '/map/:mapId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { mapId } = req.params;

    const { data: nodes, error } = await req.supabase
      .from('nodes')
      .select('*')
      .eq('map_id', mapId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error({ error: error.message, mapId }, 'Failed to fetch nodes');
      throw new Error('Failed to fetch nodes');
    }

    res.json({
      success: true,
      data: nodes || [],
    });
  })
);

/**
 * GET /api/nodes/:nodeId
 * Get single node with details
 */
router.get(
  '/:nodeId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { nodeId } = req.params;

    const { data: node, error } = await req.supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId)
      .single();

    if (error || !node) {
      throw new NotFoundError('Node not found');
    }

    res.json({
      success: true,
      data: node,
    });
  })
);

/**
 * POST /api/nodes
 * Create new node
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const parsed = createNodeSchema.safeParse(req.body);
      if (!parsed.success) {
        logger.warn({ errors: parsed.error.errors }, 'Node validation failed');
        throw new ValidationError(parsed.error.errors[0].message);
      }

      // Verify map exists first
      const { data: map, error: mapError } = await req.supabase
        .from('maps')
        .select('id')
        .eq('id', parsed.data.map_id)
        .single();

      if (mapError || !map) {
        logger.warn({ mapId: parsed.data.map_id, error: mapError?.message }, 'Map not found');
        throw new NotFoundError(`Map ${parsed.data.map_id} not found`);
      }

      const nodeData: Insertable<'nodes'> & { type?: string } = {
        map_id: parsed.data.map_id,
        parent_id: parsed.data.parent_id || null,
        type: parsed.data.type as any,
        label: parsed.data.label || 'Untitled',
        content: parsed.data.content || null,
        position_x: parsed.data.position_x,
        position_y: parsed.data.position_y,
        width: parsed.data.width,
        height: parsed.data.height,
        style: parsed.data.style || {},
        data: parsed.data.data || {},
        collapsed: parsed.data.collapsed || false,
        created_by: req.user.id,
        updated_at: new Date().toISOString(),
      } as any;

      const { data: node, error } = await req.supabase
        .from('nodes')
        .insert(nodeData)
        .select('*')
        .single();

      if (error) {
        logger.error({ error: error.message, code: error.code, nodeData }, 'Failed to create node');
        throw new Error(`Database error: ${error.message}`);
      }

      // Create edge from parent if specified
      if (parsed.data.parent_id) {
        const { error: edgeError } = await req.supabase.from('edges').insert({
          map_id: parsed.data.map_id,
          source_id: parsed.data.parent_id,
          target_id: node.id,
          type: 'default',
        });

        if (edgeError) {
          logger.warn({ error: edgeError.message }, 'Failed to create edge');
        }
      }

      // Log activity
      try {
        await logNodeActivity(
          req.user.id,
          node.map_id,
          node.id,
          'node_created',
          `Created node "${node.label}"`
        );
      } catch (e) {
        logger.warn({ error: e }, 'Failed to log activity');
      }

      logger.info(
        { nodeId: node.id, mapId: node.map_id, userId: req.user.id },
        'Node created successfully'
      );

      res.status(201).json({
        success: true,
        data: node,
      });
    } catch (err) {
      logger.error({ error: err, body: req.body }, 'Create node error');
      throw err;
    }
  })
);

/**
 * PATCH /api/nodes/batch
 * Batch update multiple nodes (positions, etc.)
 */
router.patch(
  '/batch',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = batchUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { nodes } = parsed.data;
    const results: any[] = [];
    const errors: any[] = [];

    // Update nodes in parallel
    await Promise.all(
      nodes.map(async (nodeUpdate) => {
        const { id, ...updateData } = nodeUpdate;

        const { data, error } = await req.supabase
          .from('nodes')
          .update({
            ...updateData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select('id')
          .single();

        if (error) {
          errors.push({ id, error: error.message });
        } else if (data) {
          results.push(data);
        }
      })
    );

    logger.debug({ count: results.length, userId: req.user.id }, 'Batch node update');

    res.json({
      success: errors.length === 0,
      data: {
        updated: results.length,
        failed: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  })
);

/**
 * PATCH /api/nodes/:nodeId
 * Update node
 */
router.patch(
  '/:nodeId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { nodeId } = req.params;

    const parsed = updateNodeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const updateData: Updatable<'nodes'> & { type?: string } = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    } as any;

    const { data: node, error } = await req.supabase
      .from('nodes')
      .update(updateData)
      .eq('id', nodeId)
      .select('*')
      .single();

    if (error || !node) {
      throw new NotFoundError('Node not found or access denied');
    }

    logger.debug({ nodeId, userId: req.user.id }, 'Node updated');

    res.json({
      success: true,
      data: node,
    });
  })
);

/**
 * DELETE /api/nodes/:nodeId
 * Delete node and its children
 */
router.delete(
  '/:nodeId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { nodeId } = req.params;
    const { cascade = 'true' } = req.query;

    // Get node info for activity log
    const { data: node } = await req.supabase
      .from('nodes')
      .select('label, map_id')
      .eq('id', nodeId)
      .single();

    if (!node) {
      throw new NotFoundError('Node not found');
    }

    const nodeIdStr = Array.isArray(nodeId) ? nodeId[0] : nodeId;

    if (cascade === 'true') {
      // Get all descendant nodes
      const descendants = await getDescendantIds(req.supabase, nodeIdStr);
      const allNodeIds = [nodeIdStr, ...descendants];

      // Delete all nodes (edges cascade automatically)
      const { error } = await req.supabase.from('nodes').delete().in('id', allNodeIds);

      if (error) {
        logger.error({ error: error.message, nodeId }, 'Failed to delete nodes');
        throw new Error('Failed to delete node');
      }

      logger.info(
        { nodeId, descendants: descendants.length, userId: req.user.id },
        'Node deleted with children'
      );
    } else {
      // Just delete this node, children become orphans
      const { error } = await req.supabase.from('nodes').delete().eq('id', nodeId);

      if (error) {
        throw new Error('Failed to delete node');
      }

      logger.info({ nodeId, userId: req.user.id }, 'Node deleted');
    }

    // Log activity
    await logNodeActivity(
      req.user.id,
      node.map_id,
      null,
      'node_deleted',
      `Deleted node "${node.label}"`
    );

    res.json({
      success: true,
      message: 'Node deleted successfully',
    });
  })
);

// ============ EDGES ============

/**
 * GET /api/nodes/edges/map/:mapId
 * Get all edges for a map
 */
router.get(
  '/edges/map/:mapId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { mapId } = req.params;

    const { data: edges, error } = await req.supabase.from('edges').select('*').eq('map_id', mapId);

    if (error) {
      logger.error({ error: error.message, mapId }, 'Failed to fetch edges');
      throw new Error('Failed to fetch edges');
    }

    res.json({
      success: true,
      data: edges || [],
    });
  })
);

/**
 * POST /api/nodes/edges
 * Create new edge
 */
router.post(
  '/edges',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createEdgeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { source_id, target_id, map_id } = parsed.data;

    // Prevent self-loops
    if (source_id === target_id) {
      throw new ValidationError('Cannot create edge from node to itself');
    }

    // Validate both nodes exist in the map
    const { data: nodes, error: nodesError } = await req.supabase
      .from('nodes')
      .select('id')
      .eq('map_id', map_id)
      .in('id', [source_id, target_id]);

    if (nodesError || !nodes || nodes.length !== 2) {
      throw new ValidationError('One or both nodes do not exist in this map');
    }

    // Check for existing edge
    const { data: existing, error: existingError } = await req.supabase
      .from('edges')
      .select('id')
      .eq('source_id', source_id)
      .eq('target_id', target_id)
      .maybeSingle();

    if (existing) {
      // Idempotent behavior: if edge already exists, return success.
      logger.debug(
        { source_id, target_id, mapId: map_id, edgeId: existing.id },
        'Edge already exists'
      );
      return res.status(200).json({
        success: true,
        data: existing,
        meta: { duplicate: true },
      });
    }

    const { data: edge, error } = await req.supabase
      .from('edges')
      .insert(parsed.data)
      .select()
      .single();

    if (error) {
      logger.error({ error: error.message, source_id, target_id }, 'Failed to create edge');
      throw new Error(`Failed to create edge: ${error.message}`);
    }

    logger.debug({ edgeId: edge.id, mapId: edge.map_id }, 'Edge created');

    res.status(201).json({
      success: true,
      data: edge,
    });
  })
);

/**
 * DELETE /api/nodes/edges/:edgeId
 * Delete edge
 */
router.delete(
  '/edges/:edgeId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { edgeId } = req.params;

    const { error } = await req.supabase.from('edges').delete().eq('id', edgeId);

    if (error) {
      logger.error({ error: error.message, edgeId }, 'Failed to delete edge');
      throw new Error('Failed to delete edge');
    }

    res.json({
      success: true,
      message: 'Edge deleted successfully',
    });
  })
);

// ============ COMMENTS ============

/**
 * GET /api/nodes/:nodeId/comments
 * Get comments for a node
 */
router.get(
  '/:nodeId/comments',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { nodeId } = req.params;

    const { data: comments, error } = await req.supabase
      .from('comments')
      .select('*')
      .eq('node_id', nodeId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error('Failed to fetch comments');
    }

    res.json({
      success: true,
      data: comments || [],
    });
  })
);

/**
 * POST /api/nodes/:nodeId/comments
 * Add comment to node
 */
router.post(
  '/:nodeId/comments',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { nodeId } = req.params;
    const { content, mentions = [], parent_comment_id } = req.body;

    if (!content || content.trim().length === 0) {
      throw new ValidationError('Comment content required');
    }

    const { data: comment, error } = await req.supabase
      .from('comments')
      .insert({
        node_id: nodeId,
        user_id: req.user.id,
        content: content.trim(),
        mentions,
        parent_comment_id,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error('Failed to create comment');
    }

    logger.info({ commentId: comment.id, nodeId, userId: req.user.id }, 'Comment created');

    res.status(201).json({
      success: true,
      data: comment,
    });
  })
);

/**
 * DELETE /api/nodes/comments/:commentId
 * Delete comment
 */
router.delete(
  '/comments/:commentId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { commentId } = req.params;

    // Only allow deleting own comments
    const { error } = await req.supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', req.user.id);

    if (error) {
      throw new Error('Failed to delete comment');
    }

    res.json({
      success: true,
      message: 'Comment deleted',
    });
  })
);

// ============ HELPERS ============

/**
 * Recursively get all descendant node IDs
 */
async function getDescendantIds(supabase: any, parentId: string): Promise<string[]> {
  const { data: children } = await supabase.from('nodes').select('id').eq('parent_id', parentId);

  if (!children || children.length === 0) {
    return [];
  }

  const childIds = children.map((c: any) => c.id);
  const grandchildIds = await Promise.all(
    childIds.map((id: string) => getDescendantIds(supabase, id))
  );

  return [...childIds, ...grandchildIds.flat()];
}

/**
 * Log node activity
 */
async function logNodeActivity(
  userId: string,
  mapId: string,
  nodeId: string | null,
  eventType: string,
  description: string
): Promise<void> {
  try {
    // Get workspace ID from map
    const { data: map, error } = (await supabaseAdmin
      .from('maps')
      .select('workspace_id')
      .eq('id', mapId)
      .single()) as any;

    const workspaceId =
      map?.workspace_id ||
      (error?.message?.includes('maps.workspace_id') ? env.DEFAULT_WORKSPACE_ID : undefined);

    if (workspaceId) {
      const activityData: any = {
        workspace_id: workspaceId,
        map_id: mapId,
        node_id: nodeId,
        user_id: userId,
        event_type: eventType,
        description: description,
      };

      await supabaseAdmin.from('activity_events').insert(activityData);
    }
  } catch (error) {
    logger.warn({ error, eventType }, 'Failed to log activity');
  }
}

export default router;
