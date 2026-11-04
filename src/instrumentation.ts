export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateStartupConfig } = await import("@/lib/config/startup");
  validateStartupConfig();
}
