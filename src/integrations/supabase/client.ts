import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// أنشأنا العميل بدون فرض "Types" صارمة ليتوافق مع التعديل اليدوي الذي قمنا به
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
