import { create } from 'zustand';
import { authApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value?: string | null) => !!value && UUID_REGEX.test(value);
const generateUuid = () =>
  globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`;

// Demo-only: profile-based login without Supabase Auth.
// Keep this disabled in production.
const ENABLE_PROFILE_LOGIN = import.meta.env.VITE_ENABLE_PROFILE_LOGIN === 'true';

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
  role: 'admin',
};

interface AuthState {
  user: User | null;
  profile: Profile | null;
  workspaces: Workspace[];
  isAuthenticated: boolean;
  isLoading: boolean;

  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setFromMe: (payload: { user: any; workspaces?: any[] }) => void;

  updateProfile: (data: { display_name?: string; avatar_url?: string | null; avatar_id?: string }) => Promise<void>;

  initialize: () => void;
  loginWithProfile: (profile: Omit<Profile, 'preferences'>) => void;
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
    color: String(user.color || '#00D9FF'),
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

  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  setFromMe: (payload) => {
    const normalized = normalizeMePayload(payload);

    set({
      user: normalized.user,
      profile: normalized.profile,
      workspaces: normalized.workspaces,
      isAuthenticated: true,
      isLoading: false,
    });

    // Persist minimal identity for UI; tokens remain managed by Supabase storage.
    localStorage.setItem('mindmap_auth_user', JSON.stringify(normalized.user));
    localStorage.setItem('mindmap_auth_profile', JSON.stringify(normalized.profile));
  },

  updateProfile: async (data) => {
    const state = get();
    if (!state.user) throw new Error('No user logged in');

    // Update in backend; if backend is temporarily unavailable, we keep UI consistent
    // by persisting local changes as a fallback.
    try {
      const response = await authApi.updateProfile({
        display_name: data.display_name,
        avatar_url: data.avatar_url,
      });

      if (!response.success || !response.data) {
        throw new Error('Failed to update profile on server');
      }

      const updatedUserFromResponse = (response.data as any).user || response.data;

      const updatedUser: User = {
        ...state.user,
        display_name: updatedUserFromResponse.display_name || state.user.display_name,
        avatar_url:
          updatedUserFromResponse.avatar_url !== undefined
            ? updatedUserFromResponse.avatar_url
            : state.user.avatar_url,
      };

      const updatedProfile: Profile | null = state.profile
        ? {
            ...state.profile,
            display_name: updatedUser.display_name,
            avatar_url: updatedUser.avatar_url,
          }
        : null;

      set({ user: updatedUser, profile: updatedProfile });

      localStorage.setItem('mindmap_auth_user', JSON.stringify(updatedUser));
      if (updatedProfile) localStorage.setItem('mindmap_auth_profile', JSON.stringify(updatedProfile));
    } catch {
      const fallbackUser: User = {
        ...state.user,
        ...(data.display_name !== undefined ? { display_name: data.display_name } : {}),
        ...(data.avatar_url !== undefined
          ? { avatar_url: data.avatar_url === null ? null : data.avatar_url }
          : {}),
      };

      const fallbackProfile: Profile | null = state.profile
        ? {
            ...state.profile,
            ...(data.display_name !== undefined ? { display_name: data.display_name } : {}),
            ...(data.avatar_url !== undefined
              ? { avatar_url: data.avatar_url === null ? null : data.avatar_url }
              : {}),
          }
        : null;

      set({ user: fallbackUser, profile: fallbackProfile });
      localStorage.setItem('mindmap_auth_user', JSON.stringify(fallbackUser));
      localStorage.setItem('mindmap_auth_profile', JSON.stringify(fallbackProfile));
    }
  },

  initialize: () => {
    set({ isLoading: true });

    (async () => {
      try {
        // Prefer real Supabase session (production)
        const { data, error } = await supabase.auth.getSession();
        if (!error && data?.session) {
          const me = await authApi.getMe();
          if (me.success && (me.data as any)?.user) {
            get().setFromMe(me.data as any);
            return;
          }

          await supabase.auth.signOut();
        }

        // Demo: restore local profile sessions only when explicitly enabled
        if (ENABLE_PROFILE_LOGIN) {
          const savedUser = localStorage.getItem('mindmap_auth_user');
          const savedProfile = localStorage.getItem('mindmap_auth_profile');

          if (savedUser && savedProfile) {
            try {
              const user = JSON.parse(savedUser) as User;
              const profile = JSON.parse(savedProfile) as Profile;

              if (!user.id || !user.email) throw new Error('Invalid user data');
              if (!isUuid(user.id) || !isUuid(profile.id)) throw new Error('Non-UUID id');

              set({
                user,
                profile,
                isAuthenticated: true,
                isLoading: false,
                workspaces: [DEFAULT_WORKSPACE],
              });
              return;
            } catch {
              localStorage.removeItem('mindmap_auth_user');
              localStorage.removeItem('mindmap_auth_profile');
            }
          }
        }

        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          workspaces: [],
        });
      } catch {
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          isLoading: false,
          workspaces: [],
        });
      }
    })();
  },

  loginWithProfile: (profileData) => {
    if (!ENABLE_PROFILE_LOGIN) {
      throw new Error('Profile login is disabled in this environment');
    }

    const safeId = isUuid(profileData.id) ? profileData.id : generateUuid();

    const profile: Profile = {
      id: safeId,
      email: profileData.email,
      display_name: profileData.display_name || profileData.email.split('@')[0],
      avatar_url: profileData.avatar_url,
      avatar_id: profileData.avatar_id,
      color: profileData.color,
    };

    const user: User = {
      id: safeId,
      email: profileData.email,
      display_name: profile.display_name || profileData.email.split('@')[0],
      avatar_url: profile.avatar_url,
      avatar_id: profile.avatar_id,
      color: profile.color,
    };

    set({
      user,
      profile,
      workspaces: [DEFAULT_WORKSPACE],
      isAuthenticated: true,
      isLoading: false,
    });

    localStorage.setItem('mindmap_auth_user', JSON.stringify(user));
    localStorage.setItem('mindmap_auth_profile', JSON.stringify(profile));
  },

  signOut: () => {
    supabase.auth.signOut().catch(() => {});

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

// DO NOT auto-initialize here - App.tsx will handle it

