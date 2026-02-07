import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  color: string;
}

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
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
  updateProfile: (data: { display_name?: string; avatar_url?: string | null }) => Promise<void>;
  
  // Auth operations
  initialize: () => void;
  loginWithProfile: (profile: Omit<Profile, 'preferences'>) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  (set, get) => ({
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
        // Validar dados
        if (!data.display_name && !data.avatar_url) {
          throw new Error('No data to update');
        }

        // Update in backend
        const response = await authApi.updateProfile({
          display_name: data.display_name,
          avatar_url: data.avatar_url,
        });

        if (!response.success || !response.data) {
          throw new Error('Failed to update profile on server');
        }

        // Update local state with server response
        const updatedUser = {
          ...state.user,
          ...(data.display_name && { display_name: data.display_name }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url === null ? null : (data.avatar_url || state.user.avatar_url) }),
        };
        
        const updatedProfile = state.profile ? {
          ...state.profile,
          ...(data.display_name && { display_name: data.display_name }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url === null ? null : (data.avatar_url || state.profile.avatar_url) }),
        } : null;
        
        set({ user: updatedUser, profile: updatedProfile });

        // Persist immediatamente to localStorage
        localStorage.setItem('mindmap_auth_user', JSON.stringify(updatedUser));
        localStorage.setItem('mindmap_auth_profile', JSON.stringify(updatedProfile));

      } catch (error) {
        // Fallback: update locally and persist to localStorage immediately
        
        const fallbackUser = {
          ...state.user!,
          ...(data.display_name && { display_name: data.display_name }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url === null ? null : (data.avatar_url || state.user!.avatar_url) }),
        };
        
        const fallbackProfile = state.profile ? {
          ...state.profile,
          ...(data.display_name && { display_name: data.display_name }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url === null ? null : (data.avatar_url || state.profile.avatar_url) }),
        } : null;
        
        set({ user: fallbackUser, profile: fallbackProfile });

        // Save imediatamente to localStorage
        localStorage.setItem('mindmap_auth_user', JSON.stringify(fallbackUser));
        localStorage.setItem('mindmap_auth_profile', JSON.stringify(fallbackProfile));

        throw error;
      }
    },

    initialize: () => {
      // Try to restore from localStorage
      const savedUser = localStorage.getItem('mindmap_auth_user');
      const savedProfile = localStorage.getItem('mindmap_auth_profile');

      if (savedUser && savedProfile) {
        try {
          const user = JSON.parse(savedUser) as User;
          const profile = JSON.parse(savedProfile) as Profile;
          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Corrupted localStorage — reset
          set({ isLoading: false });
        }
      } else {
        set({ isLoading: false });
      }
    },

    loginWithProfile: (profileData) => {
      const profile: Profile = {
        id: profileData.id,
        email: profileData.email,
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        color: profileData.color,
      };

      const user: User = {
        id: profileData.id,
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
    },

    signOut: () => {
      set({
        user: null,
        profile: null,
        workspaces: [],
        isAuthenticated: false,
      });

      // Clear localStorage
      localStorage.removeItem('mindmap_auth_user');
      localStorage.removeItem('mindmap_auth_profile');
    },
  })
);

// Initialize auth on app start
useAuthStore.getState().initialize();
