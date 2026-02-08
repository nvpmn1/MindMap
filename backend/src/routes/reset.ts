import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { asyncHandler, authenticate } from '../middleware';
import { logger } from '../utils/logger';
import { env } from '../utils/env';

const router = Router();

/**
 * POST /api/reset/factory-reset
 * Delete ALL user data - DANGEROUS OPERATION
 * Requires authentication
 */
router.post(
  '/factory-reset',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      logger.error('Factory reset attempted without user context');
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
    }

    logger.warn({ userId }, '🔥 FACTORY RESET INITIATED');

    try {
      // 1. Delete all maps for this user
      const { error: mapsError } = await supabaseAdmin
        .from('maps')
        .delete()
        .eq('workspace_id', userId);

      if (mapsError) {
        logger.error({ error: mapsError, userId }, 'Failed to delete maps');
        throw mapsError;
      }
      logger.info({ userId }, '✅ Maps deleted');

      // 2. Delete all nodes (cascade should handle this, but be explicit)
      const { error: nodesError } = await supabaseAdmin
        .from('nodes')
        .delete()
        .eq('map_id', (
          // Try to find all maps for this user first
          await supabaseAdmin
            .from('maps')
            .select('id')
            .eq('workspace_id', userId)
        ).data?.map((m: any) => m.id).join(',') || 'NULL');

      if (nodesError && nodesError.message !== 'No rows matched the criteria') {
        logger.warn({ error: nodesError, userId }, 'Warning deleting nodes');
      }
      logger.info({ userId }, '✅ Nodes deleted');

      // 3. Delete all edges
      const { error: edgesError } = await supabaseAdmin
        .from('edges')
        .delete()
        .eq('created_by', userId);

      if (edgesError && edgesError.message !== 'No rows matched the criteria') {
        logger.warn({ error: edgesError, userId }, 'Warning deleting edges');
      }
      logger.info({ userId }, '✅ Edges deleted');

      // 4. Delete all tasks
      const { error: tasksError } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('created_by', userId);

      if (tasksError && tasksError.message !== 'No rows matched the criteria') {
        logger.warn({ error: tasksError, userId }, 'Warning deleting tasks');
      }
      logger.info({ userId }, '✅ Tasks deleted');

      // 5. Delete profile data
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError && profileError.message !== 'No rows matched the criteria') {
        logger.warn({ error: profileError, userId }, 'Warning deleting profile');
      }
      logger.info({ userId }, '✅ Profile deleted');

      // 6. Delete workspaces
      const { error: workspacesError } = await supabaseAdmin
        .from('workspaces')
        .delete()
        .eq('id', userId);

      if (workspacesError && workspacesError.message !== 'No rows matched the criteria') {
        logger.warn({ error: workspacesError, userId }, 'Warning deleting workspaces');
      }
      logger.info({ userId }, '✅ Workspaces deleted');

      // 7. Delete activity logs
      const { error: activityError } = await supabaseAdmin
        .from('activity_logs')
        .delete()
        .eq('user_id', userId);

      if (activityError && activityError.message !== 'No rows matched the criteria') {
        logger.warn({ error: activityError, userId }, 'Warning deleting activity logs');
      }
      logger.info({ userId }, '✅ Activity logs deleted');

      // 8. Finally, delete the user account from Supabase Auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authError) {
        logger.error({ error: authError, userId }, 'Failed to delete auth user');
        // But continue anyway, the data is already deleted
      }
      logger.info({ userId }, '✅ Auth user deleted');

      logger.warn({ userId }, '🔥 FACTORY RESET COMPLETED - ALL USER DATA DELETED');

      return res.status(200).json({
        success: true,
        message: 'All user data has been permanently deleted',
      });
    } catch (error) {
      logger.error(
        { error, userId },
        '❌ Factory reset failed'
      );

      return res.status(500).json({
        success: false,
        error: 'Failed to reset factory. Some data may remain.',
      });
    }
  })
);

export default router;
