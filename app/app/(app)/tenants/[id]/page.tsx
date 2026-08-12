import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTenantDetail } from "@/services/tenants/get-tenant-detail";
import { PageHeader } from "@/components/layout/page-header";
import { TenantDetailView } from "@/features/tenants/components/tenant-detail-view";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const tenant = await getTenantDetail(supabase, { tenantId: id });

  if (!tenant) notFound();

  return (
    <>
      <PageHeader title="Tenant Details" />
      <TenantDetailView tenant={tenant} />
    </>
  );
}
