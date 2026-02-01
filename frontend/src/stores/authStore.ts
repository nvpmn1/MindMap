import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

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

interface AuthState {
  user: User | null;
  profile: Profile | null;
  workspaces: Workspace[];
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Auth operations
  initialize: () => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      workspaces: [],
      session: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setWorkspaces: (workspaces) => set({ workspaces }),
      setSession: (session) => set({ session }),
      setLoading: (isLoading) => set({ isLoading }),

      initialize: async () => {
        try {
          set({ isLoading: true });

          // Get current session
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) throw error;

          if (session?.user) {
            set({
              user: session.user,
              session,
              isAuthenticated: true,
            });

            // Fetch profile and workspaces
            const [profileResult, workspacesResult] = await Promise.all([
              supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single(),
              supabase
                .from('workspace_members')
                .select(`
                  role,
                  workspace:workspaces (
                    id,
                    name,
                    slug
                  )
                `)
                .eq('user_id', session.user.id),
            ]);

            if (profileResult.data) {
              set({ profile: profileResult.data });
            }

            if (workspacesResult.data) {
              const workspaces = workspacesResult.data.map((m: any) => ({
                ...m.workspace,
                role: m.role,
              }));
              set({ workspaces });
            }
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              set({
                user: session.user,
                session,
                isAuthenticated: true,
              });

              // Fetch profile
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (profile) {
                set({ profile });
              }
            } else if (event === 'SIGNED_OUT') {
              set({
                user: null,
                profile: null,
                workspaces: [],
                session: null,
                isAuthenticated: false,
              });
            } else if (event === 'TOKEN_REFRESHED' && session) {
              set({ session });
            }
          });
        } catch (error) {
          console.error('Auth initialization error:', error);
          set({ isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      signInWithMagicLink: async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        set({
          user: null,
          profile: null,
          workspaces: [],
          session: null,
          isAuthenticated: false,
        });
      },

      refreshSession: async () => {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) throw error;
        if (session) {
          set({ session });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Initialize auth on app start
useAuthStore.getState().initialize();
