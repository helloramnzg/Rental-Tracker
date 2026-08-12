import { createClient } from "@/lib/supabase/server";
import { getPaymentsContext } from "@/services/payments/get-payments-context";
import { PaymentsView } from "@/features/payments/components/payments-view";
import { formatMonthLabel } from "@/utils/format-month-label";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? Number(params.year) : now.getFullYear();
  const month = params.month ? Number(params.month) : now.getMonth() + 1;

  const supabase = await createClient();
  const context = await getPaymentsContext(supabase, { year, month });

  return (
    <PaymentsView
      year={year}
      month={month}
      monthLabel={formatMonthLabel(year, month)}
      context={context}
    />
  );
}
