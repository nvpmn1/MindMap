import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../services/supabase';
import { asyncHandler } from '../middleware';
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
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ValidationError('Authorization header required');
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      throw new NotFoundError('User not found');
    }

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get workspaces
    const { data: memberships } = await supabaseAdmin
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
      .eq('user_id', user.id);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          ...profile,
        },
        workspaces: memberships?.map(m => ({
          ...m.workspace,
          role: m.role,
        })) || [],
      },
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
