import { createClient } from '@supabase/supabase-js';

// Vercel ayarlarıyla uğraşmamak için linki ve şifreyi direkt buraya yazıyoruz
// DÜZELTME: Linkin sonundaki /rest/v1/ kısmı silindi, sadece ana domain bırakıldı!
const supabaseUrl = 'https://rhruclubaprrspwgbcms.supabase.co';
const supabaseAnonKey = 'sb_publishable_cqsPM1BzDex-SYjsxnbM4g_P5NjhXAf';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);