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
      "Invalid environment configuration: NEXT_PUBLIC_SUPABASE_URL is malformed (expected an https URL without credentials, query or fragment; http only for localhost). See .env.example.",
    );
  });

  it("tells the developer what a valid value looks like and where to look", () => {
    const error = configError(() => parsePublicConfig({}));
    expect(error.message).toContain("expected an https URL");
    expect(error.message).toContain("expected a non-empty publishable key");
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

describe("publishable key safety", () => {
  const url = "https://abc.supabase.test";
  const jwt = (payload: string) =>
    `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.c2lnbmF0dXJl`;
  const SERVICE_ROLE_PAYLOAD = "eyJyb2xlIjoic2VydmljZV9yb2xlIn0"; // {"role":"service_role"}
  const ANON_PAYLOAD = "eyJyb2xlIjoiYW5vbiJ9"; // {"role":"anon"}

  it.each([
    ["an sb_secret_ key", "sb_secret_s3cretvalue"],
    ["an upper-case SB_SECRET_ key", "SB_SECRET_s3cretvalue"],
    ["a service-role JWT", jwt(SERVICE_ROLE_PAYLOAD)],
  ])("rejects %s without echoing it", (_label, key) => {
    const error = configError(() =>
      parsePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      }),
    );
    expect(error.message).toContain(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is malformed",
    );
    expect(error.message).not.toContain(key);
    expect(error.message).not.toContain("s3cret");
  });

  it.each([
    ["a publishable key", "sb_publishable_abc"],
    ["a legacy anon JWT", jwt(ANON_PAYLOAD)],
  ])("accepts %s", (_label, key) => {
    expect(
      parsePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      }).supabasePublishableKey,
    ).toBe(key);
  });

  it("rejects a secret key at startup validation too", () => {
    const error = configError(() =>
      validateSetValues({
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_s3cretvalue",
      }),
    );
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });
});

describe("URL strictness", () => {
  const withSupabaseUrl = (value: string) => () =>
    parsePublicConfig({
      NEXT_PUBLIC_SUPABASE_URL: value,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_abc",
    });
  const withHadithUrl = (value: string) => () =>
    parseServerConfig({ HADITH_API_BASE_URL: value });

  it.each([
    "http://user:pw-s3cret@abc.supabase.test",
    "https://abc.supabase.test?key=s3cret",
    "https://abc.supabase.test#s3cret",
    "http://abc.supabase.test",
    "https://abc.supabase.test/api?",
    "https://abc.supabase.test/api#",
    "https://@abc.supabase.test",
    "https:@abc.supabase.test",
    "https:/@abc.supabase.test",
    "https:\\\\@abc.supabase.test",
    "https:/\\@abc.supabase.test",
    "https:///@abc.supabase.test",
  ])("rejects the Supabase URL %s without echoing it", (value) => {
    const error = configError(withSupabaseUrl(value));
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL is malformed");
    expect(error.message).not.toContain("s3cret");
    expect(error.message).not.toContain(value);
  });

  it.each([
    "http://user:pw-s3cret@hadith.test/api",
    "https://hadith.test/api?token=s3cret",
    "https://hadith.test/api#s3cret",
    "http://hadith.test/api",
    "https://hadith.test/api?",
    "https://hadith.test/api#",
    "https://@hadith.test/api",
    "https:@hadith.test/api",
    "https:/@hadith.test/api",
    "https:\\\\@hadith.test/api",
    "https:/\\@hadith.test/api",
    "https:///@hadith.test/api",
  ])("rejects the Hadith API base URL %s", (value) => {
    const error = configError(withHadithUrl(value));
    expect(error.message).toContain("HADITH_API_BASE_URL is malformed");
    expect(error.message).not.toContain("s3cret");
    expect(error.message).not.toContain(value);
  });

  it.each([
    "http://127.0.0.1:54321",
    "http://localhost:54321",
    "http://[::1]:54321",
  ])("allows plain http for the loopback Supabase URL %s", (value) => {
    expect(withSupabaseUrl(value)().supabaseUrl).toBe(value);
  });

  it("allows plain http for a loopback Hadith API base URL", () => {
    expect(withHadithUrl("http://localhost:4010/api")()).toEqual({
      hadithApiBaseUrl: "http://localhost:4010/api",
    });
  });

  it("does not treat a look-alike host as loopback", () => {
    const error = configError(withSupabaseUrl("http://localhost.evil.test"));
    expect(error.message).toContain("NEXT_PUBLIC_SUPABASE_URL is malformed");
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
