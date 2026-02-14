import { Router, Request, Response } from 'express';
import { asyncHandler, authenticate, requireSystemAdmin } from '../middleware';
import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';
import { env } from '../utils/env';
import { randomUUID } from 'crypto';

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
 * Quick setup: creates test user, workspace, and maps with nodes/edges
 * For development and testing only
 */
router.post(
  '/seed',
  blockInProduction,
  authenticate,
  requireSystemAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const testEmail = 'test@mindmap.local';
    const testPassword = 'Test@1234567890';

    logger.info('🌱 Starting database seed...');

    try {
      // 1️⃣ Create test user (or get existing)
      let userId: string;
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
      const users = (existingUser?.users ?? []) as Array<{ id: string; email?: string | null }>;
      const testUser = users.find((u) => u.email === testEmail);

      if (testUser) {
        userId = testUser.id;
        logger.info({ userId }, '✅ Test user already exists');
      } else {
        const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: testEmail,
          password: testPassword,
          email_confirm: true,
        });

        if (signUpError || !newUser?.user?.id) {
          throw new Error(`Failed to create user: ${signUpError?.message}`);
        }

        userId = newUser.user.id;
        logger.info({ userId }, '✅ Test user created');
      }

      // 2️⃣ Ensure profile exists
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) {
        const { error: insertError } = await supabaseAdmin.from('profiles').insert({
          id: userId,
          email: testEmail,
          display_name: 'Test User',
          avatar_url: null,
          color: '#00D9FF',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          throw new Error(`Failed to create profile: ${insertError.message}`);
        }
        logger.info({ userId }, '✅ Profile created');
      } else {
        logger.info({ userId }, '✅ Profile already exists');
      }

      // 3️⃣ Ensure default workspace exists
      const DEFAULT_WORKSPACE_ID = '11111111-1111-1111-1111-111111111111';
      const { data: workspace } = await supabaseAdmin
        .from('workspaces')
        .select('*')
        .eq('id', DEFAULT_WORKSPACE_ID)
        .single();

      if (!workspace) {
        const { error: wsError } = await supabaseAdmin.from('workspaces').insert({
          id: DEFAULT_WORKSPACE_ID,
          name: 'MindLab',
          slug: 'mindlab',
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (wsError) {
          throw new Error(`Failed to create workspace: ${wsError.message}`);
        }
        logger.info({ workspaceId: DEFAULT_WORKSPACE_ID }, '✅ Default workspace created');
      } else {
        logger.info({ workspaceId: DEFAULT_WORKSPACE_ID }, '✅ Workspace already exists');
      }

      // 4️⃣ Ensure user is workspace member
      const { data: memberData } = await supabaseAdmin
        .from('workspace_members')
        .select('*')
        .eq('workspace_id', DEFAULT_WORKSPACE_ID)
        .eq('user_id', userId)
        .single();

      if (!memberData) {
        const { error: memberError } = await supabaseAdmin.from('workspace_members').insert({
          workspace_id: DEFAULT_WORKSPACE_ID,
          user_id: userId,
          role: 'admin',
          joined_at: new Date().toISOString(),
        });

        if (memberError) {
          throw new Error(`Failed to add workspace member: ${memberError.message}`);
        }
        logger.info({ userId, workspaceId: DEFAULT_WORKSPACE_ID }, '✅ User added to workspace');
      } else {
        logger.info({ userId, workspaceId: DEFAULT_WORKSPACE_ID }, '✅ User already in workspace');
      }

      // 5️⃣ Create test map
      const mapId = randomUUID();
      const { error: mapError } = await supabaseAdmin.from('maps').insert({
        id: mapId,
        workspace_id: DEFAULT_WORKSPACE_ID,
        title: 'Welcome to MindMap Hub',
        description: 'Your first collaborative mind map',
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (mapError) {
        throw new Error(`Failed to create map: ${mapError.message}`);
      }
      logger.info({ mapId }, '✅ Test map created');

      // 6️⃣ Create test nodes
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
      logger.info({ count: nodeIds.length }, '✅ Test nodes created');

      // 7️⃣ Create test edges (connections)
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
      logger.info({ count: edges.length }, '✅ Test edges created');

      logger.info('✅ Database seed complete!');

      res.json({
        success: true,
        message: '✅ Setup complete! Use credentials below to login',
        data: {
          email: testEmail,
          password: testPassword,
          userId,
          workspaceId: DEFAULT_WORKSPACE_ID,
          mapId,
          stats: {
            nodes: nodeIds.length,
            edges: edges.length,
          },
        },
      });
    } catch (error) {
      logger.error({ error }, '❌ Seed failed');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Setup failed',
      });
    }
  })
);

export default router;
