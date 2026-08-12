import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { DuplicateActiveTenantError } from "./create-tenant";

export class TenantNotFoundError extends Error {
  constructor() {
    super("Tenant not found.");
    this.name = "TenantNotFoundError";
  }
}

export type UpdateTenantPatch = {
  fullName?: string;
  monthlyRent?: number;
  mobile?: string | null;
  email?: string | null;
  notes?: string | null;
  active?: boolean;
  startDate?: string;
  endDate?: string | null;
};

// Partial update — used for the full Edit form and, with a
// single-field patch, by archive-tenant.ts / restore-tenant.ts.
// Reactivating a tenant (patch.active === true) re-enforces "one
// active tenant per unit", same as create-tenant.ts.
export async function updateTenant(
  supabase: SupabaseClient<Database>,
  { tenantId, patch }: { tenantId: string; patch: UpdateTenantPatch },
): Promise<void> {
  const { data: current, error: currentError } = await supabase
    .from("tenants")
    .select("id, unit_id, active")
    .eq("id", tenantId)
    .maybeSingle();
  if (currentError) throw currentError;
  if (!current) throw new TenantNotFoundError();

  if (patch.active === true && !current.active) {
    const { data: existingActive, error: existingError } = await supabase
      .from("tenants")
      .select("id")
      .eq("unit_id", current.unit_id)
      .eq("active", true)
      .neq("id", tenantId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingActive) throw new DuplicateActiveTenantError();
  }

  const updatePayload: Database["public"]["Tables"]["tenants"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (patch.fullName !== undefined) updatePayload.full_name = patch.fullName;
  if (patch.monthlyRent !== undefined) updatePayload.monthly_rent = patch.monthlyRent;
  if (patch.mobile !== undefined) updatePayload.mobile = patch.mobile;
  if (patch.email !== undefined) updatePayload.email = patch.email;
  if (patch.notes !== undefined) updatePayload.notes = patch.notes;
  if (patch.active !== undefined) updatePayload.active = patch.active;
  if (patch.startDate !== undefined) updatePayload.start_date = patch.startDate;
  if (patch.endDate !== undefined) updatePayload.end_date = patch.endDate;

  const { error } = await supabase.from("tenants").update(updatePayload).eq("id", tenantId);

  if (error) {
    if (error.code === "23505") throw new DuplicateActiveTenantError();
    throw error;
  }
}
