import { Router, Request, Response } from 'express';
import { asyncHandler, authenticate, requireSystemAdmin } from '../middleware';
import { supabaseAdmin } from '../services/supabase';
import { logger } from '../utils/logger';
import { env } from '../utils/env';

const router = Router();

const blockInProduction = (req: Request, res: Response, next: () => void): void => {
  if (env.NODE_ENV === 'production') {
    logger.warn({ path: req.originalUrl, method: req.method }, 'Blocked admin route in production');
    res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
    });
    return;
  }

  next();
};

router.use(blockInProduction, authenticate, requireSystemAdmin);

/**
 * DELETE /api/admin/cleanup-profiles
 * Remove guest profiles, duplicates, and orphaned data
 *
 * This cleans up:
 * - Guest profiles with email pattern *@guest.mindmap.local
 * - Profile-based emails *@profile.local (fallback emails)
 * - Orphaned maps/nodes from deleted users
 */
router.delete(
  '/cleanup-profiles',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Starting profile cleanup...');

    const results = {
      guestProfilesDeleted: 0,
      profileEmailsDeleted: 0,
      orphanedMapsDeleted: 0,
      orphanedNodesDeleted: 0,
      orphanedEdgesDeleted: 0,
      errors: [] as string[],
    };

    try {
      // 1. Delete guest profiles (@guest.mindmap.local)
      const { data: guestProfiles, error: guestError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .like('email', '%@guest.mindmap.local');

      if (guestError) {
        results.errors.push(`Failed to fetch guest profiles: ${guestError.message}`);
      } else if (guestProfiles && guestProfiles.length > 0) {
        const guestIds = guestProfiles.map((p) => p.id);

        // Get maps created by guests
        const { data: guestMaps } = await supabaseAdmin
          .from('maps')
          .select('id')
          .in('created_by', guestIds);

        if (guestMaps && guestMaps.length > 0) {
          const guestMapIds = guestMaps.map((m) => m.id);

          // Delete associated edges
          await supabaseAdmin.from('edges').delete().in('map_id', guestMapIds);

          // Delete associated nodes
          await supabaseAdmin.from('nodes').delete().in('map_id', guestMapIds);

          // Delete maps
          await supabaseAdmin.from('maps').delete().in('id', guestMapIds);
        }

        // Delete profiles
        const { error: deleteGuestError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .in('id', guestIds);

        if (deleteGuestError) {
          results.errors.push(`Failed to delete guest profiles: ${deleteGuestError.message}`);
        } else {
          results.guestProfilesDeleted = guestIds.length;
          logger.info(`Deleted ${guestIds.length} guest profiles`);
        }
      }

      // 2. Delete profile-based fallback emails (@profile.local)
      const { data: profileEmails, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .like('email', '%@profile.local');

      if (profileError) {
        results.errors.push(`Failed to fetch profile emails: ${profileError.message}`);
      } else if (profileEmails && profileEmails.length > 0) {
        const profileIds = profileEmails.map((p) => p.id);

        // Get maps created by these profiles
        const { data: profileMaps } = await supabaseAdmin
          .from('maps')
          .select('id')
          .in('created_by', profileIds);

        if (profileMaps && profileMaps.length > 0) {
          const profileMapIds = profileMaps.map((m) => m.id);

          // Delete associated edges
          await supabaseAdmin.from('edges').delete().in('map_id', profileMapIds);

          // Delete associated nodes
          await supabaseAdmin.from('nodes').delete().in('map_id', profileMapIds);

          // Delete maps
          await supabaseAdmin.from('maps').delete().in('id', profileMapIds);
        }

        // Delete profiles
        const { error: deleteProfileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .in('id', profileIds);

        if (deleteProfileError) {
          results.errors.push(`Failed to delete profile emails: ${deleteProfileError.message}`);
        } else {
          results.profileEmailsDeleted = profileIds.length;
          logger.info(`Deleted ${profileIds.length} profile-based emails`);
        }
      }

      // 3. Clean up orphaned maps (maps without valid creator)
      const { data: allMaps } = await supabaseAdmin.from('maps').select('id, created_by');
      const { data: validProfiles } = await supabaseAdmin.from('profiles').select('id');

      if (allMaps && validProfiles) {
        const validProfileIds = new Set(validProfiles.map((p) => p.id));
        const orphanedMapIds = allMaps
          .filter((m) => !validProfileIds.has(m.created_by))
          .map((m) => m.id);

        if (orphanedMapIds.length > 0) {
          // Delete edges first
          const { error: edgeError } = await supabaseAdmin
            .from('edges')
            .delete()
            .in('map_id', orphanedMapIds);

          if (!edgeError) {results.orphanedEdgesDeleted = orphanedMapIds.length;}

          // Delete nodes
          const { error: nodeError } = await supabaseAdmin
            .from('nodes')
            .delete()
            .in('map_id', orphanedMapIds);

          if (!nodeError) {results.orphanedNodesDeleted = orphanedMapIds.length;}

          // Delete maps
          const { error: mapError } = await supabaseAdmin
            .from('maps')
            .delete()
            .in('id', orphanedMapIds);

          if (!mapError) {
            results.orphanedMapsDeleted = orphanedMapIds.length;
            logger.info(`Deleted ${orphanedMapIds.length} orphaned maps`);
          }
        }
      }

      logger.info({ results }, 'Profile cleanup completed');

      res.json({
        success: true,
        message: 'Profile cleanup completed',
        data: results,
      });
    } catch (error) {
      logger.error({ error }, 'Cleanup failed');
      res.status(500).json({
        success: false,
        error: { code: 'CLEANUP_FAILED', message: 'Failed to cleanup profiles' },
      });
    }
  })
);

/**
 * GET /api/admin/stats
 * Get database statistics
 */
router.get(
  '/stats',
  asyncHandler(async (req: Request, res: Response) => {
    const stats = {
      profiles: 0,
      guestProfiles: 0,
      profileEmails: 0,
      maps: 0,
      nodes: 0,
      edges: 0,
    };

    try {
      // Count profiles
      const { count: profileCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      stats.profiles = profileCount || 0;

      // Count guest profiles
      const { count: guestCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .like('email', '%@guest.mindmap.local');
      stats.guestProfiles = guestCount || 0;

      // Count profile emails
      const { count: profileEmailCount } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .like('email', '%@profile.local');
      stats.profileEmails = profileEmailCount || 0;

      // Count maps
      const { count: mapCount } = await supabaseAdmin
        .from('maps')
        .select('*', { count: 'exact', head: true });
      stats.maps = mapCount || 0;

      // Count nodes
      const { count: nodeCount } = await supabaseAdmin
        .from('nodes')
        .select('*', { count: 'exact', head: true });
      stats.nodes = nodeCount || 0;

      // Count edges
      const { count: edgeCount } = await supabaseAdmin
        .from('edges')
        .select('*', { count: 'exact', head: true });
      stats.edges = edgeCount || 0;

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error({ error }, 'Failed to get stats');
      res.status(500).json({
        success: false,
        error: { code: 'STATS_FAILED', message: 'Failed to get stats' },
      });
    }
  })
);

export default router;
