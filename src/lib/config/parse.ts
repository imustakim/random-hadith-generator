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

/** A scheme, `//`, then userinfo (even empty, as in `https://@host`) before the first `/`. */
const HAS_USERINFO = /^[a-z][a-z0-9+.-]*:\/\/[^/]*@/i;

/**
 * A base URL safe to use as configured: https (plain http only for loopback,
 * i.e. local Supabase or a local mock), with no credentials, query or fragment
 * that could leak into logs or break path joining. The raw string is checked
 * too, because `URL` reports a bare `?`, `#` or `@` as empty.
 */
const secureUrl = z
  .string()
  .trim()
  .refine((value) => {
    if (/[?#]/.test(value) || HAS_USERINFO.test(value)) return false;
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

/** A secure URL used as a base for path joining: trailing slashes are removed. */
const baseUrl = secureUrl.transform((value) => value.replace(/\/+$/, ""));

const JwtPayload = z.object({ role: z.literal("service_role") });

/** True when the JWT payload (second segment) says `role: service_role`. */
function isServiceRoleJwt(value: string): boolean {
  const segments = value.split(".");
  if (segments.length !== 3) return false;
  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload: unknown = JSON.parse(atob(base64));
    return JwtPayload.safeParse(payload).success;
  } catch {
    return false;
  }
}

/**
 * A key meant for the browser. Rejects Supabase secret keys (any letter case)
 * and service-role JWTs, which must never be inlined into the bundle.
 */
const browserSafeKey = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      !value.toLowerCase().startsWith("sb_secret_") && !isServiceRoleJwt(value),
  );

const URL_HINT =
  "an https URL without credentials, query or fragment; http only for localhost";

type Field = {
  /** The property this variable has in the parsed config. */
  key: string;
  schema: z.ZodType<string>;
  /** What a valid value looks like. Shown in errors; never include a real value. */
  expects: string;
  /** A required field is reported when missing and is a non-optional property of the result. */
  required: boolean;
  /** Used when the variable is unset. A field with a default is always present in the result. */
  default?: string;
};

/*
 * Adding a variable means touching these places:
 *   1. a field in PUBLIC_FIELDS or SERVER_FIELDS below (its `key` names the
 *      config property; `required` and `default` drive the config type),
 *   2. a literal read in `readPublicEnv` (public.ts) or `readServerEnv` (server.ts),
 *   3. `.env.example` and the `## Environment` paragraph in README.md.
 */
const PUBLIC_FIELDS = {
  NEXT_PUBLIC_SUPABASE_URL: {
    key: "supabaseUrl",
    schema: secureUrl,
    expects: URL_HINT,
    required: true,
  },
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
    key: "supabasePublishableKey",
    schema: browserSafeKey,
    expects: "a non-empty publishable key (not a secret or service-role key)",
    required: true,
  },
} as const satisfies Record<string, Field>;

const SERVER_FIELDS = {
  HADITH_API_BASE_URL: {
    key: "hadithApiBaseUrl",
    schema: baseUrl,
    expects: URL_HINT,
    required: false,
    default: DEFAULT_HADITH_API_BASE_URL,
  },
} as const satisfies Record<string, Field>;

type Fields = Record<string, Field>;
type IsPresent<T extends Field> = T extends { required: true }
  ? true
  : T extends { default: string }
    ? true
    : false;
/** The config a field table produces: present fields are `string`, the rest optional. */
type Config<F extends Fields> = {
  [K in keyof F as IsPresent<F[K]> extends true ? F[K]["key"] : never]: string;
} & {
  [K in keyof F as IsPresent<F[K]> extends true ? never : F[K]["key"]]?: string;
};

export type PublicConfig = Config<typeof PUBLIC_FIELDS>;
export type ServerConfig = Config<typeof SERVER_FIELDS>;

/**
 * Parses each variable of a group on its own. Empty and whitespace-only values
 * count as unset. Problems are described from variable names and the fixed
 * `expects` hints alone, so no error can echo a value. Missing required
 * variables are problems only with `reportMissing`.
 */
function parseGroup<F extends Fields>(
  fields: F,
  env: RawEnv,
  options: { reportMissing: boolean },
): { values: Record<string, string>; problems: string[] } {
  const values: Record<string, string> = {};
  const problems: string[] = [];
  for (const name of Object.keys(fields) as (keyof F & string)[]) {
    const field = fields[name];
    const raw = env[name];
    if (raw === undefined || raw.trim() === "") {
      if (field.default !== undefined) values[field.key] = field.default;
      else if (options.reportMissing && field.required) {
        problems.push(`${name} is missing (expected ${field.expects})`);
      }
      continue;
    }
    const result = field.schema.safeParse(raw);
    if (result.success) values[field.key] = result.data;
    else problems.push(`${name} is malformed (expected ${field.expects})`);
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
): Config<F> {
  const { values, problems } = parseGroup(fields, env, { reportMissing: true });
  throwIfAny(problems);
  // No problems means every required or defaulted field is present, which is what `Config<F>` says.
  return values as Config<F>;
}

/** Parses the public group (inlined into the browser bundle); see PUBLIC_FIELDS for what is required. */
export function parsePublicConfig(env: RawEnv): PublicConfig {
  return parseGroupOrThrow(PUBLIC_FIELDS, env);
}

/** Parses the server-only group; see SERVER_FIELDS for what is required or defaulted. */
export function parseServerConfig(env: RawEnv): ServerConfig {
  return parseGroupOrThrow(SERVER_FIELDS, env);
}

/**
 * Startup and build check: rejects any variable that is set but malformed, in
 * either group. Missing values pass; they fail when their group is first used.
 */
export function validateSetValues(env: RawEnv): void {
  const options = { reportMissing: false };
  throwIfAny([
    ...parseGroup(PUBLIC_FIELDS, env, options).problems,
    ...parseGroup(SERVER_FIELDS, env, options).problems,
  ]);
}
