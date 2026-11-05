import {
  PHASE_DEVELOPMENT_SERVER,
  PHASE_PRODUCTION_BUILD,
} from "next/constants";
import { afterEach, describe, expect, it, vi } from "vitest";

import createNextConfig from "../../next.config";

/** Runs `fn` and returns the error it throws, failing if it does not throw. */
function thrownError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected an error, but nothing was thrown");
}

describe("next.config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails the production build naming a secret key, without echoing it", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_s3cret");

    const error = thrownError(() => createNextConfig(PHASE_PRODUCTION_BUILD));

    expect(error.message).toContain(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is malformed",
    );
    expect(error.message).not.toContain("s3cret");
  });

  it("fails the production build when a set public URL is malformed", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://abc.supabase.test");

    const error = thrownError(() => createNextConfig(PHASE_PRODUCTION_BUILD));

    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL is malformed");
  });

  it("does not fail the production build when variables are empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("HADITH_API_BASE_URL", "");

    expect(() => createNextConfig(PHASE_PRODUCTION_BUILD)).not.toThrow();
  });

  it("does not fail the production build when variables are unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", undefined);
    vi.stubEnv("HADITH_API_BASE_URL", undefined);

    expect(() => createNextConfig(PHASE_PRODUCTION_BUILD)).not.toThrow();
  });

  it("leaves the dev server to the startup check", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_s3cret");

    expect(() => createNextConfig(PHASE_DEVELOPMENT_SERVER)).not.toThrow();
  });
});
