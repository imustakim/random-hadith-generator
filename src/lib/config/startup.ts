import { ConfigError, validateSetValues } from "./parse";
import { readPublicEnv } from "./public";
import { readServerEnv } from "./server";

/**
 * Fails fast on any set but malformed variable: logs the error (variable
 * names only, never values) and exits the process non-zero. Missing values
 * are left to first use. Node.js runtime only: it calls `process.exit`.
 */
export function validateStartupConfig(): void {
  try {
    validateSetValues({ ...readPublicEnv(), ...readServerEnv() });
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    console.error(error.message);
    process.exit(1);
  }
}
