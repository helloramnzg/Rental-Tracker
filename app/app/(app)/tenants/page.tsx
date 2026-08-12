import { createClient } from "@/lib/supabase/server";
import { getTenantsList } from "@/services/tenants/get-tenants-list";
import { getUnitsForTenantForm } from "@/services/tenants/get-units-for-tenant-form";
import { getPropertySummary } from "@/services/shell/get-property-summary";
import { PageHeader } from "@/components/layout/page-header";
import { TenantListView } from "@/features/tenants/components/tenant-list-view";

export default async function TenantsPage() {
  const supabase = await createClient();
  const [tenants, units, property] = await Promise.all([
    getTenantsList(supabase),
    getUnitsForTenantForm(supabase),
    getPropertySummary(supabase),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={property.name}
        title="Tenants"
        description="Manage tenant records, units, rent, and lease details."
      />
      <TenantListView tenants={tenants} units={units} />
    </>
  );
}
