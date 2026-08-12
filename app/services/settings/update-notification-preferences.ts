import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function updateNotificationPreferences(
  supabase: SupabaseClient<Database>,
  {
    propertyId,
    emailEnabled,
    inAppEnabled,
  }: { propertyId: string; emailEnabled: boolean; inAppEnabled: boolean },
): Promise<void> {
  const { error } = await supabase.from("settings").upsert(
    {
      property_id: propertyId,
      email_notifications_enabled: emailEnabled,
      in_app_notifications_enabled: inAppEnabled,
    },
    { onConflict: "property_id" },
  );
  if (error) throw error;
}
