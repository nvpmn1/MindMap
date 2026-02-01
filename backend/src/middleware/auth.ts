import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, supabaseClient } from '../services/supabase';
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
