import { z } from "zod";

/** A raw environment record, as `process.env` or a test literal. */
export type RawEnv = Record<string, string | undefined>;

export const DEFAULT_HADITH_API_BASE_URL =
  "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

/** Thrown for invalid configuration. Names variables, never their values. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const httpUrl = z
  .string()
  .trim()
  .refine((value) => {
    try {
      const { protocol } = new URL(value);
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  });

const nonEmptyText = z.string().trim().min(1);

const PUBLIC_FIELDS = {
  NEXT_PUBLIC_SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: nonEmptyText,
};

const SERVER_FIELDS = {
  HADITH_API_BASE_URL: httpUrl,
};

type Fields = Record<string, z.ZodType<string>>;
type Parsed<F extends Fields> = { [K in keyof F]?: string };

/**
 * Parses each variable of a group on its own. Empty and whitespace-only values
 * count as unset. Problems are described from variable names alone, so no
 * error can echo a value.
 */
function parseGroup<F extends Fields>(
  fields: F,
  env: RawEnv,
  required: readonly (keyof F & string)[],
): { values: Parsed<F>; problems: string[] } {
  const values: Parsed<F> = {};
  const problems: string[] = [];
  for (const name of Object.keys(fields) as (keyof F & string)[]) {
    const raw = env[name];
    if (raw === undefined || raw.trim() === "") {
      if (required.includes(name)) problems.push(`${name} is missing`);
      continue;
    }
    const result = fields[name].safeParse(raw);
    if (result.success) values[name] = result.data;
    else problems.push(`${name} is malformed`);
  }
  return { values, problems };
}

function throwIfAny(problems: string[]): void {
  if (problems.length > 0) {
    throw new ConfigError(
      `Invalid environment configuration: ${problems.join("; ")}`,
    );
  }
}

export type PublicConfig = {
  supabaseUrl: string;
  supabasePublishableKey: string;
};

/** Parses the public group (inlined into the browser bundle). Both values are required. */
export function parsePublicConfig(env: RawEnv): PublicConfig {
  const { values, problems } = parseGroup(PUBLIC_FIELDS, env, [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ]);
  throwIfAny(problems);
  return {
    supabaseUrl: values.NEXT_PUBLIC_SUPABASE_URL!,
    supabasePublishableKey: values.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  };
}

export type ServerConfig = { hadithApiBaseUrl: string };

/** Parses the server-only group. Nothing is required: the base URL has a default. */
export function parseServerConfig(env: RawEnv): ServerConfig {
  const { values, problems } = parseGroup(SERVER_FIELDS, env, []);
  throwIfAny(problems);
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
    ...parseGroup(PUBLIC_FIELDS, env, []).problems,
    ...parseGroup(SERVER_FIELDS, env, []).problems,
  ]);
}
