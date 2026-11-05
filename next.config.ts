import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

// Relative import: the config file is loaded before the `@/` alias exists.
// parse.ts only needs zod, so it is safe to load here (no `server-only`).
import { validateSetValues } from "./src/lib/config/parse";

/**
 * A malformed public value (for example a secret key in
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) fails the production build, because
 * `next build` would otherwise inline it before the startup check runs. A
 * missing value never fails the build (ADR 0004).
 */
export default function nextConfig(phase: string): NextConfig {
  if (phase === PHASE_PRODUCTION_BUILD) validateSetValues(process.env);
  return {};
}
