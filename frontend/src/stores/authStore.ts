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
        if (!data.display_name && data.avatar_url === undefined) {
          throw new Error('No data to update');
        }

        // Validate avatar URL before sending to server
        if (data.avatar_url !== undefined && data.avatar_url !== null && data.avatar_url !== '') {
          const isValidDataUrl = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(data.avatar_url);
          const isValidHttpUrl = data.avatar_url.startsWith('http://') || data.avatar_url.startsWith('https://');
          
          if (!isValidDataUrl && !isValidHttpUrl) {
            throw new Error('Invalid avatar URL format');
          }
        }

        // Update in backend
        const response = await authApi.updateProfile({
          display_name: data.display_name,
          avatar_url: data.avatar_url,
        });

        if (!response.success || !response.data) {
          throw new Error('Failed to update profile on server');
        }

        // Extract updated user from response
        const updatedUserFromResponse = response.data.user || response.data;
        
        // Update local state with server response
        const updatedUser = {
          ...state.user,
          ...(data.display_name !== undefined && { display_name: data.display_name || state.user.display_name }),
          ...(data.avatar_url !== undefined && { 
            avatar_url: data.avatar_url === null ? null : (data.avatar_url || state.user.avatar_url)
          }),
          // Preserve other fields from server response
          display_name: updatedUserFromResponse.display_name || state.user.display_name,
          avatar_url: updatedUserFromResponse.avatar_url ?? state.user.avatar_url,
        };
        
        const updatedProfile = state.profile ? {
          ...state.profile,
          display_name: updatedUserFromResponse.display_name || state.profile.display_name,
          avatar_url: updatedUserFromResponse.avatar_url ?? state.profile.avatar_url,
        } : null;
        
        set({ user: updatedUser, profile: updatedProfile });

        // CRITICAL: Persist immediately and separately
        localStorage.setItem('mindmap_auth_user', JSON.stringify(updatedUser));
        if (updatedProfile) {
          localStorage.setItem('mindmap_auth_profile', JSON.stringify(updatedProfile));
        }

        console.log('✅ Profile persisted to localStorage:', { userId: updatedUser.id });

      } catch (error) {
        console.error('Profile update error:', error);
        
        // Fallback: update locally and persist to localStorage immediately
        const fallbackUser = {
          ...state.user!,
          ...(data.display_name !== undefined && { display_name: data.display_name }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url === null ? null : (data.avatar_url || state.user!.avatar_url) }),
        };
        
        const fallbackProfile = state.profile ? {
          ...state.profile,
          ...(data.display_name !== undefined && { display_name: data.display_name }),
          ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url === null ? null : (data.avatar_url || state.profile.avatar_url) }),
        } : null;
        
        set({ user: fallbackUser, profile: fallbackProfile });

        // Save immediately to localStorage even on error
        localStorage.setItem('mindmap_auth_user', JSON.stringify(fallbackUser));
        localStorage.setItem('mindmap_auth_profile', JSON.stringify(fallbackProfile));

        console.log('⚠️ Profile persisted to localStorage (fallback mode):', { userId: fallbackUser.id });

        throw error;
      }
    },

    initialize: () => {
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

          // Validate avatar URL if present
          if (user.avatar_url) {
            const isValidDataUrl = /^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml);base64,/.test(user.avatar_url);
            const isValidHttpUrl = user.avatar_url.startsWith('http://') || user.avatar_url.startsWith('https://');
            
            if (!isValidDataUrl && !isValidHttpUrl) {
              console.warn('⚠️ Invalid avatar URL format detected, clearing', { userId: user.id });
              user.avatar_url = null;
              profile.avatar_url = null;
            }
          }

          set({
            user,
            profile,
            isAuthenticated: true,
            isLoading: false,
            workspaces: [DEFAULT_WORKSPACE],
          });
          console.log('✅ Session restored from localStorage');
        } catch (error) {
          console.error('❌ Failed to parse saved auth:', error);
          localStorage.removeItem('mindmap_auth_user');
          localStorage.removeItem('mindmap_auth_profile');
          set({ isLoading: false });
        }
      } else {
        // Auto-initialize with guest profile for offline mode
        const guestId = `guest-${Date.now()}`;
        const guestProfile: Profile = {
          id: guestId,
          email: 'guest@mindmap.local',
          display_name: 'Guest',
          avatar_url: null,
          color: '#00D9FF',
        };
        
        const guestUser: User = {
          id: guestId,
          email: 'guest@mindmap.local',
          display_name: 'Guest',
          avatar_url: null,
          color: '#00D9FF',
        };
        
        set({
          user: guestUser,
          profile: guestProfile,
          isAuthenticated: true,
          isLoading: false,
          workspaces: [DEFAULT_WORKSPACE],
        });
        
        localStorage.setItem('mindmap_auth_user', JSON.stringify(guestUser));
        localStorage.setItem('mindmap_auth_profile', JSON.stringify(guestProfile));
        console.log('✅ Guest session initialized');
      }
    },

    loginWithProfile: (profileData) => {
      try {
        const profile: Profile = {
          id: profileData.id,
          email: profileData.email,
          display_name: profileData.display_name || profileData.email.split('@')[0],
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
  })
);

// Initialize auth on app start
useAuthStore.getState().initialize();
