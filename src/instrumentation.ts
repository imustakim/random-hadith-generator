export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateStartupConfig } = await import("@/lib/config/startup");
  const { ConfigError } = await import("@/lib/config/parse");
  try {
    validateStartupConfig();
  } catch (error) {
    if (!(error instanceof ConfigError)) throw error;
    // ConfigError names variables, never values, so it is safe to log.
    console.error(error.message);
    process.exit(1);
  }
}
