import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, supabaseClient } from '../services/supabase';
import { env } from '../utils/env';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      supabase?: ReturnType<typeof supabaseClient>;
    }
  }
}

/**
 * Middleware to verify JWT token from Supabase Auth
 * Extracts user info and attaches to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (env.ALLOW_PROFILE_AUTH) {
        const profileId = req.headers['x-profile-id'] as string | undefined;
        const profileEmail = (req.headers['x-profile-email'] as string | undefined) || '';
        const profileName = (req.headers['x-profile-name'] as string | undefined) || 'Guest';
        const profileColor = (req.headers['x-profile-color'] as string | undefined) || '#00D9FF';

        if (profileId) {
          await ensureProfileAndMembership(profileId, profileEmail, profileName, profileColor);

          req.user = {
            id: profileId,
            email: profileEmail,
            role: 'profile',
          };

          req.supabase = supabaseAdmin;
          logger.debug({ userId: profileId }, 'Authenticated via profile header');
          return next();
        }
      }

      throw new AuthenticationError('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError('Token not provided');
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn({ error: error?.message }, 'Token verification failed');
      throw new AuthenticationError('Invalid or expired token');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: user.role || 'authenticated',
    };

    // Create a Supabase client with the user's token for RLS
    req.supabase = supabaseClient(token);

    logger.debug({ userId: user.id }, 'User authenticated');
    next();
  } catch (error) {
    next(error);
  }
};

async function ensureProfileAndMembership(
  profileId: string,
  email: string,
  name: string,
  color: string
): Promise<void> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .single();

  if (!profile) {
    await supabaseAdmin.from('profiles').insert({
      id: profileId,
      email: email || `${profileId}@profile.local`,
      display_name: name,
      color,
    });
  }

  const { data: membership } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id')
    .eq('workspace_id', env.DEFAULT_WORKSPACE_ID)
    .eq('user_id', profileId)
    .single();

  if (!membership) {
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id')
      .eq('id', env.DEFAULT_WORKSPACE_ID)
      .single();

    if (!workspace) {
      await supabaseAdmin.from('workspaces').insert({
        id: env.DEFAULT_WORKSPACE_ID,
        name: 'MindLab',
        slug: 'mindlab',
        description: 'Workspace padrão',
      });
    }

    await supabaseAdmin.from('workspace_members').insert({
      workspace_id: env.DEFAULT_WORKSPACE_ID,
      user_id: profileId,
      role: 'admin',
    });
  }
}

/**
 * Middleware to optionally authenticate user
 * Doesn't throw if no token, just continues without user
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      req.user = {
        id: user.id,
        email: user.email || '',
        role: user.role || 'authenticated',
      };
      req.supabase = supabaseClient(token);
    }

    next();
  } catch {
    // Silently continue without authentication
    next();
  }
};

/**
 * Check if user is member of a workspace
 */
export const requireWorkspaceMember = (workspaceIdParam: string = 'workspaceId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const workspaceId = req.params[workspaceIdParam] || req.body.workspace_id;

      if (!workspaceId) {
        throw new AuthorizationError('Workspace ID required');
      }

      // Check membership using RLS-enabled client
      const { data: membership, error } = await req.supabase!
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !membership) {
        throw new AuthorizationError('Not a member of this workspace');
      }

      // Attach workspace role to user
      (req.user as any).workspaceRole = membership.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user can edit in workspace (admin or member)
 */
export const requireWorkspaceEditor = (workspaceIdParam: string = 'workspaceId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const workspaceId = req.params[workspaceIdParam] || req.body.workspace_id;

      if (!workspaceId) {
        throw new AuthorizationError('Workspace ID required');
      }

      const { data: membership, error } = await req.supabase!
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !membership) {
        throw new AuthorizationError('Not a member of this workspace');
      }

      // Only viewers are restricted
      if (membership.role === 'viewer') {
        throw new AuthorizationError('Viewers cannot edit');
      }

      (req.user as any).workspaceRole = membership.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is admin of workspace
 */
export const requireWorkspaceAdmin = (workspaceIdParam: string = 'workspaceId') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }

      const workspaceId = req.params[workspaceIdParam] || req.body.workspace_id;

      if (!workspaceId) {
        throw new AuthorizationError('Workspace ID required');
      }

      const { data: membership, error } = await req.supabase!
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !membership) {
        throw new AuthorizationError('Not a member of this workspace');
      }

      if (membership.role !== 'admin') {
        throw new AuthorizationError('Admin access required');
      }

      (req.user as any).workspaceRole = membership.role;

      next();
    } catch (error) {
      next(error);
    }
  };
};
