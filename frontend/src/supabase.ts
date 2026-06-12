import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ampktfwcpopkomrsckjm.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FMDalRvzL6h5zW_4fTXt5g_I4dvctkD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
