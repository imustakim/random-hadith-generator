import "server-only";

import { parseServerConfig, type RawEnv, type ServerConfig } from "./parse";

/** Spells out each variable literally, like `readPublicEnv` in public.ts; see the comment there before changing it. */
export function readServerEnv(): RawEnv {
  return { HADITH_API_BASE_URL: process.env.HADITH_API_BASE_URL };
}

/** Validated server-only configuration. Importing this from a Client Component fails the build. */
export function getServerConfig(): ServerConfig {
  return parseServerConfig(readServerEnv());
}
