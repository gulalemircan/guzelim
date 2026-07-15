import { createClient } from '@supabase/supabase-js';

// Vercel ayarlarıyla uğraşmamak için linki ve şifreyi direkt buraya yazıyoruz
const supabaseUrl = 'https://rhruclubaprrspwgbcms.supabase.co/rest/v1/';
const supabaseAnonKey = 'sb_publishable_cqsPM1BzDex-SYjsxnbM4g_P5NjhXAf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);