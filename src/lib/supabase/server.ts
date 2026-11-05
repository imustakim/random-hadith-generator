import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicConfig } from "@/lib/config/public";

/**
 * Next does not export the error `cookies().set` throws outside a Server
 * Action or Route Handler, so it is recognised by its message.
 */
function isReadOnlyCookieError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith(
      "Cookies can only be modified in a Server Action or Route Handler",
    )
  );
}

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
        } catch (error) {
          // Server Components cannot write cookies, so Next throws. Ignore only
          // that error.
          // TODO(authentication): add session-refresh middleware; until then a
          // session refreshed here is not persisted.
          if (!isReadOnlyCookieError(error)) throw error;
        }
      },
    },
  });
}
