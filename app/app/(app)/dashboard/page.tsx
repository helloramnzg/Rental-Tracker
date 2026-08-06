import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

// Empty state copy per docs/design/23-dashboard-spec.md "New User".
export default function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" />
      <EmptyState
        icon={ClipboardList}
        title="Welcome to Rental Tracker"
        action={<Button>Create Your First Billing Cycle</Button>}
      />
    </>
  );
}
