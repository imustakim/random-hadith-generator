import { z } from "zod";

/** A raw environment record, as `process.env` or a test literal. */
export type RawEnv = Record<string, string | undefined>;

const DEFAULT_HADITH_API_BASE_URL =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

/** Thrown for invalid configuration. Names variables, never their values. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * A base URL safe to use as configured: https (plain http only for loopback,
 * i.e. local Supabase or a local mock), with no credentials, query or fragment
 * that could leak into logs or break path joining.
 */
const secureUrl = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const url = new URL(value);
      if (url.username || url.password || url.search || url.hash) return false;
      return (
        url.protocol === "https:" ||
        (url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname))
      );
    } catch {
      return false;
    }
  });

/** True when the JWT payload (second segment) says `role: service_role`. */
function isServiceRoleJwt(value: string): boolean {
  const segments = value.split(".");
  if (segments.length !== 3) return false;
  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(atob(base64));
    return (
      typeof payload === "object" &&
      payload !== null &&
      "role" in payload &&
      payload.role === "service_role"
    );
  } catch {
    return false;
  }
}

/**
 * A key meant for the browser. Rejects Supabase secret keys and service-role
 * JWTs, which must never be inlined into the bundle.
 */
const browserSafeKey = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => !value.startsWith("sb_secret_") && !isServiceRoleJwt(value),
  );

const URL_HINT =
  "an https URL without credentials, query or fragment; http only for localhost";

type Field = {
  schema: z.ZodType<string>;
  /** What a valid value looks like. Shown in errors; never include a real value. */
  expects: string;
  /** A required field is a non-optional property of the parsed result. */
  required: boolean;
};

/*
 * Adding a variable means touching these places:
 *   1. a field in PUBLIC_FIELDS or SERVER_FIELDS below (its `required` flag
 *      drives the type of the parsed result),
 *   2. a literal read in `readPublicEnv` (public.ts) or `readServerEnv` (server.ts),
 *   3. the config type and mapping (`PublicConfig` / `ServerConfig`),
 *   4. `.env.example` and the `## Environment` paragraph in README.md.
 */
const PUBLIC_FIELDS = {
  NEXT_PUBLIC_SUPABASE_URL: {
    schema: secureUrl,
    expects: URL_HINT,
    required: true,
  },
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
    schema: browserSafeKey,
    expects: "a non-empty publishable key (not a secret or service-role key)",
    required: true,
  },
} as const satisfies Record<string, Field>;

const SERVER_FIELDS = {
  HADITH_API_BASE_URL: {
    schema: secureUrl,
    expects: URL_HINT,
    required: false,
  },
} as const satisfies Record<string, Field>;

type Fields = Record<string, Field>;
/** Required fields are `string`, the rest optional: the field table owns required-ness. */
type Parsed<F extends Fields> = {
  [K in keyof F as F[K]["required"] extends true ? K : never]: string;
} & {
  [K in keyof F as F[K]["required"] extends true ? never : K]?: string;
};

/**
 * Parses each variable of a group on its own. Empty and whitespace-only values
 * count as unset. Problems are described from variable names and the fixed
 * `expects` hints alone, so no error can echo a value.
 */
function parseGroup<F extends Fields>(
  fields: F,
  env: RawEnv,
  reportMissing: boolean,
): { values: Record<string, string>; problems: string[] } {
  const values: Record<string, string> = {};
  const problems: string[] = [];
  for (const name of Object.keys(fields) as (keyof F & string)[]) {
    const raw = env[name];
    if (raw === undefined || raw.trim() === "") {
      if (reportMissing && fields[name].required) {
        problems.push(`${name} is missing (expected ${fields[name].expects})`);
      }
      continue;
    }
    const result = fields[name].schema.safeParse(raw);
    if (result.success) values[name] = result.data;
    else
      problems.push(`${name} is malformed (expected ${fields[name].expects})`);
  }
  return { values, problems };
}

function throwIfAny(problems: string[]): void {
  if (problems.length > 0) {
    throw new ConfigError(
      `Invalid environment configuration: ${problems.join("; ")}. See .env.example.`,
    );
  }
}

/** Parses a group, requiring its `required` fields; throws a `ConfigError` on any problem. */
function parseGroupOrThrow<F extends Fields>(
  fields: F,
  env: RawEnv,
): Parsed<F> {
  const { values, problems } = parseGroup(fields, env, true);
  throwIfAny(problems);
  // No problems means every required field is present, which is what `Parsed<F>` says.
  return values as Parsed<F>;
}

export type PublicConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

/** Parses the public group (inlined into the browser bundle). Both values are required. */
export function parsePublicConfig(env: RawEnv): PublicConfig {
  const values = parseGroupOrThrow(PUBLIC_FIELDS, env);
  return {
    supabaseUrl: values.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}

export type ServerConfig = { hadithApiBaseUrl: string };

/** Parses the server-only group. Nothing is required: the base URL has a default. */
export function parseServerConfig(env: RawEnv): ServerConfig {
  const values = parseGroupOrThrow(SERVER_FIELDS, env);
  return {
    hadithApiBaseUrl: values.HADITH_API_BASE_URL
      ? values.HADITH_API_BASE_URL.replace(/\/+$/, "")
      : DEFAULT_HADITH_API_BASE_URL,
  };
}

/**
 * Startup check: rejects any variable that is set but malformed, in either
 * group. Missing values pass; they fail when their group is first used.
 */
export function validateSetValues(env: RawEnv): void {
  throwIfAny([
    ...parseGroup(PUBLIC_FIELDS, env, false).problems,
    ...parseGroup(SERVER_FIELDS, env, false).problems,
  ]);
}
