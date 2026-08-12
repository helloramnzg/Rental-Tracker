import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Every service under test resolves "the" property the same way
// (`.eq("active", true).limit(1).single()`) — mirroring that here
// instead of hardcoding the seeded id keeps fixtures correct even if
// seed data ever changes.
export async function getActivePropertyId(supabase: SupabaseClient<Database>): Promise<string> {
  const { data, error } = await supabase
    .from("properties")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();
  if (error) throw error;
  return data.id;
}
