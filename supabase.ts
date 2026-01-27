
import { createClient } from '@supabase/supabase-js';

// Credenciais do projeto rlldyyipyapkehtxwvqk
const SUPABASE_URL = 'https://rlldyyipyapkehtxwvqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mOmsdU6uKC0eI6_ppTiHhQ_6NJD8jYv'; 

let supabaseClient: any;

// Permitir configuração mesmo com prefixo 'sb_' que é comum em ambientes de sandbox/preview
const isConfigured = SUPABASE_URL && SUPABASE_URL.startsWith('https://') && !!SUPABASE_ANON_KEY;

if (isConfigured) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
} else {
  // Mock para desenvolvimento local caso a URL não esteja presente
  supabaseClient = {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      upsert: (data: any) => {
        console.log(`[Mock Supabase] Upsert na tabela ${table}:`, data);
        return Promise.resolve({ data, error: null });
      },
      insert: (data: any) => Promise.resolve({ data, error: null }),
      update: (data: any) => Promise.resolve({ data, error: null }),
      delete: (data: any) => Promise.resolve({ data, error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    }),
    removeChannel: () => {}
  };
}

export const supabase = supabaseClient;
export const isSupabaseActive = isConfigured;
