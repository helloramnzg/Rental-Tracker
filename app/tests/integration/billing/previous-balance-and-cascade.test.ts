import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { signInAsLandlord } from "../../support/clients";
import { createTenantFixture, type TenantFixture } from "../../support/factories/tenant";
import { deleteBillingCycles } from "../../support/factories/billing-cycle";
import { randomTestYear } from "../../support/random";
import { saveBillingCycle } from "@/services/billing/save-billing-cycle";
import { recordPayment } from "@/services/payments/record-payment";
import type { BillingFormValues } from "@/features/billing/validation/schema";

// These tests deliberately keep every cycle for a scenario within the
// SAME random test year (with distinct, increasing months) so that
// "the most recent prior cycle for the property" — which
// getPreviousBalance resolves property-wide, not per-tenant (services/
// billing/get-previous-balance.ts) — can only ever resolve to another
// cycle from this same test, never to real dev data or another test's
// fixtures. See tests/support/README.md.
describe("previous balance carry-forward and cascade recalculation (integration)", () => {
  let supabase: SupabaseClient<Database>;
  let tenant: TenantFixture;
  let year: number;
  const createdCycleIds: string[] = [];

  beforeAll(async () => {
    supabase = await signInAsLandlord();
  });

  beforeEach(async () => {
    tenant = await createTenantFixture(supabase, { electricityType: "submeter" });
    year = randomTestYear();
  });

  afterEach(async () => {
    await deleteBillingCycles(supabase, createdCycleIds.splice(0));
    await tenant.cleanup();
  });

  function cycleInput(month: number, overrides?: Partial<BillingFormValues>): BillingFormValues {
    return {
      year,
      month,
      billingDate: `${year}-${String(month).padStart(2, "0")}-01`,
      motherMeterBill: 1000,
      previousReading: 0,
      currentReading: 20,
      electricityRate: 15,
      tenantCharges: [{ tenantId: tenant.tenantId, rent: 5000, otherCharges: 0 }],
      ...overrides,
    };
  }

  it("carries an unpaid cycle's totalDue forward as the next cycle's previousBalance", async () => {
    const cycle1 = await saveBillingCycle(supabase, cycleInput(1));
    createdCycleIds.push(cycle1.billingCycleId);
    const { data: charge1 } = await supabase
      .from("charges")
      .select("total_due")
      .eq("billing_cycle_id", cycle1.billingCycleId)
      .single();

    const cycle2 = await saveBillingCycle(supabase, cycleInput(2));
    createdCycleIds.push(cycle2.billingCycleId);
    const { data: charge2 } = await supabase
      .from("charges")
      .select("previous_balance, total_due, rent, electricity, water, other_charges")
      .eq("billing_cycle_id", cycle2.billingCycleId)
      .single();

    expect(charge2?.previous_balance).toBe(charge1?.total_due);
    expect(charge2?.total_due).toBe(
      (charge2?.rent ?? 0) +
        (charge2?.electricity ?? 0) +
        (charge2?.water ?? 0) +
        (charge2?.other_charges ?? 0) +
        (charge2?.previous_balance ?? 0),
    );
  });

  it("reduces the carried-forward balance by payments recorded against the prior cycle", async () => {
    const cycle1 = await saveBillingCycle(supabase, cycleInput(1));
    createdCycleIds.push(cycle1.billingCycleId);
    const { data: charge1 } = await supabase
      .from("charges")
      .select("total_due")
      .eq("billing_cycle_id", cycle1.billingCycleId)
      .single();
    const totalDue1 = charge1!.total_due;
    const paidAmount = Math.round(totalDue1 / 2);

    await recordPayment(supabase, {
      billingCycleId: cycle1.billingCycleId,
      tenantId: tenant.tenantId,
      amount: paidAmount,
      paymentDate: `${year}-01-15`,
      method: "cash",
    });

    const cycle2 = await saveBillingCycle(supabase, cycleInput(2));
    createdCycleIds.push(cycle2.billingCycleId);
    const { data: charge2 } = await supabase
      .from("charges")
      .select("previous_balance")
      .eq("billing_cycle_id", cycle2.billingCycleId)
      .single();

    expect(charge2?.previous_balance).toBe(totalDue1 - paidAmount);
  });

  it("cascades a corrected earlier cycle's totalDue into an already-saved later cycle", async () => {
    const cycle1 = await saveBillingCycle(supabase, cycleInput(1, { motherMeterBill: 1000 }));
    createdCycleIds.push(cycle1.billingCycleId);
    const cycle2 = await saveBillingCycle(supabase, cycleInput(2));
    createdCycleIds.push(cycle2.billingCycleId);

    const { data: chargeBefore } = await supabase
      .from("charges")
      .select("previous_balance")
      .eq("billing_cycle_id", cycle2.billingCycleId)
      .single();

    // motherMeterBill alone wouldn't move the needle for a submeter
    // tenant (unit1 electricity is readings × rate, independent of the
    // mother meter bill) — bump the current reading instead so cycle1's
    // electricity charge, and therefore totalDue, actually changes.
    const edited = await saveBillingCycle(supabase, cycleInput(1, { currentReading: 80 }));
    expect(edited.billingCycleId).toBe(cycle1.billingCycleId);
    expect(edited.cascade.cascadedCycles).toBeGreaterThanOrEqual(1);

    const { data: correctedCharge1 } = await supabase
      .from("charges")
      .select("total_due")
      .eq("billing_cycle_id", cycle1.billingCycleId)
      .single();
    const { data: chargeAfter } = await supabase
      .from("charges")
      .select("previous_balance")
      .eq("billing_cycle_id", cycle2.billingCycleId)
      .single();

    expect(chargeAfter?.previous_balance).toBe(correctedCharge1?.total_due);
    expect(chargeAfter?.previous_balance).not.toBe(chargeBefore?.previous_balance);
  });

  it("compounds an unpaid balance across three consecutive cycles without double-counting", async () => {
    const cycle1 = await saveBillingCycle(supabase, cycleInput(1));
    createdCycleIds.push(cycle1.billingCycleId);
    const cycle2 = await saveBillingCycle(supabase, cycleInput(2));
    createdCycleIds.push(cycle2.billingCycleId);
    const cycle3 = await saveBillingCycle(supabase, cycleInput(3));
    createdCycleIds.push(cycle3.billingCycleId);

    const { data: charge2 } = await supabase
      .from("charges")
      .select("total_due")
      .eq("billing_cycle_id", cycle2.billingCycleId)
      .single();
    const { data: charge3 } = await supabase
      .from("charges")
      .select("previous_balance")
      .eq("billing_cycle_id", cycle3.billingCycleId)
      .single();

    // cycle2.total_due already embeds cycle1's carried-forward balance;
    // cycle3.previous_balance must equal it exactly, not
    // cycle1.total_due + cycle2's own charges summed a second time.
    expect(charge3?.previous_balance).toBe(charge2?.total_due);
  });
});
