import Link from "next/link";
import { UserX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function TenantNotFound() {
  return (
    <>
      <PageHeader title="Tenant Details" />
      <EmptyState
        icon={UserX}
        title="This tenant could not be found."
        description="It may have been removed, or the link is incorrect."
        action={
          <Button nativeButton={false} render={<Link href="/tenants" />}>
            Back to Tenants
          </Button>
        }
      />
    </>
  );
}
