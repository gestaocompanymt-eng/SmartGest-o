
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string, fallback: string) => {
  try {
    // No ambiente de execução, o process.env pode vir de diferentes fontes
    // @ts-ignore
    const val = typeof process !== 'undefined' ? (process.env[key] || process.env[`VITE_${key}`]) : null;
    return val || fallback;
  } catch (e) {
    return fallback;
  }
};

// Se o usuário não configurou as chaves, o App opera em modo LocalStorage (Mock)
const SUPABASE_URL = getEnv('SUPABASE_URL', '');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY', ''); 

let supabaseClient: any;

const isConfigured = SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('eyJ');

if (isConfigured) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.info("SmartGestão: Modo Offline/Local Ativo. Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY para habilitar o Banco de Dados em Nuvem.");
  
  // Mock robusto para desenvolvimento sem Supabase
  supabaseClient = {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      upsert: (data: any) => Promise.resolve({ data, error: null }),
      insert: (data: any) => Promise.resolve({ data, error: null }),
      update: (data: any) => Promise.resolve({ data, error: null }),
      delete: (data: any) => Promise.resolve({ data, error: null }),
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    }
  };
}

export const supabase = supabaseClient;
export const isSupabaseActive = isConfigured;
