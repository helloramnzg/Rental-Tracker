import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function updateProperty(
  supabase: SupabaseClient<Database>,
  { propertyId, name, address }: { propertyId: string; name: string; address: string | null },
): Promise<void> {
  const { error } = await supabase
    .from("properties")
    .update({ name, address })
    .eq("id", propertyId);
  if (error) throw error;
}
