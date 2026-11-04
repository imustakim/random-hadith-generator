import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicConfig } from "@/lib/config/public";

/**
 * Supabase client for server code, bound to the current request's cookies.
 * Create one per request; never share it across requests. Throws a
 * `ConfigError` naming any missing Supabase variable.
 */
export async function createSupabaseServerClient() {
  const { supabaseUrl, supabasePublishableKey } = getPublicConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Ignoring is safe: session
          // refresh (authentication's middleware) is what persists them.
        }
      },
    },
  });
}
