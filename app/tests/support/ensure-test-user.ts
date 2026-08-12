import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { assertLocalSupabaseEnvironment } from "./env-guard";
import { createServiceRoleClientForTests } from "./clients";

// Idempotently ensures the documented test landlord account
// (HANDOVER.md §8) exists with a known password, using the Auth admin
// API — the one thing the service-role client can do regardless of the
// table-grant restrictions described in tests/support/README.md, since
// it goes through GoTrue, not PostgREST. Safe to call every run: `npm
// run db:reset` wipes auth.users, so tests can never assume this
// account survives between local sessions.
export async function ensureTestLandlordExists(): Promise<void> {
  assertLocalSupabaseEnvironment();

  const email = requireEnv("TEST_LANDLORD_EMAIL");
  const password = requireEnv("TEST_LANDLORD_PASSWORD");
  const supabase = createServiceRoleClientForTests();

  const { error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!createError) return;

  const alreadyExists = /already been registered|already exists/i.test(createError.message);
  if (!alreadyExists) {
    throw new Error(`Failed to create test landlord account: ${createError.message}`);
  }

  const existing = await findUserByEmail(supabase, email);
  if (!existing) {
    throw new Error(
      `Supabase reported "${email}" as already registered, but it could not be found via listUsers().`,
    );
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (updateError) {
    throw new Error(`Failed to reset test landlord password: ${updateError.message}`);
  }
}

async function findUserByEmail(supabase: SupabaseClient<Database>, email: string) {
  const perPage = 200;
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < perPage) return null;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required test env var ${name}. Check .env.test / .env.test.example.`);
  }
  return value;
}
