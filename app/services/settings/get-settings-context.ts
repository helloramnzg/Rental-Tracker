import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SettingsContext = {
  property: { id: string; name: string; address: string | null };
  billing: { electricityRate: number; waterCharge: number };
  notifications: { emailEnabled: boolean; inAppEnabled: boolean };
};

// Water charge is a fixed business rule (docs/product/14-business-rules.md),
// never stored — included here only for read-only display.
const FIXED_WATER_CHARGE = 200;

export async function getSettingsContext(
  supabase: SupabaseClient<Database>,
): Promise<SettingsContext> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id, name, address")
    .eq("active", true)
    .limit(1)
    .single();
  if (propertyError) throw propertyError;

  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("default_electricity_rate, email_notifications_enabled, in_app_notifications_enabled")
    .eq("property_id", property.id)
    .maybeSingle();
  if (settingsError) throw settingsError;

  return {
    property,
    billing: {
      electricityRate: settings?.default_electricity_rate ?? 15,
      waterCharge: FIXED_WATER_CHARGE,
    },
    notifications: {
      emailEnabled: settings?.email_notifications_enabled ?? true,
      inAppEnabled: settings?.in_app_notifications_enabled ?? true,
    },
  };
}
