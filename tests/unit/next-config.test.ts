import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { afterEach, describe, expect, it, vi } from "vitest";

import nextConfig from "../../next.config";

describe("next.config", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("fails the production build when a set public key is a secret key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_s3cret");

    expect(() => nextConfig(PHASE_PRODUCTION_BUILD)).toThrow(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is malformed",
    );
  });

  it("does not put the rejected value in the build error", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_secret_s3cret");

    expect(() => nextConfig(PHASE_PRODUCTION_BUILD)).not.toThrow(/s3cret/);
  });

  it("does not fail the production build when variables are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("HADITH_API_BASE_URL", "");

    expect(() => nextConfig(PHASE_PRODUCTION_BUILD)).not.toThrow();
  });
});
