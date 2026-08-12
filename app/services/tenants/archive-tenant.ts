import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { updateTenant } from "./update-tenant";

// Tenants are never deleted — archiving preserves the record for
// historical SOAs and payments (docs/architecture/06-database-design.md
// "Data Retention"). Archived tenants also stop blocking their unit
// from a new active tenant, since the DB's unique index is partial
// (WHERE active).
export async function archiveTenant(
  supabase: SupabaseClient<Database>,
  { tenantId }: { tenantId: string },
): Promise<void> {
  await updateTenant(supabase, { tenantId, patch: { active: false } });
}
