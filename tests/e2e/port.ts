import { z } from "zod";

const DEFAULT_E2E_PORT = 3100;

const portSchema = z
  .string()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(65535));

/** Reads the `E2E_PORT` override: unset or blank means the default, anything else must be a valid port. */
export function resolveE2EPort(raw: string | undefined): number {
  const value = raw?.trim();
  if (!value) return DEFAULT_E2E_PORT;
  const parsed = portSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      `E2E_PORT must be an integer between 1 and 65535, got "${raw}"`,
    );
  }
  return parsed.data;
}
