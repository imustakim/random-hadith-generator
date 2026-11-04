import { describe, expect, it } from "vitest";

import {
  ConfigError,
  parsePublicConfig,
  parseServerConfig,
  validateSetValues,
} from "@/lib/config/parse";

const JSDELIVR = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

/** Runs `fn` and returns the ConfigError it throws, failing if it does not. */
function configError(fn: () => unknown): ConfigError {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(ConfigError);
    return error as ConfigError;
  }
  throw new Error("expected a ConfigError, but nothing was thrown");
}

describe("parseServerConfig", () => {
  it("defaults the Hadith API base URL to the jsDelivr endpoint", () => {
    expect(parseServerConfig({})).toEqual({ hadithApiBaseUrl: JSDELIVR });
  });

  it("keeps a configured Hadith API base URL", () => {
    expect(
      parseServerConfig({ HADITH_API_BASE_URL: "https://hadith.test/api@2" }),
    ).toEqual({ hadithApiBaseUrl: "https://hadith.test/api@2" });
  });

  it("removes trailing slashes from the Hadith API base URL", () => {
    expect(
      parseServerConfig({ HADITH_API_BASE_URL: "https://hadith.test/api//" }),
    ).toEqual({ hadithApiBaseUrl: "https://hadith.test/api" });
  });

  it("rejects a value that is not a URL, naming the variable but not the value", () => {
    const error = configError(() =>
      parseServerConfig({ HADITH_API_BASE_URL: "not-a-url-s3cret" }),
    );
    expect(error.message).toContain("HADITH_API_BASE_URL");
    expect(error.message).not.toContain("not-a-url-s3cret");
  });

  it("rejects a URL that is not http or https", () => {
    const error = configError(() =>
      parseServerConfig({ HADITH_API_BASE_URL: "ftp://hadith.test" }),
    );
    expect(error.message).toContain("HADITH_API_BASE_URL");
  });

  it.each(["", "   ", "\t\n"])(
    "treats %j as unset and applies the default",
    (blank) => {
      expect(parseServerConfig({ HADITH_API_BASE_URL: blank })).toEqual({
        hadithApiBaseUrl: JSDELIVR,
      });
    },
  );
});

describe("parsePublicConfig", () => {
  const valid = {
    NEXT_PUBLIC_SUPABASE_URL: "https://abc.supabase.test",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc",
  };

  it("returns the Supabase URL and publishable key", () => {
    expect(parsePublicConfig(valid)).toEqual({
      supabaseUrl: "https://abc.supabase.test",
      supabasePublishableKey: "sb_publishable_abc",
    });
  });

  it("names a missing Supabase URL", () => {
    const error = configError(() =>
      parsePublicConfig({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc",
      }),
    );
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(error.message).not.toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("names a missing publishable key", () => {
    const error = configError(() =>
      parsePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: valid.NEXT_PUBLIC_SUPABASE_URL,
      }),
    );
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("names every missing variable in one error", () => {
    const error = configError(() => parsePublicConfig({}));
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("rejects a malformed Supabase URL without echoing it", () => {
    const error = configError(() =>
      parsePublicConfig({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "oops-s3cret" }),
    );
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(error.message).not.toContain("oops-s3cret");
  });

  it("builds the whole error from names and hints, never from values", () => {
    const error = configError(() =>
      parsePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "oops-s3cret",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_leakme",
      }),
    );
    expect(error.message).toBe(
      "Invalid environment configuration: NEXT_PUBLIC_SUPABASE_URL is malformed (expected an http(s) URL). See .env.example.",
    );
  });

  it("tells the developer what a valid value looks like and where to look", () => {
    const error = configError(() => parsePublicConfig({}));
    expect(error.message).toContain("expected an http(s) URL");
    expect(error.message).toContain("expected a non-empty key");
    expect(error.message).toContain(".env.example");
  });

  it.each(["", "  \t"])("reports %j as missing, not malformed", (blank) => {
    const error = configError(() =>
      parsePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: blank,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: blank,
      }),
    );
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL is missing");
    expect(error.message).toContain(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing",
    );
  });
});

describe("validateSetValues", () => {
  it("accepts an empty environment, since missing values fail only on use", () => {
    expect(() => validateSetValues({})).not.toThrow();
  });

  it("accepts blank values, as in an unchanged .env.example", () => {
    expect(() =>
      validateSetValues({
        NEXT_PUBLIC_SUPABASE_URL: "",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " ",
        HADITH_API_BASE_URL: "",
      }),
    ).not.toThrow();
  });

  it("rejects a malformed set value, naming the variable but not the value", () => {
    const error = configError(() =>
      validateSetValues({ NEXT_PUBLIC_SUPABASE_URL: "oops-s3cret" }),
    );
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(error.message).not.toContain("oops-s3cret");
  });

  it("rejects a malformed Hadith API base URL", () => {
    const error = configError(() =>
      validateSetValues({ HADITH_API_BASE_URL: "nope" }),
    );
    expect(error.message).toContain("HADITH_API_BASE_URL");
  });
});
