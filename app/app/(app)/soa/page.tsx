import { createClient } from "@/lib/supabase/server";
import { getSoaScreenContext } from "@/services/soa/get-soa-screen-context";
import { SoaView } from "@/features/soa/components/soa-view";
import { formatMonthLabel } from "@/utils/format-month-label";

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
    <SoaView
      year={year}
      month={month}
      monthLabel={formatMonthLabel(year, month)}
      context={context}
    />
  );
}
