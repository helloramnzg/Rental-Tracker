import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type UnitOption = {
  id: string;
  name: string;
  hasActiveTenant: boolean;
};

// Powers the unit picker on the Create Tenant form — flags units that
// already have an active tenant so the landlord doesn't pick one that
// the "one active tenant per unit" rule will reject server-side anyway.
export async function getUnitsForTenantForm(
  supabase: SupabaseClient<Database>,
): Promise<UnitOption[]> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();
  if (propertyError) throw propertyError;

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("id, name, tenants(active)")
    .eq("property_id", property.id)
    .eq("active", true)
    .order("name");
  if (unitsError) throw unitsError;

  return (units ?? []).map((unit) => ({
    id: unit.id,
    name: unit.name,
    hasActiveTenant: (unit.tenants ?? []).some((t) => t.active),
  }));
}
