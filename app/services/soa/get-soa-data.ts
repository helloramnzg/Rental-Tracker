import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  computePaymentStatus,
  type PaymentStatus,
} from "@/services/payments/compute-payment-status";

export type { PaymentStatus };

export type SoaData = {
  property: { name: string; address: string | null };
  tenant: { fullName: string; dueDay: number | null };
  unit: { name: string };
  billingCycle: { year: number; month: number; motherMeterBill: number };
  meterReading: {
    previousReading: number;
    currentReading: number;
    usageKwh: number;
    ratePerKwh: number;
  };
  charges: {
    rent: number;
    electricity: number;
    water: number;
    otherCharges: number;
    previousBalance: number;
    totalDue: number;
  };
  amountPaid: number;
  paymentStatus: PaymentStatus;
};

// Loads everything needed to render an SOA, entirely from the stored
// billing snapshot (docs/architecture/10-pdf-generation.md: "PDFs are
// generated from billing snapshots, never from live tenant data").
// The only live reads are tenant.full_name/due_day and unit/property
// names, which are labels, not billing amounts.
export async function getSoaData(
  supabase: SupabaseClient<Database>,
  { billingCycleId, tenantId }: { billingCycleId: string; tenantId: string },
): Promise<SoaData> {
  const { data: cycle, error: cycleError } = await supabase
    .from("billing_cycles")
    .select("year, month, mother_meter_bill, property:properties(name, address)")
    .eq("id", billingCycleId)
    .single();
  if (cycleError) throw cycleError;

  const { data: meterReading, error: meterError } = await supabase
    .from("meter_readings")
    .select("previous_reading, current_reading, usage_kwh, rate_per_kwh")
    .eq("billing_cycle_id", billingCycleId)
    .single();
  if (meterError) throw meterError;

  const { data: charges, error: chargesError } = await supabase
    .from("charges")
    .select("rent, electricity, water, other_charges, previous_balance, total_due")
    .eq("billing_cycle_id", billingCycleId)
    .eq("tenant_id", tenantId)
    .single();
  if (chargesError) throw chargesError;

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("full_name, due_day, unit:units(name)")
    .eq("id", tenantId)
    .single();
  if (tenantError) throw tenantError;

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount")
    .eq("billing_cycle_id", billingCycleId)
    .eq("tenant_id", tenantId);
  if (paymentsError) throw paymentsError;

  const amountPaid = (payments ?? []).reduce((sum, p) => sum + p.amount, 0);

  const property = Array.isArray(cycle.property) ? cycle.property[0] : cycle.property;
  const unit = Array.isArray(tenant.unit) ? tenant.unit[0] : tenant.unit;

  return {
    property: { name: property?.name ?? "", address: property?.address ?? null },
    tenant: { fullName: tenant.full_name, dueDay: tenant.due_day },
    unit: { name: unit?.name ?? "" },
    billingCycle: {
      year: cycle.year,
      month: cycle.month,
      motherMeterBill: cycle.mother_meter_bill,
    },
    meterReading: {
      previousReading: meterReading.previous_reading,
      currentReading: meterReading.current_reading,
      usageKwh: meterReading.usage_kwh,
      ratePerKwh: meterReading.rate_per_kwh,
    },
    charges: {
      rent: charges.rent,
      electricity: charges.electricity,
      water: charges.water,
      otherCharges: charges.other_charges,
      previousBalance: charges.previous_balance,
      totalDue: charges.total_due,
    },
    amountPaid,
    paymentStatus: computePaymentStatus(charges.total_due, amountPaid),
  };
}
