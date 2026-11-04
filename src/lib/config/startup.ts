import { validateSetValues } from "./parse";
import { readPublicEnv } from "./public";
import { readServerEnv } from "./server";

/** Fails fast on any set but malformed variable. Missing values are left to first use. */
export function validateStartupConfig(): void {
  validateSetValues({ ...readPublicEnv(), ...readServerEnv() });
}
