import { create } from 'zustand';
import { api, authApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  avatar_id?: string;
  color: string;
}

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_id?: string;
  color: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

const DEFAULT_WORKSPACE: Workspace = {
  id: '11111111-1111-1111-1111-111111111111',
  name: 'MindLab',
  slug: 'mindlab',
  role: 'member',
};

interface AuthState {
  user: User | null;
  profile: Profile | null;
  workspaces: Workspace[];
  isAuthenticated: boolean;
  isLoading: boolean;

  setFromMe: (payload: { user: any; workspaces?: any[] }) => void;
  updateProfile: (data: { display_name?: string; avatar_url?: string | null }) => Promise<void>;
  initialize: () => void;
  signOut: () => void;
}

function normalizeMePayload(payload: { user: any; workspaces?: any[] }): {
  user: User;
  profile: Profile;
  workspaces: Workspace[];
} {
  const { user, workspaces } = payload || ({} as any);
  if (!user?.id || !user?.email) {
    throw new Error('Invalid /api/auth/me payload');
  }

  const normalizedUser: User = {
    id: String(user.id),
    email: String(user.email),
    display_name: String(user.display_name || String(user.email).split('@')[0] || 'User'),
    avatar_url: user.avatar_url ?? null,
    color: String(user.color || '#06E5FF'),
    avatar_id: user.avatar_id,
  };

  const normalizedProfile: Profile = {
    id: normalizedUser.id,
    email: normalizedUser.email,
    display_name: normalizedUser.display_name,
    avatar_url: normalizedUser.avatar_url,
    color: normalizedUser.color,
    avatar_id: normalizedUser.avatar_id,
  };

  const ws: Workspace[] = (workspaces || [])
    .filter((w) => w && w.id)
    .map((w) => ({
      id: String(w.id),
      name: String(w.name || 'Workspace'),
      slug: String(w.slug || ''),
      role: String(w.role || 'member'),
    }));

  return {
    user: normalizedUser,
    profile: normalizedProfile,
    workspaces: ws.length > 0 ? ws : [DEFAULT_WORKSPACE],
  };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  workspaces: [],
  isAuthenticated: false,
  isLoading: false,

  setFromMe: (payload) => {
    const normalized = normalizeMePayload(payload);

    set({
      user: normalized.user,
      profile: normalized.profile,
      workspaces: normalized.workspaces,
      isAuthenticated: true,
      isLoading: false,
    });

    localStorage.setItem('mindmap_auth_user', JSON.stringify(normalized.user));
    localStorage.setItem('mindmap_auth_profile', JSON.stringify(normalized.profile));
  },

  updateProfile: async (data) => {
    const state = get();
    if (!state.user) throw new Error('No user logged in');

    const response = await authApi.updateProfile({
      display_name: data.display_name,
      avatar_url: data.avatar_url,
    });

    if (!response.success || !response.data) {
      throw new Error((response as any)?.error?.message || 'Failed to update profile');
    }

    const updatedUserFromResponse = (response.data as any).user || response.data;

    const updatedUser: User = {
      ...state.user,
      display_name: updatedUserFromResponse.display_name || state.user.display_name,
      avatar_url:
        updatedUserFromResponse.avatar_url !== undefined
          ? updatedUserFromResponse.avatar_url
          : state.user.avatar_url,
      color: updatedUserFromResponse.color || state.user.color,
    };

    const updatedProfile: Profile | null = state.profile
      ? {
          ...state.profile,
          display_name: updatedUser.display_name,
          avatar_url: updatedUser.avatar_url,
          color: updatedUser.color,
        }
      : null;

    set({ user: updatedUser, profile: updatedProfile });

    localStorage.setItem('mindmap_auth_user', JSON.stringify(updatedUser));
    if (updatedProfile) localStorage.setItem('mindmap_auth_profile', JSON.stringify(updatedProfile));
  },

  initialize: () => {
    set({ isLoading: true });

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) {
          const me = await authApi.getMe();
          if (me.success && (me.data as any)?.user) {
            get().setFromMe(me.data as any);
            return;
          }

          // Session exists but backend rejected or failed.
          await supabase.auth.signOut();
          api.clearCache();
        }

        set({
          user: null,
          profile: null,
          workspaces: [],
          isAuthenticated: false,
          isLoading: false,
        });
      } catch {
        set({
          user: null,
          profile: null,
          workspaces: [],
          isAuthenticated: false,
          isLoading: false,
        });
      }
    })();
  },

  signOut: () => {
    supabase.auth.signOut().catch(() => {});
    api.clearCache();

    set({
      user: null,
      profile: null,
      workspaces: [],
      isAuthenticated: false,
      isLoading: false,
    });

    localStorage.removeItem('mindmap_auth_user');
    localStorage.removeItem('mindmap_auth_profile');
  },
}));
