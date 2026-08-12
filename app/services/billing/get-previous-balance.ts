import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// Outstanding balance carries forward (docs/product/18-payment-system.md).
// A tenant's previous_balance for a given month is whatever remained
// unpaid on their most recent prior billing cycle: that cycle's
// total_due minus payments recorded against it. total_due already
// embeds any earlier carried-forward balance, so this correctly
// compounds across multiple unpaid months without double-counting.
export async function getPreviousBalance(
  supabase: SupabaseClient<Database>,
  {
    propertyId,
    tenantId,
    beforeYear,
    beforeMonth,
  }: {
    propertyId: string;
    tenantId: string;
    beforeYear: number;
    beforeMonth: number;
  },
): Promise<number> {
  const { data: priorCycles, error: cyclesError } = await supabase
    .from("billing_cycles")
    .select("id, year, month")
    .eq("property_id", propertyId)
    .or(
      `year.lt.${beforeYear},and(year.eq.${beforeYear},month.lt.${beforeMonth})`,
    )
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1);

  if (cyclesError) throw cyclesError;

  const priorCycle = priorCycles?.[0];
  if (!priorCycle) return 0;

  const { data: charge, error: chargeError } = await supabase
    .from("charges")
    .select("total_due")
    .eq("billing_cycle_id", priorCycle.id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (chargeError) throw chargeError;
  if (!charge) return 0;

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("billing_cycle_id", priorCycle.id)
    .eq("tenant_id", tenantId);

  if (paymentsError) throw paymentsError;

  const paid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);

  return charge.total_due - paid;
}
