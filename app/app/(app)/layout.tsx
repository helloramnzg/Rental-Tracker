import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPropertySummary } from "@/services/shell/get-property-summary";
import { getCurrentUserContext } from "@/services/settings/get-current-user-context";
import { getNotifications } from "@/services/notifications/get-notifications";
import { AppShell } from "@/components/layout/app-shell";

// Every authenticated page reads live billing/tenant/payment data via
// the Supabase client, whose underlying fetch() calls Next.js would
// otherwise cache indefinitely (its Data Cache applies to any fetch()
// call by default, independent of whether the route itself is
// dynamic). Financial data must never be served stale.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const now = new Date();
  const [property, user, notifications] = await Promise.all([
    getPropertySummary(supabase),
    getCurrentUserContext(supabase),
    getNotifications(supabase, { year: now.getFullYear(), month: now.getMonth() + 1 }),
  ]);

  return (
    <AppShell
      property={property}
      landlordName={user?.fullName ?? ""}
      notifications={notifications.items}
    >
      {children}
    </AppShell>
  );
}
