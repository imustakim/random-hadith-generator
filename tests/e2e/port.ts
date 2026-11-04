const DEFAULT_E2E_PORT = 3100;

/** Reads the `E2E_PORT` override: unset or blank means the default, anything else must be a valid port. */
export function resolveE2EPort(raw: string | undefined): number {
  const value = raw?.trim();
  if (!value) return DEFAULT_E2E_PORT;
  const port = /^\d+$/.test(value) ? Number(value) : NaN;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `E2E_PORT must be an integer between 1 and 65535, got "${raw}"`,
    );
  }
  return port;
}
