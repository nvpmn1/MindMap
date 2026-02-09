import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  authenticate,
  requireWorkspaceMember,
  requireWorkspaceEditor,
  asyncHandler,
} from '../middleware';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../utils/env';
import { supabaseAdmin } from '../services/supabase';
import { Tables, Insertable, Updatable } from '../types/database';

const router = Router();

// Validation schemas
const createMapSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  title: z.string().min(1, 'Title required').max(200, 'Title too long'),
  description: z.string().max(1000).optional(),
  is_template: z.boolean().optional().default(false),
  settings: z.record(z.any()).optional().default({}),
});

const updateMapSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  is_template: z.boolean().optional(),
  settings: z.record(z.any()).optional(),
  thumbnail_url: z.string().url().nullable().optional(),
});

const listMapsQuerySchema = z.object({
  workspace_id: z.string().uuid().optional(),
  is_template: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().optional(),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
  offset: z.string().transform(Number).pipe(z.number().min(0)).optional().default('0'),
});

/**
 * GET /api/maps
 * List maps user has access to
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = listMapsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { workspace_id, is_template, search, limit, offset } = parsed.data;

    const buildBaseQuery = () =>
      req
        .supabase!.from('maps')
        .select(
          `
          *
        `,
          { count: 'exact' }
        )
        .order('updated_at', { ascending: false });

    const applyCommonFilters = (queryToFilter: any) => {
      let q = queryToFilter;
      if (typeof is_template === 'boolean') {
        q = q.eq('is_template', is_template);
      }
      if (search) {
        q = q.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }
      return q.range(offset, offset + limit - 1);
    };

    let query = applyCommonFilters(buildBaseQuery());

    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id);
    }

    let { data: maps, error, count } = await query;

    if (error && error.message?.includes('maps.workspace_id')) {
      logger.warn(
        { error: error.message },
        'Workspace column missing; retrying without workspace filter'
      );
      const retryQuery = applyCommonFilters(buildBaseQuery());
      const retry = await retryQuery;
      maps = retry.data;
      error = retry.error as any;
      count = retry.count as any;
    }

    if (error) {
      logger.error({ error: error.message }, 'Failed to fetch maps');
      throw new Error('Failed to fetch maps');
    }

    res.json({
      success: true,
      data: maps,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    });
  })
);

/**
 * GET /api/maps/:mapId
 * Get single map with nodes and edges
 */
router.get(
  '/:mapId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { mapId } = req.params;

    // Fetch map with related data
    const { data: map, error } = await req
      .supabase!.from('maps')
      .select(
        `
        *
      `
      )
      .eq('id', mapId)
      .single();

    if (error || !map) {
      logger.warn({ mapId, error: error?.message }, 'Map not found');
      throw new NotFoundError(`Map not found: ${mapId}`);
    }

    // Log activity
    const mapIdStr = Array.isArray(mapId) ? mapId[0] : mapId;
    const activityWorkspaceId = (map as any)?.workspace_id || env.DEFAULT_WORKSPACE_ID;
    await logActivity(req.user!.id, activityWorkspaceId, mapIdStr, 'map_viewed', 'Viewed map');

    res.json({
      success: true,
      data: map,
    });
  })
);

/**
 * POST /api/maps
 * Create new map
 */
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = createMapSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const mapData = {
      workspace_id: parsed.data.workspace_id,
      title: parsed.data.title,
      description: parsed.data.description,
      is_template: parsed.data.is_template,
      settings: parsed.data.settings,
      created_by: req.user!.id,
    };

    // Create map using RLS-enabled client
    let { data: map, error } = await req
      .supabase!.from('maps')
      .insert(mapData)
      .select(
        `
        *
      `
      )
      .single();

    if (error && error.message?.includes('maps.workspace_id')) {
      const { workspace_id: _workspaceId, ...fallbackData } = mapData as any;
      const retry = await req
        .supabase!.from('maps')
        .insert(fallbackData)
        .select(
          `
          *
        `
        )
        .single();
      map = retry.data;
      error = retry.error;
    }

    if (error) {
      logger.error({ error: error.message }, 'Failed to create map');
      throw new Error('Failed to create map');
    }

    // Create root node automatically
    await req.supabase!.from('nodes').insert({
      map_id: map.id,
      type: 'idea',
      label: map.title,
      position_x: 0,
      position_y: 0,
      created_by: req.user!.id,
    });

    // Log activity
    const activityWorkspaceId = (map as any)?.workspace_id || env.DEFAULT_WORKSPACE_ID;
    await logActivity(
      req.user!.id,
      activityWorkspaceId,
      map.id,
      'map_created',
      `Created map "${map.title}"`
    );

    logger.info({ mapId: map.id, userId: req.user!.id }, 'Map created');

    res.status(201).json({
      success: true,
      data: map,
    });
  })
);

/**
 * PATCH /api/maps/:mapId
 * Update map
 */
router.patch(
  '/:mapId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { mapId } = req.params;

    const parsed = updateMapSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const updateData: Updatable<'maps'> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    };

    const { data: map, error } = await req
      .supabase!.from('maps')
      .update(updateData)
      .eq('id', mapId)
      .select(
        `
        *
      `
      )
      .single();

    if (error || !map) {
      throw new NotFoundError('Map not found or access denied');
    }

    // Log activity
    const activityWorkspaceId = (map as any)?.workspace_id || env.DEFAULT_WORKSPACE_ID;
    await logActivity(
      req.user!.id,
      activityWorkspaceId,
      map.id,
      'map_updated',
      `Updated map "${map.title}"`
    );

    logger.info({ mapId, userId: req.user!.id }, 'Map updated');

    res.json({
      success: true,
      data: map,
    });
  })
);

/**
 * DELETE /api/maps/:mapId
 * Delete map
 */
router.delete(
  '/:mapId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { mapId } = req.params;

    // Get map for activity log
    const { data: map } = await req
      .supabase!.from('maps')
      .select('title, workspace_id')
      .eq('id', mapId)
      .single();

    if (!map) {
      throw new NotFoundError('Map not found');
    }

    // Delete map (cascades to nodes, edges, etc.)
    const { error } = await req.supabase!.from('maps').delete().eq('id', mapId);

    if (error) {
      logger.error({ error: error.message, mapId }, 'Failed to delete map');
      throw new Error('Failed to delete map');
    }

    // Log activity
    const activityWorkspaceId = (map as any)?.workspace_id || env.DEFAULT_WORKSPACE_ID;
    await logActivity(
      req.user!.id,
      activityWorkspaceId,
      null,
      'map_deleted',
      `Deleted map "${map.title}"`
    );

    logger.info({ mapId, userId: req.user!.id }, 'Map deleted');

    res.json({
      success: true,
      message: 'Map deleted successfully',
    });
  })
);

/**
 * POST /api/maps/:mapId/duplicate
 * Duplicate a map
 */
router.post(
  '/:mapId/duplicate',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { mapId } = req.params;
    const { title } = req.body;

    // Get original map with nodes and edges
    const { data: original, error: fetchError } = await req
      .supabase!.from('maps')
      .select(
        `
        *,
        nodes (*),
        edges (*)
      `
      )
      .eq('id', mapId)
      .single();

    if (fetchError || !original) {
      throw new NotFoundError('Map not found');
    }

    // Create new map
    const { data: newMap, error: createError } = await req
      .supabase!.from('maps')
      .insert({
        workspace_id: original.workspace_id,
        title: title || `${original.title} (Copy)`,
        description: original.description,
        is_template: false,
        settings: original.settings,
        created_by: req.user!.id,
      })
      .select()
      .single();

    if (createError || !newMap) {
      throw new Error('Failed to create map copy');
    }

    // Create node ID mapping for edges
    const nodeIdMap = new Map<string, string>();

    // Copy nodes
    if (original.nodes && original.nodes.length > 0) {
      const newNodes = original.nodes.map((node: any) => {
        const newNodeId = crypto.randomUUID();
        nodeIdMap.set(node.id, newNodeId);

        return {
          id: newNodeId,
          map_id: newMap.id,
          parent_id: node.parent_id ? nodeIdMap.get(node.parent_id) || null : null,
          type: node.type,
          label: node.label,
          content: node.content,
          position_x: node.position_x,
          position_y: node.position_y,
          width: node.width,
          height: node.height,
          style: node.style,
          data: node.data,
          collapsed: node.collapsed,
          created_by: req.user!.id,
        };
      });

      // Update parent_ids with new IDs
      for (const node of newNodes) {
        const originalNode = original.nodes.find((n: any) => nodeIdMap.get(n.id) === node.id);
        if (originalNode?.parent_id) {
          node.parent_id = nodeIdMap.get(originalNode.parent_id) || null;
        }
      }

      await req.supabase!.from('nodes').insert(newNodes);
    }

    // Copy edges
    if (original.edges && original.edges.length > 0) {
      const newEdges = original.edges
        .map((edge: any) => ({
          map_id: newMap.id,
          source_id: nodeIdMap.get(edge.source_id),
          target_id: nodeIdMap.get(edge.target_id),
          type: edge.type,
          label: edge.label,
          style: edge.style,
          animated: edge.animated,
        }))
        .filter((e: any) => e.source_id && e.target_id);

      if (newEdges.length > 0) {
        await req.supabase!.from('edges').insert(newEdges);
      }
    }

    // Log activity
    const activityWorkspaceId = (newMap as any)?.workspace_id || env.DEFAULT_WORKSPACE_ID;
    await logActivity(
      req.user!.id,
      activityWorkspaceId,
      newMap.id,
      'map_duplicated',
      `Duplicated map from "${original.title}"`
    );

    logger.info(
      { originalMapId: mapId, newMapId: newMap.id, userId: req.user!.id },
      'Map duplicated'
    );

    res.status(201).json({
      success: true,
      data: newMap,
    });
  })
);

/**
 * Helper: Log activity event
 */
async function logActivity(
  userId: string,
  workspaceId: string,
  mapId: string | null,
  eventType: string,
  description: string,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    const activityData: any = {
      workspace_id: workspaceId,
      map_id: mapId,
      user_id: userId,
      event_type: eventType,
      description,
      metadata,
    };

    await supabaseAdmin.from('activity_events').insert(activityData);
  } catch (error) {
    logger.warn({ error, eventType }, 'Failed to log activity');
  }
}

export default router;
