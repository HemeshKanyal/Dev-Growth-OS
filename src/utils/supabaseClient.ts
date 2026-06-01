import { createClient } from '@supabase/supabase-js';

// Retrieve values from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials are missing! Please create a `.env` file at the root of the project with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// Fallback to placeholder strings if environment variables are missing
// This prevents the entire React app from crashing on start with a "supabaseUrl is required" error.
const finalUrl = supabaseUrl || 'https://placeholder-project-id.supabase.co';
const finalAnonKey = supabaseAnonKey || 'placeholder-anon-key-string';

export const supabase = createClient(finalUrl, finalAnonKey);
