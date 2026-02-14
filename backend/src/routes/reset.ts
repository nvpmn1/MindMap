import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../services/supabase';
import { asyncHandler, authenticate } from '../middleware';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/reset/factory-reset
 * Dangerous operation: removes user-owned data and account.
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

    logger.warn({ userId }, 'Factory reset initiated');

    try {
      // Resolve workspaces this user belongs to. We scope map deletion by membership + created_by.
      const { data: memberships, error: membershipsError } = await supabaseAdmin
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId);

      if (membershipsError) {
        logger.warn({ userId, error: membershipsError }, 'Failed to resolve workspace memberships');
      }

      const workspaceIds = Array.from(
        new Set((memberships || []).map((row: { workspace_id: string }) => row.workspace_id))
      );

      // Delete tasks created by user.
      const { error: taskDeleteError } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('created_by', userId);

      if (taskDeleteError && taskDeleteError.message !== 'No rows matched the criteria') {
        logger.warn({ userId, error: taskDeleteError }, 'Warning deleting user-created tasks');
      }

      // Remove user assignment from shared tasks.
      const { error: taskUnassignError } = await supabaseAdmin
        .from('tasks')
        .update({ assigned_to: null })
        .eq('assigned_to', userId);

      if (taskUnassignError && taskUnassignError.message !== 'No rows matched the criteria') {
        logger.warn({ userId, error: taskUnassignError }, 'Warning unassigning user from tasks');
      }

      // Delete maps created by user (scoped to membership when available).
      let ownedMapsQuery = supabaseAdmin.from('maps').select('id').eq('created_by', userId);
      if (workspaceIds.length > 0) {
        ownedMapsQuery = ownedMapsQuery.in('workspace_id', workspaceIds);
      }

      const { data: ownedMaps, error: ownedMapsError } = await ownedMapsQuery;
      if (ownedMapsError) {
        logger.error({ userId, error: ownedMapsError }, 'Failed to resolve user-owned maps');
        throw ownedMapsError;
      }

      const ownedMapIds = (ownedMaps || []).map((row: { id: string }) => row.id);
      if (ownedMapIds.length > 0) {
        const { error: mapsDeleteError } = await supabaseAdmin.from('maps').delete().in('id', ownedMapIds);
        if (mapsDeleteError) {
          logger.error(
            { userId, ownedMapCount: ownedMapIds.length, error: mapsDeleteError },
            'Failed to delete user-owned maps'
          );
          throw mapsDeleteError;
        }
      }

      // Nullify FK references on shared records that may still point to this profile.
      const nullifyRefOperations = [
        {
          label: 'maps.created_by',
          run: () => supabaseAdmin.from('maps').update({ created_by: null }).eq('created_by', userId),
        },
        {
          label: 'nodes.created_by',
          run: () => supabaseAdmin.from('nodes').update({ created_by: null }).eq('created_by', userId),
        },
        {
          label: 'tasks.created_by',
          run: () => supabaseAdmin.from('tasks').update({ created_by: null }).eq('created_by', userId),
        },
        {
          label: 'workspaces.created_by',
          run: () =>
            supabaseAdmin.from('workspaces').update({ created_by: null }).eq('created_by', userId),
        },
      ];

      for (const operation of nullifyRefOperations) {
        const { error } = await operation.run();
        if (error && error.message !== 'No rows matched the criteria') {
          logger.warn(
            { userId, target: operation.label, error },
            'Warning nullifying shared record profile reference'
          );
        }
      }

      // Remove memberships.
      const { error: membershipDeleteError } = await supabaseAdmin
        .from('workspace_members')
        .delete()
        .eq('user_id', userId);

      if (membershipDeleteError && membershipDeleteError.message !== 'No rows matched the criteria') {
        logger.warn({ userId, error: membershipDeleteError }, 'Warning deleting workspace memberships');
      }

      // Delete user activity/audit records tied to the profile.
      const { error: activityDeleteError } = await supabaseAdmin
        .from('activity_events')
        .delete()
        .eq('user_id', userId);

      if (activityDeleteError && activityDeleteError.message !== 'No rows matched the criteria') {
        logger.warn({ userId, error: activityDeleteError }, 'Warning deleting activity events');
      }

      const { error: aiRunsDeleteError } = await supabaseAdmin
        .from('ai_runs')
        .delete()
        .eq('user_id', userId);

      if (aiRunsDeleteError && aiRunsDeleteError.message !== 'No rows matched the criteria') {
        logger.warn({ userId, error: aiRunsDeleteError }, 'Warning deleting ai runs');
      }

      // Delete profile row.
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError && profileDeleteError.message !== 'No rows matched the criteria') {
        logger.error({ userId, error: profileDeleteError }, 'Failed to delete profile row');
        throw profileDeleteError;
      }

      // Delete auth account.
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        logger.error({ userId, error: authDeleteError }, 'Failed to delete auth user');
      }

      logger.warn({ userId, deletedMaps: ownedMapIds.length }, 'Factory reset completed');

      return res.status(200).json({
        success: true,
        message: 'All user data has been permanently deleted',
        data: {
          deletedMaps: ownedMapIds.length,
        },
      });
    } catch (error) {
      logger.error({ error, userId }, 'Factory reset failed');

      return res.status(500).json({
        success: false,
        error: 'Failed to reset factory. Some data may remain.',
      });
    }
  })
);

export default router;
