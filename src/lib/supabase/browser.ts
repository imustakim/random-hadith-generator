import { createBrowserClient } from "@supabase/ssr";

import { getPublicConfig } from "@/lib/config/public";

/**
 * Supabase client for browser code. `@supabase/ssr` returns the same instance
 * on every call within a page session, so call this wherever a client is
 * needed. Throws a `ConfigError` naming any missing Supabase variable.
 */
export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicConfig();
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
