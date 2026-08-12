import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export class DuplicateActiveTenantError extends Error {
  constructor() {
    super("This unit already has an active tenant.");
    this.name = "DuplicateActiveTenantError";
  }
}

export class UnitNotFoundError extends Error {
  constructor() {
    super("The selected unit could not be found.");
    this.name = "UnitNotFoundError";
  }
}

export type CreateTenantInput = {
  unitId: string;
  fullName: string;
  monthlyRent: number;
  mobile?: string | null;
  email?: string | null;
  notes?: string | null;
  startDate: string;
  endDate?: string | null;
};

// New tenants are always created active. "A unit can only have one
// active tenant" is enforced here (friendly pre-check) and again by
// the database's partial unique index tenants_unit_id_active_unique
// (docs/architecture/06-database-design.md), which we fall back to
// catching in case of a race between two concurrent requests.
export async function createTenant(
  supabase: SupabaseClient<Database>,
  input: CreateTenantInput,
): Promise<{ tenantId: string }> {
  const { data: unit, error: unitError } = await supabase
    .from("units")
    .select("id")
    .eq("id", input.unitId)
    .eq("active", true)
    .maybeSingle();
  if (unitError) throw unitError;
  if (!unit) throw new UnitNotFoundError();

  const { data: existingActive, error: existingError } = await supabase
    .from("tenants")
    .select("id")
    .eq("unit_id", input.unitId)
    .eq("active", true)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existingActive) throw new DuplicateActiveTenantError();

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      unit_id: input.unitId,
      full_name: input.fullName,
      monthly_rent: input.monthlyRent,
      mobile: input.mobile ?? null,
      email: input.email ?? null,
      notes: input.notes ?? null,
      start_date: input.startDate,
      end_date: input.endDate ?? null,
      active: true,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new DuplicateActiveTenantError();
    throw error;
  }

  return { tenantId: data.id };
}
