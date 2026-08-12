import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPreviousBalance } from "./get-previous-balance";
import { calculateCharges } from "./calculate-charges";
import { generateSoasForBillingCycle } from "@/services/soa/generate-and-store-soa";

export type CascadeResult = {
  cascadedCycles: number;
  regeneratedSoaCycles: number;
};

// After editing a billing cycle's charges, every LATER cycle's
// carried-forward previous_balance (and therefore total_due) may now
// be stale, since previous_balance for cycle N+1 is derived from
// cycle N's total_due (services/billing/get-previous-balance.ts).
// Walks forward chronologically, recomputing each subsequent cycle's
// charges from its own already-stored rent/electricity/other_charges
// plus the freshly-recomputed previous_balance — processing strictly
// in chronological order means each cycle reads the already-corrected
// prior cycle, so the recursion resolves correctly without a separate
// diff/dirty-check. Regenerates any SOA that already existed for a
// cascaded cycle so the PDF matches the corrected numbers.
export async function recalculateSubsequentCycles(
  supabase: SupabaseClient<Database>,
  {
    propertyId,
    afterYear,
    afterMonth,
  }: { propertyId: string; afterYear: number; afterMonth: number },
): Promise<CascadeResult> {
  const { data: laterCycles, error: cyclesError } = await supabase
    .from("billing_cycles")
    .select("id, year, month, status")
    .eq("property_id", propertyId)
    .or(`year.gt.${afterYear},and(year.eq.${afterYear},month.gt.${afterMonth})`)
    .order("year", { ascending: true })
    .order("month", { ascending: true });
  if (cyclesError) throw cyclesError;

  let regeneratedSoaCycles = 0;

  for (const cycle of laterCycles ?? []) {
    const { data: charges, error: chargesError } = await supabase
      .from("charges")
      .select("tenant_id, rent, electricity, other_charges")
      .eq("billing_cycle_id", cycle.id);
    if (chargesError) throw chargesError;

    for (const charge of charges ?? []) {
      const previousBalance = await getPreviousBalance(supabase, {
        propertyId,
        tenantId: charge.tenant_id,
        beforeYear: cycle.year,
        beforeMonth: cycle.month,
      });

      const recalculated = calculateCharges({
        rent: charge.rent,
        electricity: charge.electricity,
        otherCharges: charge.other_charges,
        previousBalance,
      });

      const { error: updateError } = await supabase
        .from("charges")
        .update({
          previous_balance: recalculated.previousBalance,
          total_due: recalculated.totalDue,
        })
        .eq("billing_cycle_id", cycle.id)
        .eq("tenant_id", charge.tenant_id);
      if (updateError) throw updateError;
    }

    if (cycle.status === "soa_generated") {
      await generateSoasForBillingCycle(supabase, { billingCycleId: cycle.id });
      regeneratedSoaCycles += 1;
    }
  }

  return { cascadedCycles: laterCycles?.length ?? 0, regeneratedSoaCycles };
}
