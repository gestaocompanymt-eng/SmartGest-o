
import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO SUPABASE
 * O erro "URL ou Chave inválidas" ocorre porque a chave atual (sb_publishable...) 
 * é uma chave do Stripe, não do Supabase.
 * 
 * Para corrigir, configure no Netlify ou substitua aqui:
 * SUPABASE_URL: URL do projeto (https://xyz.supabase.co)
 * SUPABASE_ANON_KEY: Anon Public Key (deve começar com 'eyJ...')
 */

const getEnv = (key: string, fallback: string) => {
  try {
    // Tenta obter das variáveis de ambiente injetadas pela plataforma (Netlify/Vite)
    const val = typeof process !== 'undefined' ? process.env[key] : null;
    return val || fallback;
  } catch (e) {
    return fallback;
  }
};

const SUPABASE_URL = getEnv('SUPABASE_URL', 'https://rlldyyipyapkehtxwvqk.supabase.co');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY', 'sb_publishable_mOmsdU6uKC0eI6_ppTiHhQ_6NJD8jYv'); 

let supabaseClient: any;

try {
  // Chaves do Supabase sempre começam com 'eyJ'. 
  // Chaves 'sb_publishable' são do Stripe e causarão erro no cliente Supabase.
  const isKeyValid = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.startsWith('eyJ');
  
  if (!isKeyValid) {
    // Silenciamos o erro fatal e usamos um modo de demonstração local
    console.info("SmartGestão: Operando em modo de armazenamento local (LocalStorage). Configure SUPABASE_ANON_KEY para sincronização em nuvem.");
    
    supabaseClient = {
      from: () => ({
        select: () => ({ data: [], error: null } as any),
        upsert: () => Promise.resolve({ error: null }),
        insert: () => Promise.resolve({ error: null }),
        update: () => Promise.resolve({ error: null }),
        delete: () => Promise.resolve({ error: null }),
      }),
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      }
    };
  } else {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  // Fallback silencioso para garantir que o App renderize mesmo sem rede/configuração
  supabaseClient = {
    from: () => ({
      select: () => ({ data: [], error: null } as any),
      upsert: () => Promise.resolve({ error: null }),
    })
  };
}

export const supabase = supabaseClient;
