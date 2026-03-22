import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env file.');
}

// ── navigator.locks polyfill ──────────────────────────────────
// Supabase internally uses navigator.locks which crashes on old Android WebView
// This polyfill provides a compatible implementation
if (typeof window !== 'undefined' && !window.navigator.locks) {
  Object.defineProperty(window.navigator, 'locks', {
    value: {
      request: async (_name: string, optionsOrFn: unknown, fn?: unknown) => {
        const callback = typeof optionsOrFn === 'function' ? optionsOrFn : fn;
        return (callback as (lock: { name: string }) => Promise<unknown>)(
          { name: _name }
        );
      },
      query: async () => ({ held: [], pending: [] }),
    },
    writable: false,
    configurable: true,
  });
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      lock: (_name, _acquireTimeout, fn) => fn(),
    },
  }
);