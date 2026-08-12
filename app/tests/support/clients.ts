import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { assertLocalSupabaseEnvironment } from "./env-guard";

// Anon-key client, no session — mirrors app/lib/supabase/client.ts.
// Used only as a starting point for signInAsLandlord(); never touches
// application tables directly (RLS would reject it as anon).
export function createAnonClient(): SupabaseClient<Database> {
  assertLocalSupabaseEnvironment();
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

// Service-role client — see tests/support/README.md "Service-role
// client: read-only in practice". Only used by ensure-test-user.ts
// (Auth admin API) and to SELECT properties/settings the same way the
// cron routes do.
export function createServiceRoleClientForTests(): SupabaseClient<Database> {
  assertLocalSupabaseEnvironment();
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Signs in as the documented test landlord and returns a client whose
// requests carry that session — i.e. the same `authenticated` Postgres
// role and RLS policies the real app uses. This is the client every
// fixture factory and every "logic under test" call should use.
export async function signInAsLandlord(): Promise<SupabaseClient<Database>> {
  const email = requireEnv("TEST_LANDLORD_EMAIL");
  const password = requireEnv("TEST_LANDLORD_PASSWORD");

  const supabase = createAnonClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(
      `Failed to sign in as the test landlord (${email}): ${error.message}. ` +
        "Did tests/support/ensure-test-user.ts run? Is the local Supabase instance up to date?",
    );
  }
  return supabase;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required test env var ${name}. Check .env.test / .env.test.example.`);
  }
  return value;
}
