import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || localStorage.getItem('custom_supabase_url');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || localStorage.getItem('custom_supabase_anon_key');

export const isLiveSupabaseConfigured = () => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));
};

let liveClient = null;
if (isLiveSupabaseConfigured()) {
  liveClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
}

// Fallback / Demo In-Memory & LocalStorage Client for offline/instant preview
class LocalDemoSupabaseClient {
  constructor() {
    this.auth = {
      getUser: async () => {
        const stored = localStorage.getItem('pft_demo_user');
        if (stored) {
          return { data: { user: JSON.parse(stored) }, error: null };
        }
        const defaultUser = {
          id: 'demo-user-12345',
          email: 'demo@financetracker.io',
          user_metadata: { name: 'Alex Johnson' }
        };
        localStorage.setItem('pft_demo_user', JSON.stringify(defaultUser));
        return { data: { user: defaultUser }, error: null };
      },
      getSession: async () => {
        const { data } = await this.auth.getUser();
        return { data: { session: { user: data.user, access_token: 'demo-token' } }, error: null };
      },
      signUp: async ({ email, password, options }) => {
        const user = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email,
          user_metadata: options?.data || { name: email.split('@')[0] }
        };
        localStorage.setItem('pft_demo_user', JSON.stringify(user));
        return { data: { user, session: { user, access_token: 'demo-token' } }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const user = {
          id: 'user-' + Math.random().toString(36).substring(2, 9),
          email,
          user_metadata: { name: email.split('@')[0] }
        };
        localStorage.setItem('pft_demo_user', JSON.stringify(user));
        return { data: { user, session: { user, access_token: 'demo-token' } }, error: null };
      },
      signOut: async () => {
        localStorage.removeItem('pft_demo_user');
        return { error: null };
      },
      onAuthStateChange: (callback) => {
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    };
  }
}

export const supabase = liveClient || new LocalDemoSupabaseClient();
