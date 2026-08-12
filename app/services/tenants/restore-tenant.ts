import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { updateTenant } from "./update-tenant";

// Enforces "one active tenant per unit" via updateTenant — restoring
// an archived tenant onto a unit that already has a different active
// tenant is rejected with DuplicateActiveTenantError.
export async function restoreTenant(
  supabase: SupabaseClient<Database>,
  { tenantId }: { tenantId: string },
): Promise<void> {
  await updateTenant(supabase, { tenantId, patch: { active: true } });
}
