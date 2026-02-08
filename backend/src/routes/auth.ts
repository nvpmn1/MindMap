import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../services/supabase';
import { asyncHandler, authenticate } from '../middleware';
import { ValidationError, NotFoundError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../utils/env';

const router = Router();

// Validation schemas
const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  token: z.string().min(6, 'Token must be at least 6 characters'),
  type: z.enum(['magiclink', 'email']).default('magiclink'),
});

const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token required'),
});

/**
 * POST /api/auth/magic-link
 * Send magic link to email
 */
router.post(
  '/magic-link',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = magicLinkSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { email } = parsed.data;

    // Check if email is in allowed list (for private beta)
    const allowedEmails = [
      'guilherme@mindlab.com',
      'helen@mindlab.com',
      'pablo@mindlab.com',
      // Add more as needed
    ];

    // In production, you might want to check against a database table instead
    const isAllowed = env.NODE_ENV === 'development' || 
      allowedEmails.some(allowed => email.toLowerCase().includes(allowed.split('@')[0]));

    if (!isAllowed) {
      logger.warn({ email }, 'Unauthorized email attempted login');
      // Return success anyway to prevent email enumeration
      return res.json({
        success: true,
        message: 'If this email is registered, a magic link has been sent',
      });
    }

    // Send magic link
    const { error } = await supabaseAdmin.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${env.FRONTEND_URL}/auth/callback`,
      },
    });

    if (error) {
      logger.error({ error: error.message, email }, 'Failed to send magic link');
      throw new ValidationError('Failed to send magic link. Please try again.');
    }

    logger.info({ email }, 'Magic link sent');

    res.json({
      success: true,
      message: 'Magic link sent to your email',
    });
  })
);

/**
 * POST /api/auth/verify
 * Verify OTP token from magic link
 */
router.post(
  '/verify',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { email, token, type } = parsed.data;

    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      email,
      token,
      type: type as 'magiclink' | 'email',
    });

    if (error || !data.session) {
      logger.warn({ email, error: error?.message }, 'OTP verification failed');
      throw new ValidationError('Invalid or expired token');
    }

    // Ensure profile exists
    await ensureProfile(data.user!.id, email);

    logger.info({ userId: data.user!.id, email }, 'User verified and logged in');

    res.json({
      success: true,
      data: {
        user: {
          id: data.user!.id,
          email: data.user!.email,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const parsed = refreshTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { refresh_token } = parsed.data;

    const { data, error } = await supabaseAdmin.auth.refreshSession({
      refresh_token,
    });

    if (error || !data.session) {
      logger.warn({ error: error?.message }, 'Token refresh failed');
      throw new ValidationError('Invalid or expired refresh token');
    }

    res.json({
      success: true,
      data: {
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      },
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout user (invalidate session)
 */
router.post(
  '/logout',
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      // Get user from token
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      
      if (user) {
        // Sign out the user
        await supabaseAdmin.auth.admin.signOut(token);
        logger.info({ userId: user.id }, 'User logged out');
      }
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
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
    const { data: profile } = await req.supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Get workspaces
    const { data: memberships } = await req.supabase!
      .from('workspace_members')
      .select(`
        role,
        workspace:workspaces (
          id,
          name,
          slug,
          description
        )
      `)
      .eq('user_id', userId);

    const userProfile = profile as any;
    const membershipsList = memberships as any[] || [];
    
    res.json({
      success: true,
      data: {
        user: {
          id: userId,
          email: req.user.email,
          ...(userProfile || {}),
        },
        workspaces: membershipsList.map(m => ({
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
  // Accept data URLs (from local canvas) or regular URLs - be strict about validity
  avatar_url: z.union([
    z.null(),
    z.string().min(0).max(0), // Empty string treated as null
    z.string().min(20) // Minimum length for valid data URL or HTTP URL
  ])
    .refine(val => {
      if (!val || val === '') return true;
      // Accept data URLs or HTTP(S) URLs with proper validation
      const isValidDataUrl = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(val);
      const isValidHttpUrl = val.startsWith('http://') || val.startsWith('https://');
      return isValidDataUrl || isValidHttpUrl;
    }, 'Avatar must be a valid data URL (base64) or HTTP(S) URL')
    .optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
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

    // Validate input
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.errors[0].message);
    }

    const { display_name, avatar_url, color, preferences } = parsed.data;

    // Build update data with strict validation
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (display_name !== undefined) {
      const trimmedName = display_name?.trim();
      if (trimmedName && trimmedName.length > 0) {
        updateData.display_name = trimmedName;
      } else if (display_name !== undefined) {
        updateData.display_name = null;
      }
    }

    // Enhanced avatar handling with validation
    if (avatar_url !== undefined) {
      if (!avatar_url || avatar_url === '') {
        updateData.avatar_url = null;
      } else {
        // Validate avatar URL format
        const isValidDataUrl = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(avatar_url);
        const isValidHttpUrl = avatar_url.startsWith('http://') || avatar_url.startsWith('https://');
        
        if (isValidDataUrl || isValidHttpUrl) {
          updateData.avatar_url = avatar_url;
          logger.debug({ userId, avatarLength: avatar_url.length }, 'Storing avatar URL');
        } else {
          throw new ValidationError('Invalid avatar URL format');
        }
      }
    }

    if (color !== undefined) {
      updateData.color = color;
    }

    if (preferences !== undefined) {
      updateData.preferences = preferences;
    }

    // Log the update data (without full avatar if it's a data URL)
    const logData = { ...updateData };
    if (logData.avatar_url?.startsWith('data:')) {
      logData.avatar_url = `[data URL - ${logData.avatar_url.length} chars]`;
    }
    logger.debug({ userId, updateData: logData }, 'Updating profile');

    // Update profile using authenticated supabase client
    const { data: updatedProfile, error: updateError } = await req.supabase!
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (updateError || !updatedProfile) {
      logger.error({ error: updateError?.message, userId }, 'Failed to update profile');
      throw new ValidationError('Failed to update profile');
    }

    logger.info({ userId, updated: Object.keys(updateData) }, 'Profile updated successfully');

    // Prepare response - validate avatar before returning
    const responseProfile = {
      user: {
        id: userId,
        email: req.user.email,
        display_name: updatedProfile.display_name,
        avatar_url: updatedProfile.avatar_url, // Safe to return as is
        color: updatedProfile.color,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      },
    };

    res.json({
      success: true,
      data: responseProfile,
    });
  })
);

/**
 * Helper: Ensure user profile exists
 */
async function ensureProfile(userId: string, email: string): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existing) {
    // Create profile
    const displayName = email.split('@')[0];
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const profileData: any = {
      id: userId,
      email,
      display_name: displayName,
      color,
      preferences: {},
    };
    
    await supabaseAdmin.from('profiles').insert(profileData);

    logger.info({ userId, email }, 'Created new user profile');

    // Add to default workspace (MindLab)
    const defaultWorkspaceId = '11111111-1111-1111-1111-111111111111';
    
    const memberData: any = {
      workspace_id: defaultWorkspaceId,
      user_id: userId,
      role: 'member',
    };
    
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert(memberData);

    if (!memberError) {
      logger.info({ userId, workspaceId: defaultWorkspaceId }, 'Added user to default workspace');
    }
  }
}

export default router;
