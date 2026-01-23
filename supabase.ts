
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rlldyyipyapkehtxwvqk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_mOmsdU6uKC0eI6_ppTiHhQ_6NJD8jYv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
