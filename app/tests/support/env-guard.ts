// Hard safety guard: every destructive test helper (factories, global
// setup) calls this first. Refuses to run unless the configured
// Supabase URL is unambiguously the local Docker instance, so a
// misconfigured .env.local can never point a test run at a real
// project and start creating/deleting rows there.
export function assertLocalSupabaseEnvironment(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Tests must run against the local Supabase instance " +
        "(`npm run db:start`, then `cp .env.local.example .env.local` and fill in the printed values).",
    );
  }

  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL is not a valid URL: "${url}"`);
  }

  const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1"]);
  if (!LOCAL_HOSTNAMES.has(hostname)) {
    throw new Error(
      `Refusing to run destructive tests against "${hostname}" — only 127.0.0.1/localhost is ` +
        "permitted. This guard exists so a misconfigured environment can never run tests against " +
        "a real Supabase project.",
    );
  }
}
