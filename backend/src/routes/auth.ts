import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

import { asyncHandler, authenticate } from '../middleware';
import { AuthorizationError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../utils/env';
import { FIXED_ACCOUNTS, isAllowedFixedAccountEmail } from '../auth/fixedAccounts';

const router = Router();

// Supabase Auth client for refresh-token exchange.
// Prefer anon key when available; fallback keeps dev setups working.
const supabaseAuth = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

/**
 * GET /api/auth/accounts
 * Public: returns the only allowed accounts (no passwords).
 */
router.get(
  '/accounts',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: FIXED_ACCOUNTS.map((a) => ({
        key: a.key,
        display_name: a.displayName,
        email: a.email,
        color: a.color,
        role: a.workspaceRole,
      })),
    });
  })
);

/**
 * POST /api/auth/refresh
 * Public: exchange a refresh_token for a new session.
 *
 * Useful for CI smoke tests and for clients that don't want to talk to Supabase directly.
 */
const refreshSchema = z.object({
  refresh_token: z.string().min(1, 'refresh_token is required'),
});

router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { data, error } = await supabaseAuth.auth.refreshSession({
      refresh_token: parsed.data.refresh_token,
    });

    if (error || !data?.session) {
      logger.warn({ error: error?.message }, '[Auth] Refresh session failed');
      throw new ValidationError('Invalid or expired refresh token');
    }

    const normalizedEmail = (data.session.user?.email || '').trim().toLowerCase();
    if (normalizedEmail && !isAllowedFixedAccountEmail(normalizedEmail)) {
      throw new AuthorizationError('Conta nao autorizada');
    }

    res.json({ success: true, data: { session: data.session } });
  })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const userId = req.user.id;

    // Get profile
    const { data: profile } = await req
      .supabase.from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get workspaces
    const { data: memberships } = await req
      .supabase.from('workspace_members')
      .select(
        `
        role,
        workspace:workspaces (
          id,
          name,
          slug,
          description
        )
      `
      )
      .eq('user_id', userId);

    const membershipsList = (memberships as any[]) || [];

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: req.user.email,
          ...(profile || {}),
        },
        workspaces: membershipsList.map((m) => ({
          ...(m.workspace || {}),
          role: m.role,
        })),
      },
    });
  })
);

/**
 * PATCH /api/auth/me
 * Update current user profile (display_name, avatar_url, color, preferences)
 */
const updateProfileSchema = z.object({
  display_name: z.string().trim().max(100).optional(),
  avatar_url: z
    .union([
      z.null(),
      z.string().min(0).max(0), // Empty string
      z.string().min(1).max(100000), // Any string up to 100KB (reasonable limit for data URLs)
    ])
    .refine((val) => {
      if (val === null || val === '') return true;
      return true;
    }, 'Avatar URL should be valid')
    .optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  preferences: z.record(z.unknown()).optional(),
});

router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const userId = req.user.id;

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { display_name, avatar_url, color, preferences } = parsed.data;

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) {
      const trimmedName = display_name?.trim();
      if (trimmedName && trimmedName.length > 0) {
        updateData.display_name = trimmedName;
      } else {
        updateData.display_name = null;
      }
    }

    if (avatar_url !== undefined) {
      if (!avatar_url || avatar_url === '') {
        updateData.avatar_url = null;
      } else {
        updateData.avatar_url = avatar_url;
        logger.debug({ userId, avatarLength: avatar_url.length }, 'Storing avatar URL');
      }
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }

    const logData = { ...updateData };
    if (logData.avatar_url?.startsWith('data:')) {
      logData.avatar_url = `[data URL - ${logData.avatar_url.length} chars]`;
    }
    logger.debug({ userId, updateData: logData }, 'Updating profile');

    const { data: updatedProfile, error: updateError } = await req
      .supabase.from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      logger.error({ error: updateError?.message, userId }, 'Failed to update profile');
      throw new ValidationError('Failed to update profile');
    }

    logger.info({ userId, updated: Object.keys(updateData) }, 'Profile updated successfully');

    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: req.user.email,
          display_name: updatedProfile.display_name,
          avatar_url: updatedProfile.avatar_url,
          color: updatedProfile.color,
          created_at: updatedProfile.created_at,
          updated_at: updatedProfile.updated_at,
        },
      },
    });
  })
);

export default router;
