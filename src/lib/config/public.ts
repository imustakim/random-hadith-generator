import { parsePublicConfig, type PublicConfig, type RawEnv } from "./parse";

/**
 * Next.js inlines public variables only for literal `process.env.NEXT_PUBLIC_*`
 * references, so each one is spelled out here. Never pass `process.env` whole
 * or index it dynamically: the browser bundle would get `undefined`.
 */
export function readPublicEnv(): RawEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

/** Validated public configuration. Throws a `ConfigError` naming any missing or malformed variable. */
export function getPublicConfig(): PublicConfig {
  return parsePublicConfig(readPublicEnv());
}
