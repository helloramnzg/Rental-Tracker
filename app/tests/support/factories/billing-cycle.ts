import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { calculateElectricity } from "@/services/billing/calculate-electricity";
import { calculateCharges } from "@/services/billing/calculate-charges";
import { getActivePropertyId } from "./shared";
import { randomTestYear, randomMonth } from "../random";

export type BillingCycleFixture = {
  billingCycleId: string;
  year: number;
  month: number;
  tenantId: string;
  totalDue: number;
  cleanup: () => Promise<void>;
};

const MAX_ATTEMPTS = 5;
const UNIQUE_VIOLATION = "23505";

// Shared by this factory's own cleanup and by Billing's integration
// tests, which create cycles via saveBillingCycle directly rather than
// this factory and need the same teardown order: payments first
// (billing_cycle_id is ON DELETE RESTRICT), then the cycle itself
// (cascades to meter_readings, charges, generated_soas).
export async function deleteBillingCycles(
  supabase: SupabaseClient<Database>,
  billingCycleIds: string[],
): Promise<void> {
  if (billingCycleIds.length === 0) return;
  const { error: paymentsError } = await supabase
    .from("payments")
    .delete()
    .in("billing_cycle_id", billingCycleIds);
  if (paymentsError) throw paymentsError;
  const { error: cyclesError } = await supabase
    .from("billing_cycles")
    .delete()
    .in("id", billingCycleIds);
  if (cyclesError) throw cyclesError;
}

// Builds one fully-charged billing cycle for a fixture tenant, at a
// random far-future year/month so it can never collide with real data.
// Uses the same pure calculation functions the real billing service
// uses, but writes directly to the tables rather than calling
// saveBillingCycle — this is fixture setup for OTHER domains' tests
// (Payments, SOA). Billing's own integration tests call
// saveBillingCycle directly, since that's the code under test there.
export async function createBillingCycleFixture(
  supabase: SupabaseClient<Database>,
  {
    tenantId,
    electricityType = "submeter",
    rent = 5000,
    otherCharges = 0,
    motherMeterBill = 1000,
    previousReading = 0,
    currentReading = 50,
    electricityRate = 15,
    previousBalance = 0,
    status,
  }: {
    tenantId: string;
    electricityType?: Database["public"]["Enums"]["unit_electricity_type"];
    rent?: number;
    otherCharges?: number;
    motherMeterBill?: number;
    previousReading?: number;
    currentReading?: number;
    electricityRate?: number;
    previousBalance?: number;
    status?: Database["public"]["Enums"]["billing_cycle_status"];
  },
): Promise<BillingCycleFixture> {
  const propertyId = await getActivePropertyId(supabase);

  const electricity = calculateElectricity({
    previousReading,
    currentReading,
    ratePerKwh: electricityRate,
    motherMeterBill,
  });
  const electricityForTenant =
    electricityType === "submeter" ? electricity.unit1Electricity : electricity.unit2Electricity;

  let cycleId: string | null = null;
  let year = 0;
  let month = 0;

  for (let attempt = 0; attempt < MAX_ATTEMPTS && !cycleId; attempt += 1) {
    year = randomTestYear();
    month = randomMonth();

    const { data, error } = await supabase
      .from("billing_cycles")
      .insert({
        property_id: propertyId,
        year,
        month,
        mother_meter_bill: motherMeterBill,
        billing_date: `${year}-${String(month).padStart(2, "0")}-01`,
        status: status ?? "draft",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === UNIQUE_VIOLATION) continue;
      throw error;
    }
    cycleId = data.id;
  }
  if (!cycleId) {
    throw new Error(`Could not allocate a free (year, month) for a test billing cycle after ${MAX_ATTEMPTS} attempts.`);
  }

  const { error: meterError } = await supabase.from("meter_readings").insert({
    billing_cycle_id: cycleId,
    previous_reading: previousReading,
    current_reading: currentReading,
    usage_kwh: electricity.usageKwh,
    rate_per_kwh: electricityRate,
    unit1_electricity: electricity.unit1Electricity,
    unit2_electricity: electricity.unit2Electricity,
  });
  if (meterError) throw meterError;

  const charges = calculateCharges({
    rent,
    electricity: electricityForTenant,
    otherCharges,
    previousBalance,
  });

  const { error: chargeError } = await supabase.from("charges").insert({
    billing_cycle_id: cycleId,
    tenant_id: tenantId,
    rent: charges.rent,
    electricity: charges.electricity,
    water: charges.water,
    other_charges: charges.otherCharges,
    previous_balance: charges.previousBalance,
    total_due: charges.totalDue,
  });
  if (chargeError) throw chargeError;

  const id = cycleId;
  return {
    billingCycleId: id,
    year,
    month,
    tenantId,
    totalDue: charges.totalDue,
    cleanup: () => deleteBillingCycles(supabase, [id]),
  };
}
