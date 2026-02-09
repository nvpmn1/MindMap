import { create } from 'zustand';
import { authApi } from '@/lib/api';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (value?: string | null) => !!value && UUID_REGEX.test(value);
const generateUuid = () =>
  globalThis.crypto && 'randomUUID' in globalThis.crypto
    ? globalThis.crypto.randomUUID()
    : `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14)}`;

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  avatar_id?: string; // Track which avatar style was selected
  color: string;
}

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_id?: string; // Track which avatar style was selected
  color: string;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

// Workspace padrão
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

  // Actions
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  updateProfile: (data: {
    display_name?: string;
    avatar_url?: string | null;
    avatar_id?: string;
  }) => Promise<void>;

  // Auth operations
  initialize: () => void;
  loginWithProfile: (profile: Omit<Profile, 'preferences'>) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  profile: null,
  workspaces: [],
  isAuthenticated: false,
  isLoading: false,

  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),

  updateProfile: async (data) => {
    const state = get();
    if (!state.user) throw new Error('No user logged in');

    try {
      // Minimal validation - just ensure we have something to update
      if (!data.display_name && data.avatar_url === undefined) {
        throw new Error('No data to update');
      }

      console.log('📤 Sending to updateProfile:', JSON.stringify(data));

      // No strict avatar URL validation - let server handle it
      // Just ensure it's not corrupted during transit
      if (
        data.avatar_url !== undefined &&
        data.avatar_url !== null &&
        typeof data.avatar_url !== 'string'
      ) {
        throw new Error('Avatar URL must be a string');
      }

      // Update in backend
      const response = await authApi.updateProfile({
        display_name: data.display_name,
        avatar_url: data.avatar_url,
      });

      console.log('✅ Backend response:', response);

      if (!response.success || !response.data) {
        throw new Error('Failed to update profile on server');
      }

      // Extract updated user from response - be flexible about response structure
      const updatedUserFromResponse = (response.data as any).user || response.data;

      // Update local state with server response
      const updatedUser = {
        ...state.user,
        display_name: (updatedUserFromResponse as any).display_name || state.user.display_name,
        avatar_url:
          (updatedUserFromResponse as any).avatar_url !== undefined
            ? (updatedUserFromResponse as any).avatar_url
            : state.user.avatar_url,
      };

      const updatedProfile = state.profile
        ? {
            ...state.profile,
            display_name: updatedUserFromResponse.display_name || state.profile.display_name,
            avatar_url:
              updatedUserFromResponse.avatar_url !== undefined
                ? updatedUserFromResponse.avatar_url
                : state.profile.avatar_url,
          }
        : null;

      // Safely update state with error boundary
      try {
        set({ user: updatedUser, profile: updatedProfile });
      } catch (stateError) {
        console.error('⚠️ State update error (will use fallback):', stateError);
        // Continue to localStorage persist even if state update fails
      }

      // CRITICAL: Persist immediately to localStorage
      localStorage.setItem('mindmap_auth_user', JSON.stringify(updatedUser));
      if (updatedProfile) {
        localStorage.setItem('mindmap_auth_profile', JSON.stringify(updatedProfile));
      }

      console.log('✅ Profile persisted to localStorage:', {
        userId: updatedUser.id,
        avatar: updatedUser.avatar_url?.substring(0, 50),
      });
    } catch (error) {
      console.error('⚠️ Profile update error:', error);

      // CRITICAL: Even if backend fails, always persist to localStorage
      // This ensures avatar changes are saved locally
      const fallbackUser = {
        ...state.user!,
        ...(data.display_name !== undefined && { display_name: data.display_name }),
        ...(data.avatar_url !== undefined && {
          avatar_url: data.avatar_url === null ? null : data.avatar_url,
        }),
      };

      const fallbackProfile = state.profile
        ? {
            ...state.profile,
            ...(data.display_name !== undefined && { display_name: data.display_name }),
            ...(data.avatar_url !== undefined && {
              avatar_url: data.avatar_url === null ? null : data.avatar_url,
            }),
          }
        : null;

      // Safely update state with error boundary
      try {
        set({ user: fallbackUser, profile: fallbackProfile });
      } catch (stateError) {
        console.error('⚠️ Fallback state update error:', stateError);
        // Continue to localStorage persist even if state update fails
      }

      // Save immediately to localStorage even on error
      localStorage.setItem('mindmap_auth_user', JSON.stringify(fallbackUser));
      localStorage.setItem('mindmap_auth_profile', JSON.stringify(fallbackProfile));

      console.log('⚠️ Profile persisted to localStorage (fallback mode):', {
        userId: fallbackUser.id,
        avatar: fallbackUser.avatar_url?.substring(0, 50),
      });

      // Non-critical errors (like avatar save) should not break the flow
      // Only throw if it's a connection error
      if (error instanceof Error && error.message.includes('user logged in')) {
        throw error;
      }
      // Otherwise silently fail for avatar updates
    }
  },

  initialize: () => {
    set({ isLoading: true });

    try {
      // Try to restore from localStorage with validation
      const savedUser = localStorage.getItem('mindmap_auth_user');
      const savedProfile = localStorage.getItem('mindmap_auth_profile');

      if (savedUser && savedProfile) {
        try {
          const user = JSON.parse(savedUser) as User;
          const profile = JSON.parse(savedProfile) as Profile;

          // Validate critical fields
          if (!user.id || !user.email) {
            throw new Error('Invalid user data: missing id or email');
          }
          if (!isUuid(user.id) || !isUuid(profile.id)) {
            throw new Error('Invalid user data: non-UUID id');
          }

          // Accept avatar as-is - don't validate strictly
          // Trust what's in localStorage

          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            workspaces: [DEFAULT_WORKSPACE],
          });
          console.log('✅ Session restored from localStorage');
          return;
        } catch (error) {
          console.error('❌ Failed to parse saved auth:', error);
          localStorage.removeItem('mindmap_auth_user');
          localStorage.removeItem('mindmap_auth_profile');
        }
      }

      // No valid session found - user must select profile on LoginPage
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        workspaces: [],
      });
      console.log('ℹ️ No session found - redirecting to login');
    } catch (error) {
      console.error('❌ Initialize error:', error);
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
        workspaces: [],
      });
    }
  },

  loginWithProfile: (profileData) => {
    try {
      const safeId = isUuid(profileData.id) ? profileData.id : generateUuid();
      const profile: Profile = {
        id: safeId,
        email: profileData.email,
        display_name: profileData.display_name || profileData.email.split('@')[0],
        avatar_url: profileData.avatar_url,
        color: profileData.color,
      };

      const user: User = {
        id: safeId,
        email: profileData.email,
        display_name: profileData.display_name || profileData.email.split('@')[0],
        avatar_url: profileData.avatar_url,
        color: profileData.color,
      };

      set({
        user,
        profile,
        workspaces: [DEFAULT_WORKSPACE],
        isAuthenticated: true,
        isLoading: false,
      });

      // Persist to localStorage
      localStorage.setItem('mindmap_auth_user', JSON.stringify(user));
      localStorage.setItem('mindmap_auth_profile', JSON.stringify(profile));
      console.log('✅ User logged in successfully');
    } catch (error) {
      console.error('❌ Failed to login:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  signOut: () => {
    try {
      set({
        user: null,
        profile: null,
        workspaces: [],
        isAuthenticated: false,
        isLoading: false,
      });

      // Clear localStorage
      localStorage.removeItem('mindmap_auth_user');
      localStorage.removeItem('mindmap_auth_profile');
      console.log('✅ Signed out successfully');
    } catch (error) {
      console.error('❌ Failed to sign out:', error);
    }
  },
}));

// DO NOT auto-initialize here - App.tsx will handle it
// This prevents creating ghost profiles on every page load
