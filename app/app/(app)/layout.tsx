import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getPropertySummary } from "@/services/shell/get-property-summary";
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
  const property = await getPropertySummary(supabase);

  return <AppShell property={property}>{children}</AppShell>;
}
