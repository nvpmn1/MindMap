import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  
  // Auth operations
  initialize: () => void;
  loginWithProfile: (profile: Omit<Profile, 'preferences'>) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      workspaces: [],
      isAuthenticated: false,
      isLoading: false,

      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),

      initialize: () => {
        // Verifica se já tem usuário salvo no localStorage (via persist)
        const state = get();
        if (state.user && state.profile) {
          set({ isAuthenticated: true, isLoading: false });
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
      },

      signOut: () => {
        set({
          user: null,
          profile: null,
          workspaces: [],
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'mindmap-auth',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        workspaces: state.workspaces,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on app start
useAuthStore.getState().initialize();
