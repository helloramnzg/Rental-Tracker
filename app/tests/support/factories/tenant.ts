import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { randomSuffix } from "../random";
import { getActivePropertyId } from "./shared";

export type TenantFixture = {
  unitId: string;
  tenantId: string;
  unitName: string;
  tenantName: string;
  monthlyRent: number;
  cleanup: () => Promise<void>;
};

// Creates a fresh unit under the real (singleton) property and a fresh
// active tenant on it, so billing/payments/SOA fixtures never touch the
// two real seeded units/tenants or contend with each other over "one
// active tenant per unit". See tests/support/README.md.
export async function createTenantFixture(
  supabase: SupabaseClient<Database>,
  overrides?: {
    electricityType?: Database["public"]["Enums"]["unit_electricity_type"];
    monthlyRent?: number;
    dueDay?: number;
  },
): Promise<TenantFixture> {
  const propertyId = await getActivePropertyId(supabase);
  const suffix = randomSuffix();
  const unitName = `Test Unit ${suffix}`;
  const tenantName = `Test Tenant ${suffix}`;
  const monthlyRent = overrides?.monthlyRent ?? 5000;

  const { data: unit, error: unitError } = await supabase
    .from("units")
    .insert({
      property_id: propertyId,
      name: unitName,
      electricity_type: overrides?.electricityType ?? "submeter",
      active: true,
    })
    .select("id")
    .single();
  if (unitError) throw unitError;

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      unit_id: unit.id,
      full_name: tenantName,
      monthly_rent: monthlyRent,
      due_day: overrides?.dueDay ?? 5,
      start_date: "2026-01-01",
      active: true,
    })
    .select("id")
    .single();
  if (tenantError) throw tenantError;

  return {
    unitId: unit.id,
    tenantId: tenant.id,
    unitName,
    tenantName,
    monthlyRent,
    cleanup: async () => {
      // Errors are NOT swallowed: an FK-restrict failure here (e.g. a
      // billing cycle referencing this tenant wasn't torn down first)
      // must fail the test loudly, not leave an orphaned row silently
      // behind. Callers are responsible for tearing down anything that
      // references this tenant/unit before calling cleanup().
      const { error: tenantDeleteError } = await supabase.from("tenants").delete().eq("id", tenant.id);
      if (tenantDeleteError) throw tenantDeleteError;
      const { error: unitDeleteError } = await supabase.from("units").delete().eq("id", unit.id);
      if (unitDeleteError) throw unitDeleteError;
    },
  };
}
