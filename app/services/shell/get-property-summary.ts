import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getOccupiedUnitsStat } from "@/services/tenants/get-occupied-units-stat";

export type PropertySummary = {
  name: string;
  address: string | null;
  occupiedUnits: { occupied: number; total: number };
};

// Powers the app shell (sidebar property card, topbar subtitle) on
// every authenticated page — kept separate from
// services/settings/get-settings-context.ts, which returns the fuller
// settings-screen shape.
export async function getPropertySummary(
  supabase: SupabaseClient<Database>,
): Promise<PropertySummary> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, name, address")
    .eq("active", true)
    .limit(1)
    .single();
  if (propertyError) throw propertyError;

  const occupiedUnits = await getOccupiedUnitsStat(supabase, {
    propertyId: property.id,
  });

  return { name: property.name, address: property.address, occupiedUnits };
}
