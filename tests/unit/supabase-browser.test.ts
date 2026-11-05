import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { configError } from "./helpers/config-error";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSupabaseBrowserClient", () => {
  it("throws a ConfigError naming the URL when it is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "a-test-key");

    const error = configError(createSupabaseBrowserClient);

    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL is missing");
    expect(error.message).not.toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("throws a ConfigError naming the key, never its value, when it is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:54321");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");

    const error = configError(createSupabaseBrowserClient);

    expect(error.message).toContain(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing",
    );
    expect(error.message).not.toContain("127.0.0.1");
  });
});
