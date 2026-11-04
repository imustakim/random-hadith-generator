import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { register } from "@/instrumentation";

describe("register", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  function spyOnExit() {
    vi.spyOn(console, "error").mockImplementation(() => {});
    return vi
      .spyOn(process, "exit")
      .mockImplementation((() => undefined) as never);
  }

  it("logs the error and exits non-zero when a set value is malformed", async () => {
    const exit = spyOnExit();
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "oops-s3cret");

    await register();

    expect(exit).toHaveBeenCalledWith(1);
    const logged = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(logged).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(logged).not.toContain("oops-s3cret");
  });

  it("does not exit when every set value is valid or unset", async () => {
    const exit = spyOnExit();
    vi.stubEnv("NEXT_RUNTIME", "nodejs");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("HADITH_API_BASE_URL", "");

    await register();

    expect(exit).not.toHaveBeenCalled();
  });

  it("skips validation outside the Node.js runtime", async () => {
    const exit = spyOnExit();
    vi.stubEnv("NEXT_RUNTIME", "edge");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "oops");

    await register();

    expect(exit).not.toHaveBeenCalled();
  });
});
