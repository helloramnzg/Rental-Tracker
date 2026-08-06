import { createClient } from "@/lib/supabase/server";
import { getBillingContext } from "@/services/billing/get-billing-context";
import { PageHeader } from "@/components/layout/page-header";
import { BillingForm } from "@/features/billing/components/billing-form";

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const supabase = await createClient();
  const context = await getBillingContext(supabase, { year, month });

  return (
    <>
      <PageHeader title="Monthly Billing" />
      <BillingForm year={year} month={month} context={context} />
    </>
  );
}
