import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPreviousBalance } from "./get-previous-balance";

export type TenantBillingInfo = {
  tenant: Database["public"]["Tables"]["tenants"]["Row"];
  unit: Database["public"]["Tables"]["units"]["Row"];
  previousBalance: number;
  existingCharge: Database["public"]["Tables"]["charges"]["Row"] | null;
};

export type ExistingBillingCycle = {
  billingCycle: Database["public"]["Tables"]["billing_cycles"]["Row"];
  meterReading: Database["public"]["Tables"]["meter_readings"]["Row"] | null;
};

export type BillingContext = {
  property: Database["public"]["Tables"]["properties"]["Row"];
  settings: Database["public"]["Tables"]["settings"]["Row"] | null;
  tenants: TenantBillingInfo[];
  previousReading: number;
  existingCycle: ExistingBillingCycle | null;
};

// Loads everything the Billing screen needs for a given month: the
// property, its settings (for the default electricity rate), active
// tenants with their units and carried-forward balance, the previous
// submeter reading (read-only per docs/design/24-billing-screen.md),
// and — if this month was already billed — the existing draft to edit.
export async function getBillingContext(
  supabase: SupabaseClient<Database>,
  { year, month }: { year: number; month: number },
): Promise<BillingContext> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("active", true)
    .limit(1)
    .single();

  if (propertyError) throw propertyError;

  const [
    { data: settings, error: settingsError },
    { data: tenants, error: tenantsError },
  ] = await Promise.all([
    supabase
      .from("settings")
      .select("*")
      .eq("property_id", property.id)
      .maybeSingle(),
    supabase
      .from("tenants")
      .select("*, unit:units!inner(*)")
      .eq("active", true)
      .eq("units.property_id", property.id),
  ]);

  if (settingsError) throw settingsError;
  if (tenantsError) throw tenantsError;

  const { data: priorCycles, error: priorError } = await supabase
    .from("billing_cycles")
    .select("id, year, month, meter_readings(current_reading)")
    .eq("property_id", property.id)
    .or(`year.lt.${year},and(year.eq.${year},month.lt.${month})`)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1);

  if (priorError) throw priorError;

  const priorReadingRaw = priorCycles?.[0]?.meter_readings;
  const previousReading =
    (Array.isArray(priorReadingRaw)
      ? priorReadingRaw[0]?.current_reading
      : priorReadingRaw?.current_reading) ?? 0;

  const { data: cycle, error: cycleError } = await supabase
    .from("billing_cycles")
    .select("*, meter_readings(*), charges(*)")
    .eq("property_id", property.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (cycleError) throw cycleError;

  const existingCharges = cycle?.charges ?? [];

  const existingCycle: ExistingBillingCycle | null = cycle
    ? {
        billingCycle: {
          id: cycle.id,
          property_id: cycle.property_id,
          year: cycle.year,
          month: cycle.month,
          mother_meter_bill: cycle.mother_meter_bill,
          status: cycle.status,
          created_at: cycle.created_at,
        },
        meterReading: Array.isArray(cycle.meter_readings)
          ? (cycle.meter_readings[0] ?? null)
          : cycle.meter_readings,
      }
    : null;

  const tenantInfos: TenantBillingInfo[] = await Promise.all(
    (tenants ?? []).map(async (t) => {
      const { unit, ...tenant } = t as unknown as {
        unit: Database["public"]["Tables"]["units"]["Row"];
      } & Database["public"]["Tables"]["tenants"]["Row"];

      const previousBalance = await getPreviousBalance(supabase, {
        propertyId: property.id,
        tenantId: tenant.id,
        beforeYear: year,
        beforeMonth: month,
      });

      const existingCharge =
        existingCharges.find((c) => c.tenant_id === tenant.id) ?? null;

      return { tenant, unit, previousBalance, existingCharge };
    }),
  );

  return {
    property,
    settings: settings ?? null,
    tenants: tenantInfos,
    previousReading,
    existingCycle,
  };
}
