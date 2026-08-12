import { createClient } from "@/lib/supabase/server";
import { getSettingsContext } from "@/services/settings/get-settings-context";
import { getCurrentUserContext } from "@/services/settings/get-current-user-context";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsView } from "@/features/settings/components/settings-view";

export default async function SettingsPage() {
  const supabase = await createClient();
  const [settings, user] = await Promise.all([
    getSettingsContext(supabase),
    getCurrentUserContext(supabase),
  ]);

  // Middleware already guarantees an authenticated session for this
  // route (lib/supabase/middleware.ts), so `user` is never null here.
  return (
    <>
      <PageHeader
        eyebrow="Workspace configuration"
        title="Settings"
        description="Property, billing, profile, security, and notification preferences."
      />
      <SettingsView settings={settings} user={user!} />
    </>
  );
}
