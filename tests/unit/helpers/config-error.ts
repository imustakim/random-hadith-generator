import { expect } from "vitest";

import { ConfigError } from "@/lib/config/parse";

/** Runs `fn` and returns the ConfigError it throws, failing if it does not. */
export function configError(fn: () => unknown): ConfigError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    return error as ConfigError;
  }
  throw new Error("expected a ConfigError, but nothing was thrown");
}
