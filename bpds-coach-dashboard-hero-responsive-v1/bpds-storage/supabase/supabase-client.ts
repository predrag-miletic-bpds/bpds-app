import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BpdsDatabase } from './supabase-schema.js';

/**
 * Fallback project values used only when no `VITE_SUPABASE_*` environment
 * variable is present (e.g. a Bit Cloud preview with no env-secret UI wired
 * up yet). These are the publishable client values for the verified BPDS
 * Supabase project — never a secret/service-role key.
 */
const DEV_FALLBACK_URL = 'https://xnbpadoizmmggsvfcygc.supabase.co';
const DEV_FALLBACK_PUBLISHABLE_KEY = 'sb_publishable_c8x9vhv56LERv3m7EYme1w_Wx-JLclm';

/** Reads a Vite env var, tolerating environments where `import.meta.env` does not exist. */
function readViteEnv(name: string): string | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any)?.env;
    const value = env?.[name];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Resolved Supabase project configuration. */
export type SupabaseConfig = {
  /** The project's REST/Realtime URL. */
  url: string;
  /** The publishable (anon) client key. Never a secret key. */
  publishableKey: string;
};

/**
 * Resolves the Supabase project configuration from Vite env vars, falling
 * back to the verified BPDS project's publishable values for local/preview
 * development when no env UI is available.
 */
export function resolveSupabaseConfig(): SupabaseConfig {
  return {
    url: readViteEnv('VITE_SUPABASE_URL') ?? DEV_FALLBACK_URL,
    publishableKey: readViteEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ?? DEV_FALLBACK_PUBLISHABLE_KEY,
  };
}

let cachedClient: SupabaseClient<BpdsDatabase> | undefined;

/**
 * Returns a singleton, typed Supabase client for the BPDS project.
 *
 * The client is created once per browser session so a single realtime
 * connection and auth session are shared across every service.
 */
export function getSupabaseClient(): SupabaseClient<BpdsDatabase> {
  if (cachedClient) return cachedClient;
  const { url, publishableKey } = resolveSupabaseConfig();
  cachedClient = createClient<BpdsDatabase>(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cachedClient;
}
