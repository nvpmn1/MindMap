import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitialized: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Auth Operations
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  handleOAuthCallback: () => Promise<void>;
  
  // Aliases for backwards compatibility
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        accessToken: null,
        isLoading: true,
        isAuthenticated: false,
        isInitialized: false,
        error: null,

        setUser: (user) => set({ user, isAuthenticated: !!user }),
        setAccessToken: (accessToken) => set({ accessToken }),
        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),

        initialize: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              throw error;
            }

            if (session?.user) {
              // Fetch user profile from database
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single() as { data: { name?: string; avatar_url?: string } | null };

              const user: User = {
                id: session.user.id,
                email: session.user.email!,
                name: profile?.name || session.user.user_metadata?.full_name || '',
                avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
                created_at: session.user.created_at,
                updated_at: session.user.updated_at || session.user.created_at,
              };

              set({
                user,
                accessToken: session.access_token,
                isAuthenticated: true,
              });
            }
          } catch (error) {
            console.error('Auth initialization error:', error);
            set({ error: 'Falha ao inicializar autenticação' });
          } finally {
            set({ isLoading: false, isInitialized: true });
          }
        },

        signInWithEmail: async (email, password) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase.auth.signInWithPassword({
              email,
              password,
            });

            if (error) {
              throw error;
            }

            if (data.user) {
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', data.user.id)
                .single() as { data: { name?: string; avatar_url?: string } | null };

              const user: User = {
                id: data.user.id,
                email: data.user.email!,
                name: profile?.name || data.user.user_metadata?.full_name || '',
                avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url,
                created_at: data.user.created_at,
                updated_at: data.user.updated_at || data.user.created_at,
              };

              set({
                user,
                accessToken: data.session?.access_token || null,
                isAuthenticated: true,
              });
            }

            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message === 'Invalid login credentials'
              ? 'Email ou senha inválidos'
              : 'Erro ao fazer login';
            set({ error: errorMessage });
            return { success: false, error: errorMessage };
          } finally {
            set({ isLoading: false });
          }
        },

        signUpWithEmail: async (email, password, name) => {
          try {
            set({ isLoading: true, error: null });

            const { data, error } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: {
                  full_name: name,
                },
              },
            });

            if (error) {
              throw error;
            }

            if (data.user) {
              // Create user profile in database
              await supabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email,
                name: name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as any);

              // If email confirmation is disabled, sign in immediately
              if (data.session) {
                const user: User = {
                  id: data.user.id,
                  email: data.user.email!,
                  name: name,
                  created_at: data.user.created_at,
                  updated_at: data.user.created_at,
                };

                set({
                  user,
                  accessToken: data.session.access_token,
                  isAuthenticated: true,
                });
              }
            }

            return { success: true };
          } catch (error: any) {
            const errorMessage = error.message === 'User already registered'
              ? 'Este email já está cadastrado'
              : 'Erro ao criar conta';
            set({ error: errorMessage });
            return { success: false, error: errorMessage };
          } finally {
            set({ isLoading: false });
          }
        },

        signInWithOAuth: async (provider) => {
          try {
            set({ isLoading: true, error: null });

            const { error } = await supabase.auth.signInWithOAuth({
              provider,
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
              },
            });

            if (error) {
              throw error;
            }
          } catch (error: any) {
            set({ error: 'Erro ao fazer login com provedor' });
          } finally {
            set({ isLoading: false });
          }
        },

        signOut: async () => {
          try {
            set({ isLoading: true, error: null });

            const { error } = await supabase.auth.signOut();

            if (error) {
              throw error;
            }

            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
            });
          } catch (error: any) {
            set({ error: 'Erro ao fazer logout' });
          } finally {
            set({ isLoading: false });
          }
        },

        refreshSession: async () => {
          try {
            const { data: { session }, error } = await supabase.auth.refreshSession();

            if (error) {
              throw error;
            }

            if (session) {
              set({ accessToken: session.access_token });
            }
          } catch (error) {
            console.error('Session refresh error:', error);
            // If refresh fails, sign out
            get().signOut();
          }
        },

        updateProfile: async (updates) => {
          try {
            const { user } = get();
            if (!user) {
              return { success: false, error: 'Usuário não autenticado' };
            }

            // Update Supabase auth metadata
            if (updates.name) {
              await supabase.auth.updateUser({
                data: { full_name: updates.name },
              });
            }

            // Update profile in database
            const { error } = await (supabase
              .from('users') as any)
              .update({
                name: updates.name,
                avatar_url: updates.avatar_url,
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);

            if (error) {
              throw error;
            }

            set({ user: { ...user, ...updates } });

            return { success: true };
          } catch (error: any) {
            return { success: false, error: 'Erro ao atualizar perfil' };
          }
        },

        resetPassword: async (email) => {
          try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) {
              throw error;
            }

            return { success: true };
          } catch (error: any) {
            return { success: false, error: 'Erro ao enviar email de recuperação' };
          }
        },

        handleOAuthCallback: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const { data: { session }, error } = await supabase.auth.getSession();
            
            if (error) {
              throw error;
            }

            if (session?.user) {
              const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single() as { data: { name?: string; avatar_url?: string } | null };

              const user: User = {
                id: session.user.id,
                email: session.user.email!,
                name: profile?.name || session.user.user_metadata?.full_name || '',
                avatar_url: profile?.avatar_url || session.user.user_metadata?.avatar_url,
                created_at: session.user.created_at,
                updated_at: session.user.updated_at || session.user.created_at,
              };

              // Upsert user profile if not exists
              await supabase.from('users').upsert({
                id: user.id,
                email: user.email,
                name: user.name,
                avatar_url: user.avatar_url,
                created_at: user.created_at,
                updated_at: user.updated_at,
              } as any);

              set({
                user,
                accessToken: session.access_token,
                isAuthenticated: true,
              });
            }
          } catch (error) {
            console.error('OAuth callback error:', error);
            set({ error: 'Falha na autenticação OAuth' });
          } finally {
            set({ isLoading: false });
          }
        },

        clearError: () => set({ error: null }),

        // Aliases for backwards compatibility
        login: (email, password) => get().signInWithEmail(email, password),
        register: (email, password, name) => get().signUpWithEmail(email, password, name),
        loginWithGoogle: () => get().signInWithOAuth('google'),
        loginWithGithub: () => get().signInWithOAuth('github'),
        logout: () => get().signOut(),
      }),
      {
        name: 'mindmap-auth',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  const { setUser, setAccessToken, initialize } = useAuthStore.getState();

  if (event === 'SIGNED_IN' && session) {
    initialize();
  } else if (event === 'SIGNED_OUT') {
    setUser(null);
    setAccessToken(null);
  } else if (event === 'TOKEN_REFRESHED' && session) {
    setAccessToken(session.access_token);
  }
});
