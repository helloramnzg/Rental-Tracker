import { Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function TenantsPage() {
  return (
    <>
      <PageHeader title="Tenants" />
      <EmptyState
        icon={Users}
        title="No tenants have been added yet."
        action={<Button>Add Tenant</Button>}
      />
    </>
  );
}
