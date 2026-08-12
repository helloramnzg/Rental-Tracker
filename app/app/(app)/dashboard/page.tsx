import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getDashboardContext } from "@/services/dashboard/get-dashboard-context";
import { getCurrentUserContext } from "@/services/settings/get-current-user-context";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

function timeOfDayGreeting(date: Date): "morning" | "afternoon" | "evening" {
  const hour = date.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const supabase = await createClient();
  const [context, user] = await Promise.all([
    getDashboardContext(supabase, { year, month }),
    getCurrentUserContext(supabase),
  ]);

  // Per docs/design/23-dashboard-spec.md "New User" empty state — only
  // when there's no billing history at all, not just none this month.
  const isNewUser = context.monthlyCashFlow.length === 0 && context.tenantRows.length === 0;

  const firstName = user?.fullName.trim().split(/\s+/)[0] || null;

  return (
    <>
      {isNewUser ? (
        <>
          <PageHeader title="Dashboard" description={context.monthLabel} />
          <EmptyState
            icon={ClipboardList}
            title="Welcome to Upa OS"
            action={
              <Button nativeButton={false} render={<Link href="/billing" />}>
                Create Your First Billing Cycle
              </Button>
            }
          />
        </>
      ) : (
        <DashboardView
          context={context}
          greeting={{ timeOfDay: timeOfDayGreeting(now), name: firstName }}
        />
      )}
    </>
  );
}
