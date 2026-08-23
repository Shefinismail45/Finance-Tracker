import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || (typeof localStorage !== 'undefined' && localStorage.getItem('custom_supabase_url')) || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || (typeof localStorage !== 'undefined' && localStorage.getItem('custom_supabase_anon_key')) || '';

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
          try {
            return { data: { user: JSON.parse(stored) }, error: null };
          } catch (e) {}
        }
        return { data: { user: null }, error: null };
      },
      getSession: async () => {
        const { data } = await this.auth.getUser();
        if (!data?.user) return { data: { session: null }, error: null };
        return { data: { session: { user: data.user, access_token: 'demo-token' } }, error: null };
      },
      signUp: async ({ email, password, options }) => {
        const user = {
          id: '00000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
          email,
          user_metadata: options?.data || { name: email.split('@')[0] }
        };
        localStorage.setItem('pft_demo_user', JSON.stringify(user));
        return { data: { user, session: { user, access_token: 'demo-token' } }, error: null };
      },
      signInWithPassword: async ({ email, password }) => {
        const user = {
          id: '00000000-0000-0000-0000-' + Math.random().toString(36).substring(2, 14).padEnd(12, '0'),
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
