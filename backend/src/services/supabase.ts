import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../utils/env';

/**
 * Supabase Admin Client
 * Uses service_role key - bypasses RLS
 * Use only for server-side operations that need full access
 */
export const supabaseAdmin: SupabaseClient<any, any, any> = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create a Supabase client for a specific user
 * Uses the user's JWT token for RLS-enabled queries
 */
export const supabaseClient = (accessToken: string): SupabaseClient<any, any, any> => {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
};

/**
 * Supabase Realtime subscription helper
 */
export const subscribeToChannel = (
  client: SupabaseClient<any, any, any>,
  channelName: string,
  table: string,
  filter: string,
  callback: (payload: any) => void
) => {
  return client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe();
};
