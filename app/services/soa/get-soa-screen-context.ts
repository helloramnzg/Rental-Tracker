import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SoaCardInfo = {
  tenantId: string;
  tenantName: string;
  unitName: string;
  generatedSoaId: string | null;
  generatedAt: string | null;
  emailedAt: string | null;
};

export type SoaScreenContext = {
  billingCycle: {
    id: string;
    status: Database["public"]["Tables"]["billing_cycles"]["Row"]["status"];
  } | null;
  cards: SoaCardInfo[];
};

export async function getSoaScreenContext(
  supabase: SupabaseClient<Database>,
  { year, month }: { year: number; month: number },
): Promise<SoaScreenContext> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();
  if (propertyError) throw propertyError;

  const { data: cycle, error: cycleError } = await supabase
    .from("billing_cycles")
    .select("id, status")
    .eq("property_id", property.id)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();
  if (cycleError) throw cycleError;

  if (!cycle) {
    return { billingCycle: null, cards: [] };
  }

  const { data: charges, error: chargesError } = await supabase
    .from("charges")
    .select("tenant_id, tenant:tenants(full_name, unit:units(name))")
    .eq("billing_cycle_id", cycle.id);
  if (chargesError) throw chargesError;

  const { data: soas, error: soasError } = await supabase
    .from("generated_soas")
    .select("id, tenant_id, generated_at, emailed_at")
    .eq("billing_cycle_id", cycle.id);
  if (soasError) throw soasError;

  const cards: SoaCardInfo[] = (charges ?? []).map((c) => {
    const tenant = Array.isArray(c.tenant) ? c.tenant[0] : c.tenant;
    const unit = tenant ? (Array.isArray(tenant.unit) ? tenant.unit[0] : tenant.unit) : null;
    const soa = soas?.find((s) => s.tenant_id === c.tenant_id) ?? null;

    return {
      tenantId: c.tenant_id,
      tenantName: tenant?.full_name ?? "",
      unitName: unit?.name ?? "",
      generatedSoaId: soa?.id ?? null,
      generatedAt: soa?.generated_at ?? null,
      emailedAt: soa?.emailed_at ?? null,
    };
  });

  return { billingCycle: { id: cycle.id, status: cycle.status }, cards };
}
