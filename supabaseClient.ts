import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export function getSupabaseConfigError(): string | null {
  if (!supabaseUrl || !supabaseKey) {
    return [
      'Supabase environment variables are missing.',
      'You must set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      'Local: copy .env.example to .env and fill in values.',
      'Deployed: set them in your hosting provider environment variables.',
    ].join(' ');
  }
  return null;
}

export const supabase: SupabaseClient | null =
  getSupabaseConfigError() ? null : createClient(supabaseUrl, supabaseKey);