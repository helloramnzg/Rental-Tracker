import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type OccupiedUnitsStat = { occupied: number; total: number };

// Powers the Dashboard's Occupied Units KPI — calculated dynamically
// from active tenants, never a stored/cached count.
export async function getOccupiedUnitsStat(
  supabase: SupabaseClient<Database>,
  { propertyId }: { propertyId: string },
): Promise<OccupiedUnitsStat> {
  const { count: total, error: totalError } = await supabase
    .from("units")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId)
    .eq("active", true);
  if (totalError) throw totalError;

  const { count: occupied, error: occupiedError } = await supabase
    .from("tenants")
    .select("id, unit:units!inner(property_id)", { count: "exact", head: true })
    .eq("active", true)
    .eq("unit.property_id", propertyId);
  if (occupiedError) throw occupiedError;

  return { occupied: occupied ?? 0, total: total ?? 0 };
}
