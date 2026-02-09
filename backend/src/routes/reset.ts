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
      // 1. Delete all tasks for this user first
      const { error: tasksError } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('created_by', userId);

      if (tasksError && tasksError.message !== 'No rows matched the criteria') {
        logger.warn({ error: tasksError, userId }, 'Warning deleting tasks');
      }
      logger.info({ userId }, '✅ Tasks deleted');

      // 2. Delete all maps (cascading deletes will remove nodes, edges, etc.)
      const { error: mapsError } = await supabaseAdmin
        .from('maps')
        .delete()
        .eq('workspace_id', userId);

      if (mapsError) {
        logger.error({ error: mapsError, userId }, 'Failed to delete maps');
        throw mapsError;
      }
      logger.info({ userId }, '✅ Maps deleted (nodes/edges cascade-deleted)');

      // 4. Delete profile data
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError && profileError.message !== 'No rows matched the criteria') {
        logger.warn({ error: profileError, userId }, 'Warning deleting profile');
      }
      logger.info({ userId }, '✅ Profile deleted');

      // 5. Delete workspaces
      const { error: workspacesError } = await supabaseAdmin
        .from('workspaces')
        .delete()
        .eq('id', userId);

      if (workspacesError && workspacesError.message !== 'No rows matched the criteria') {
        logger.warn({ error: workspacesError, userId }, 'Warning deleting workspaces');
      }
      logger.info({ userId }, '✅ Workspaces deleted');

      // 6. Delete activity events
      const { error: activityError } = await supabaseAdmin
        .from('activity_events')
        .delete()
        .eq('user_id', userId);

      if (activityError && activityError.message !== 'No rows matched the criteria') {
        logger.warn({ error: activityError, userId }, 'Warning deleting activity events');
      }
      logger.info({ userId }, '✅ Activity events deleted');

      // 7. Finally, delete the user account from Supabase Auth
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
      logger.error({ error, userId }, '❌ Factory reset failed');

      return res.status(500).json({
        success: false,
        error: 'Failed to reset factory. Some data may remain.',
      });
    }
  })
);

export default router;
