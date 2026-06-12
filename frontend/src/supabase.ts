import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eqqdjqdbbwmshllqesdt.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_WWWI-B3hA2eo3lBLGlizyg_4w0Me1Fw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
