import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { calculateElectricity } from "./calculate-electricity";
import { calculateCharges } from "./calculate-charges";
import { getPreviousBalance } from "./get-previous-balance";
import { recalculateSubsequentCycles, type CascadeResult } from "./recalculate-subsequent-cycles";
import { generateSoasForBillingCycle } from "@/services/soa/generate-and-store-soa";
import type { BillingFormValues } from "@/features/billing/validation/schema";

export class BillingCycleNotEditableError extends Error {
  constructor() {
    super("This billing cycle is closed and can no longer be edited.");
    this.name = "BillingCycleNotEditableError";
  }
}

export type SaveBillingCycleResult = {
  billingCycleId: string;
  ownSoaRegenerated: boolean;
  cascade: CascadeResult;
};

// Orchestrates a full billing cycle save: resolves the property,
// calculates electricity and per-tenant charges, and upserts
// billing_cycles / meter_readings / charges.
//
// Billing edits are allowed at any time, including after SOA
// generation (explicit product decision — see HANDOVER.md and the
// git history around this change for the tradeoffs). Editing a cycle:
//   1. Recalculates that cycle's own charges from the new inputs.
//   2. If that cycle already had a generated SOA, regenerates it so
//      the PDF matches the corrected numbers.
//   3. Cascades forward through every later cycle for this property,
//      since each cycle's previous_balance is derived from the prior
//      cycle's total_due (services/billing/get-previous-balance.ts) —
//      see recalculate-subsequent-cycles.ts.
// Only "closed" cycles remain genuinely locked (docs/business/
// 10-business-rules.md "Closed cycles are read-only") — no current
// workflow sets that status, so this is a forward-looking guard, not
// active behaviour today.
export async function saveBillingCycle(
  supabase: SupabaseClient<Database>,
  input: BillingFormValues,
): Promise<SaveBillingCycleResult> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();
  if (propertyError) throw propertyError;

  const tenantIds = input.tenantCharges.map((t) => t.tenantId);
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, unit:units!inner(electricity_type)")
    .in("id", tenantIds);
  if (tenantsError) throw tenantsError;

  const electricity = calculateElectricity({
    previousReading: input.previousReading,
    currentReading: input.currentReading,
    ratePerKwh: input.electricityRate,
    motherMeterBill: input.motherMeterBill,
  });

  const { data: existingCycle, error: existingError } = await supabase
    .from("billing_cycles")
    .select("id, status")
    .eq("property_id", property.id)
    .eq("year", input.year)
    .eq("month", input.month)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existingCycle && existingCycle.status === "closed") {
    throw new BillingCycleNotEditableError();
  }

  const hadSoaBeforeSave = existingCycle?.status === "soa_generated";

  let billingCycleId = existingCycle?.id;

  if (billingCycleId) {
    const { error } = await supabase
      .from("billing_cycles")
      .update({ mother_meter_bill: input.motherMeterBill, billing_date: input.billingDate })
      .eq("id", billingCycleId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("billing_cycles")
      .insert({
        property_id: property.id,
        year: input.year,
        month: input.month,
        mother_meter_bill: input.motherMeterBill,
        billing_date: input.billingDate,
        status: "draft",
      })
      .select("id")
      .single();
    if (error) throw error;
    billingCycleId = data.id;
  }

  const { error: meterError } = await supabase.from("meter_readings").upsert(
    {
      billing_cycle_id: billingCycleId,
      previous_reading: input.previousReading,
      current_reading: input.currentReading,
      usage_kwh: electricity.usageKwh,
      rate_per_kwh: input.electricityRate,
      unit1_electricity: electricity.unit1Electricity,
      unit2_electricity: electricity.unit2Electricity,
    },
    { onConflict: "billing_cycle_id" },
  );
  if (meterError) throw meterError;

  for (const tenantCharge of input.tenantCharges) {
    const tenant = tenants?.find((t) => t.id === tenantCharge.tenantId);
    if (!tenant) continue;

    const electricityForTenant =
      tenant.unit.electricity_type === "submeter"
        ? electricity.unit1Electricity
        : electricity.unit2Electricity;

    const previousBalance = await getPreviousBalance(supabase, {
      propertyId: property.id,
      tenantId: tenantCharge.tenantId,
      beforeYear: input.year,
      beforeMonth: input.month,
    });

    const charges = calculateCharges({
      rent: tenantCharge.rent,
      electricity: electricityForTenant,
      otherCharges: tenantCharge.otherCharges,
      previousBalance,
    });

    const { error: chargeError } = await supabase.from("charges").upsert(
      {
        billing_cycle_id: billingCycleId,
        tenant_id: tenantCharge.tenantId,
        rent: charges.rent,
        electricity: charges.electricity,
        water: charges.water,
        other_charges: charges.otherCharges,
        previous_balance: charges.previousBalance,
        total_due: charges.totalDue,
      },
      { onConflict: "billing_cycle_id,tenant_id" },
    );
    if (chargeError) throw chargeError;
  }

  let ownSoaRegenerated = false;
  if (hadSoaBeforeSave) {
    await generateSoasForBillingCycle(supabase, { billingCycleId });
    ownSoaRegenerated = true;
  }

  const cascade = await recalculateSubsequentCycles(supabase, {
    propertyId: property.id,
    afterYear: input.year,
    afterMonth: input.month,
  });

  return { billingCycleId, ownSoaRegenerated, cascade };
}
