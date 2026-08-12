import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getActivePropertyId } from "./shared";

export type SettingsSnapshot = {
  propertyId: string;
  propertyName: string;
  propertyAddress: string | null;
  defaultElectricityRate: number;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
};

// Settings (and the property name/address Settings also edits) is a
// real one-row-per-property singleton — there is no ephemeral-unit
// trick available the way there is for billing/payments/SOA. Snapshot
// the real row(s), let the test mutate them, then restore exactly what
// was there before. See tests/support/README.md.
export async function snapshotSettings(supabase: SupabaseClient<Database>): Promise<SettingsSnapshot> {
  const propertyId = await getActivePropertyId(supabase);

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("name, address")
    .eq("id", propertyId)
    .single();
  if (propertyError) throw propertyError;

  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("default_electricity_rate, email_notifications_enabled, in_app_notifications_enabled")
    .eq("property_id", propertyId)
    .maybeSingle();
  if (settingsError) throw settingsError;

  return {
    propertyId,
    propertyName: property.name,
    propertyAddress: property.address,
    defaultElectricityRate: settings?.default_electricity_rate ?? 15,
    emailNotificationsEnabled: settings?.email_notifications_enabled ?? true,
    inAppNotificationsEnabled: settings?.in_app_notifications_enabled ?? true,
  };
}

export async function restoreSettings(
  supabase: SupabaseClient<Database>,
  snapshot: SettingsSnapshot,
): Promise<void> {
  const { error: propertyError } = await supabase
    .from("properties")
    .update({ name: snapshot.propertyName, address: snapshot.propertyAddress })
    .eq("id", snapshot.propertyId);
  if (propertyError) throw propertyError;

  const { error: settingsError } = await supabase.from("settings").upsert(
    {
      property_id: snapshot.propertyId,
      default_electricity_rate: snapshot.defaultElectricityRate,
      email_notifications_enabled: snapshot.emailNotificationsEnabled,
      in_app_notifications_enabled: snapshot.inAppNotificationsEnabled,
    },
    { onConflict: "property_id" },
  );
  if (settingsError) throw settingsError;
}
