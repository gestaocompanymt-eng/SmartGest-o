
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlldyyipyapkehtxwvqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mOmsdU6uKC0eI6_ppTiHhQ_6NJD8jYv'; 

// Verificação de segurança para as credenciais
const isConfigured = SUPABASE_URL && SUPABASE_URL.includes('supabase.co') && !!SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage // Garantir que a sessão persista no celular
  },
  global: {
    headers: { 'x-application-name': 'smartgestao' }
  },
  db: {
    schema: 'public'
  }
});

export const isSupabaseActive = isConfigured;

// Helper para monitorar mudanças nas tabelas principais em tempo real
export const subscribeToChanges = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
};
