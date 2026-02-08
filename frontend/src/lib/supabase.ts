import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { logger } from './logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Missing Supabase environment variables - Running in offline mode');
  logger.info(`VITE_SUPABASE_URL: ${supabaseUrl ? '[SET]' : '[MISSING]'}`);
  logger.info(`VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? '[SET]' : '[MISSING]'}`);
}

// Create Supabase client with error handling
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-client-info': 'mindmap-hub@1.0.0',
      },
    },
  }
);

// Check connection status
let isSupabaseAvailable = false;
if (supabaseUrl && supabaseAnonKey) {
  supabase.auth.getSession()
    .then(() => {
      isSupabaseAvailable = true;
      console.log('✅ Supabase connection established');
    })
    .catch((error) => {
      console.warn('⚠️ Supabase connection failed:', error.message);
      console.warn('Running in offline mode - data will be stored locally');
    });
}

export const isOfflineMode = () => !isSupabaseAvailable;

// Helper to get current session
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('⚠️ Failed to get session:', error.message);
      return null;
    }
    return session;
  } catch (error) {
    console.warn('⚠️ Session error:', error);
    return null;
  }
};

// Helper to get access token
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const session = await getSession();
    return session?.access_token || null;
  } catch (error) {
    console.warn('⚠️ Failed to get access token:', error);
    return null;
  }
};
