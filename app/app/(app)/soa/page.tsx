import { createClient } from "@/lib/supabase/server";
import { getSoaScreenContext } from "@/services/soa/get-soa-screen-context";
import { PageHeader } from "@/components/layout/page-header";
import { SoaView } from "@/features/soa/components/soa-view";

export default async function SoaPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const supabase = await createClient();
  const context = await getSoaScreenContext(supabase, { year, month });

  return (
    <>
      <PageHeader title="Statements of Account" />
      <SoaView year={year} month={month} context={context} />
    </>
  );
}
