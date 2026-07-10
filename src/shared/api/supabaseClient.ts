import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize connection safely
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-anon-key',
  {
    global: {
      fetch: (url, options) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        return fetch(url, { ...options, signal: controller.signal })
          .finally(() => clearTimeout(timeoutId));
      }
    }
  }
);

// Dynamic check helper to see if real Supabase keys are active in .env
export const isSupabaseActive = (): boolean => {
  return (
    supabaseUrl !== '' && 
    supabaseUrl !== 'https://placeholder-project.supabase.co' &&
    supabaseAnonKey !== '' &&
    supabaseAnonKey !== 'placeholder-anon-key'
  );
};
