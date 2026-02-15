import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin, supabaseClient } from '../services/supabase';
import { env } from '../utils/env';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';
import { getFixedAccountByEmail, isAllowedFixedAccountEmail } from '../auth/fixedAccounts';

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
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      logger.warn({ error: error?.message }, 'Token verification failed');
      throw new AuthenticationError('Invalid or expired token');
    }

    const normalizedEmail = (user.email || '').trim().toLowerCase();
    if (!isAllowedFixedAccountEmail(normalizedEmail)) {
      logger.warn({ userId: user.id, email: normalizedEmail }, 'Blocked non-fixed account login');
      throw new AuthorizationError('Conta nao autorizada');
    }

    const fixedAccount = getFixedAccountByEmail(normalizedEmail);
    const fixedName =
      fixedAccount?.displayName ||
      (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
      'User';
    const fixedColor =
      fixedAccount?.color || (user.user_metadata && (user.user_metadata.color as string)) || '#00D9FF';
    const fixedWorkspaceRole = fixedAccount?.workspaceRole || 'member';

    // Ensure profile exists for authenticated users
    await ensureProfileAndMembership(
      user.id,
      normalizedEmail,
      fixedName,
      fixedColor,
      fixedWorkspaceRole
    );

    // Attach user to request
    req.user = {
      id: user.id,
      email: normalizedEmail,
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
  color: string,
  workspaceRole: 'owner' | 'editor' | 'viewer' | 'admin' | 'member' = 'member'
): Promise<void> {
  const normalizedEmail = (email || '').trim().toLowerCase();

  let emailToUse = normalizedEmail;
  if (!emailToUse || emailToUse === 'guest@mindmap.local') {
    emailToUse = `${profileId}@profile.local`;
  } else {
    const { data: existingByEmail } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', emailToUse)
      .maybeSingle();

    if (existingByEmail && existingByEmail.id !== profileId) {
      emailToUse = `${profileId}@profile.local`;
    }
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .single();

  if (!profile) {
    const { error: insertError } = await supabaseAdmin.from('profiles').insert({
      id: profileId,
      email: emailToUse,
      display_name: name,
      color,
    });

    if (insertError?.code === '23505') {
      // Email conflict — retry with unique email based on profileId
      await supabaseAdmin.from('profiles').insert({
        id: profileId,
        email: `${profileId}@profile.local`,
        display_name: name,
        color,
      });
    }
  }

  const { data: membership } = await supabaseAdmin
    .from('workspace_members')
    .select('id, role')
    .eq('workspace_id', env.DEFAULT_WORKSPACE_ID)
    .eq('user_id', profileId)
    .maybeSingle();

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
      role: workspaceRole,
    });
  } else if (String(membership.role) !== workspaceRole) {
    // Keep membership role aligned with fixed account configuration.
    await supabaseAdmin.from('workspace_members').update({ role: workspaceRole }).eq('id', membership.id);
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

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token);

    if (!error && user) {
      const normalizedEmail = (user.email || '').trim().toLowerCase();
      if (!isAllowedFixedAccountEmail(normalizedEmail)) {
        return next();
      }

      req.user = {
        id: user.id,
        email: normalizedEmail,
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
      const { data: membership, error } = await req
        .supabase.from('workspace_members')
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

      const { data: membership, error } = await req
        .supabase.from('workspace_members')
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

      const { data: membership, error } = await req
        .supabase.from('workspace_members')
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

/**
 * Platform/system admin guard for sensitive operational endpoints.
 * Uses the default workspace as control plane membership source.
 */
export const requireSystemAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AuthenticationError();
    }

    const { data: membership, error } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', env.DEFAULT_WORKSPACE_ID)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      logger.error(
        { userId: req.user.id, workspaceId: env.DEFAULT_WORKSPACE_ID, error: error.message },
        'Failed to verify system admin membership'
      );
      throw new AuthorizationError('Admin access required');
    }

    if (!membership || !['admin', 'owner'].includes(String(membership.role))) {
      throw new AuthorizationError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};
