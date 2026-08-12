import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Only the Electricity Rate is editable here — Water Charge is a fixed
// ₱200 business rule (docs/product/14-business-rules.md) and is never
// written to the database.
export async function updateBillingSettings(
  supabase: SupabaseClient<Database>,
  { propertyId, electricityRate }: { propertyId: string; electricityRate: number },
): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .upsert(
      { property_id: propertyId, default_electricity_rate: electricityRate },
      { onConflict: "property_id" },
    );
  if (error) throw error;
}
