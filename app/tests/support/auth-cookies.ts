import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { assertLocalSupabaseEnvironment } from "./env-guard";

// Signs in as the test landlord through the exact @supabase/ssr
// cookie-based flow app/lib/supabase/server.ts and
// app/lib/supabase/middleware.ts use, capturing the cookies Supabase
// would have asked the browser/edge runtime to set. Returns a `Cookie`
// header string so integration tests can hand a real, valid session to
// updateSession() without reimplementing Supabase's session format.
export async function signInAndCaptureCookies(): Promise<string> {
  assertLocalSupabaseEnvironment();

  const captured = new Map<string, string>();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => Array.from(captured.entries()).map(([name, value]) => ({ name, value })),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) captured.set(name, value);
        },
      },
    },
  );

  const email = requireEnv("TEST_LANDLORD_EMAIL");
  const password = requireEnv("TEST_LANDLORD_PASSWORD");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in for cookie capture: ${error.message}`);
  }

  return Array.from(captured.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required test env var ${name}. Check .env.test / .env.test.example.`);
  }
  return value;
}
