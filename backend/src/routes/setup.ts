import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';

import { asyncHandler, authenticate, requireSystemAdmin } from '../middleware';
import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';
import { env } from '../utils/env';

const router = Router();

const blockInProduction = (req: Request, res: Response, next: () => void): void => {
  if (env.NODE_ENV === 'production') {
    logger.warn({ path: req.originalUrl, method: req.method }, 'Blocked setup route in production');
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    });
    return;
  }

  next();
};

/**
 * POST /api/setup/seed
 * Quick setup: creates workspace/maps/nodes/edges for the CURRENT admin user.
 * IMPORTANT: does NOT create additional auth accounts (fixed-accounts mode).
 */
router.post(
  '/seed',
  blockInProduction,
  authenticate,
  requireSystemAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' },
      });
    }

    const userId = req.user.id;
    const userEmail = req.user.email;

    logger.info({ userId }, '[Seed] Starting database seed...');

    try {
      // 1) Ensure profile exists (should already exist via auth middleware)
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profile) {
        const displayName = userEmail.split('@')[0] || 'Admin';
        const { error: insertError } = await supabaseAdmin.from('profiles').insert({
          id: userId,
          email: userEmail,
          display_name: displayName,
          avatar_url: null,
          color: '#06E5FF',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }
        logger.info({ userId }, '[Seed] Profile created');
      }

      // 2) Ensure default workspace exists
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('id')
        .eq('id', env.DEFAULT_WORKSPACE_ID)
        .maybeSingle();

      if (!workspace) {
        const { error: wsError } = await supabaseAdmin.from('workspaces').insert({
          id: env.DEFAULT_WORKSPACE_ID,
          name: 'MindLab',
          slug: 'mindlab',
          description: 'Workspace padrao',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (wsError) {
          throw new Error(`Failed to create workspace: ${wsError.message}`);
        }
        logger.info({ workspaceId: env.DEFAULT_WORKSPACE_ID }, '[Seed] Default workspace created');
      }

      // 3) Ensure user is workspace member (admin)
      const { data: memberData } = await supabaseAdmin
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', env.DEFAULT_WORKSPACE_ID)
        .eq('user_id', userId)
        .maybeSingle();

      if (!memberData) {
        const { error: memberError } = await supabaseAdmin.from('workspace_members').insert({
          workspace_id: env.DEFAULT_WORKSPACE_ID,
          user_id: userId,
          role: 'admin',
          joined_at: new Date().toISOString(),
        });

        if (memberError) {
          throw new Error(`Failed to add workspace member: ${memberError.message}`);
        }
        logger.info({ userId, workspaceId: env.DEFAULT_WORKSPACE_ID }, '[Seed] User added to workspace');
      }

      // 4) Create test map
      const mapId = randomUUID();
      const { error: mapError } = await supabaseAdmin.from('maps').insert({
        id: mapId,
        workspace_id: env.DEFAULT_WORKSPACE_ID,
        title: 'Welcome to MindMap Hub',
        description: 'Your first collaborative mind map',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (mapError) {
        throw new Error(`Failed to create map: ${mapError.message}`);
      }

      // 5) Create test nodes
      const nodeIds = [1, 2, 3, 4, 5].map(() => randomUUID());
      const nodes = nodeIds.map((nodeId, idx) => ({
        id: nodeId,
        map_id: mapId,
        label: ['Central Thought', 'Idea 1', 'Idea 2', 'Idea 3', 'Conclusion'][idx],
        content: `Node ${idx + 1} content`,
        position_x: 100 + idx * 150,
        position_y: 100 + (idx % 2) * 100,
        version: 1,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: nodesError } = await supabaseAdmin.from('nodes').insert(nodes);
      if (nodesError) {
        throw new Error(`Failed to create nodes: ${nodesError.message}`);
      }

      // 6) Create test edges
      const edges = [
        { source_id: nodeIds[0], target_id: nodeIds[1] },
        { source_id: nodeIds[0], target_id: nodeIds[2] },
        { source_id: nodeIds[0], target_id: nodeIds[3] },
        { source_id: nodeIds[1], target_id: nodeIds[4] },
        { source_id: nodeIds[2], target_id: nodeIds[4] },
      ].map((edge) => ({
        id: randomUUID(),
        map_id: mapId,
        source_id: edge.source_id,
        target_id: edge.target_id,
        type: 'default',
        label: 'seed-link',
        style: {},
        animated: false,
        created_at: new Date().toISOString(),
      }));

      const { error: edgesError } = await supabaseAdmin.from('edges').insert(edges);
      if (edgesError) {
        throw new Error(`Failed to create edges: ${edgesError.message}`);
      }

      logger.info({ userId, mapId }, '[Seed] Database seed complete');

      res.json({
        success: true,
        message: 'Setup complete',
        data: {
          userId,
          email: userEmail,
          workspaceId: env.DEFAULT_WORKSPACE_ID,
          mapId,
          stats: {
            nodes: nodeIds.length,
            edges: edges.length,
          },
        },
      });
    } catch (error) {
      logger.error({ error }, '[Seed] Failed');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Setup failed',
      });
    }
  })
);

export default router;
