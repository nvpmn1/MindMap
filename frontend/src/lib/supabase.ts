// ============================================================================
// MindMap Hub - Supabase Client Configuration
// ============================================================================
// Cliente Supabase para autenticação e realtime
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// ============================================================================
// Environment Variables
// ============================================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Flag to check if Supabase is configured
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('YOUR_PROJECT') &&
  !supabaseAnonKey.includes('YOUR_')
)

// ============================================================================
// Create Supabase Client
// ============================================================================

// Create a mock client if not configured to prevent crashes
let supabaseClient: SupabaseClient<Database>

if (isSupabaseConfigured) {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'mindmap-auth'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'x-application-name': 'mindmap-hub'
      }
    }
  })
} else {
  // Create a dummy client that won't crash
  console.warn('⚠️ Supabase não configurado. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
  supabaseClient = createClient<Database>(
    'https://placeholder.supabase.co',
    'placeholder-key',
    { auth: { persistSession: false } }
  )
}

export const supabase = supabaseClient

// ============================================================================
// Auth Helpers
// ============================================================================

export const auth = {
  /**
   * Sign in with email and password
   */
  signInWithPassword: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          avatar_url: null
        }
      }
    })
    if (error) throw error
    return data
  },

  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })
    if (error) throw error
    return data
  },

  /**
   * Sign in with GitHub OAuth
   */
  signInWithGithub: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    if (error) throw error
    return data
  },

  /**
   * Sign out
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  /**
   * Get current session
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  },

  /**
   * Get current user
   */
  getUser: async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    return data.user
  },

  /**
   * Refresh session
   */
  refreshSession: async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error) throw error
    return data.session
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: { name?: string; avatar_url?: string }) => {
    const { data: user, error } = await supabase.auth.updateUser({
      data
    })
    if (error) throw error
    return user
  },

  /**
   * Reset password
   */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    if (error) throw error
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// ============================================================================
// Realtime Helpers
// ============================================================================

export const realtime = {
  /**
   * Subscribe to a channel for a specific map
   */
  subscribeToMap: (mapId: string, handlers: {
    onNodeChange?: (payload: any) => void
    onPresence?: (payload: any) => void
    onBroadcast?: (payload: any) => void
  }) => {
    const channel = supabase.channel(`map:${mapId}`, {
      config: {
        presence: {
          key: mapId
        }
      }
    })

    // Database changes
    if (handlers.onNodeChange) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nodes',
          filter: `map_id=eq.${mapId}`
        },
        handlers.onNodeChange
      )
    }

    // Presence (online users)
    if (handlers.onPresence) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (channel as any)
        .on('presence', { event: 'sync' }, handlers.onPresence)
        .on('presence', { event: 'join' }, handlers.onPresence)
        .on('presence', { event: 'leave' }, handlers.onPresence)
    }

    // Broadcast (cursors, selections, etc)
    if (handlers.onBroadcast) {
      channel.on('broadcast', { event: 'cursor' }, handlers.onBroadcast)
      channel.on('broadcast', { event: 'selection' }, handlers.onBroadcast)
    }

    return channel.subscribe()
  },

  /**
   * Unsubscribe from a channel
   */
  unsubscribe: (channel: any) => {
    return supabase.removeChannel(channel)
  },

  /**
   * Broadcast cursor position
   */
  broadcastCursor: (channel: any, data: { x: number; y: number; userId: string; userName: string }) => {
    return channel.send({
      type: 'broadcast',
      event: 'cursor',
      payload: data
    })
  },

  /**
   * Track presence
   */
  trackPresence: (channel: any, data: { userId: string; userName: string; color: string }) => {
    return channel.track(data)
  }
}

// ============================================================================
// Storage Helpers
// ============================================================================

export const storage = {
  /**
   * Upload a file
   */
  upload: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })
    if (error) throw error
    return data
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  },

  /**
   * Delete a file
   */
  delete: async (bucket: string, paths: string[]) => {
    const { error } = await supabase.storage.from(bucket).remove(paths)
    if (error) throw error
  }
}

export default supabase
