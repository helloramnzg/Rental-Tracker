import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type TenantListItem = {
  id: string;
  fullName: string;
  unitId: string;
  unitName: string;
  monthlyRent: number;
  active: boolean;
  mobile: string | null;
  email: string | null;
  notes: string | null;
  startDate: string;
  endDate: string | null;
};

export async function getTenantsList(
  supabase: SupabaseClient<Database>,
): Promise<TenantListItem[]> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();
  if (propertyError) throw propertyError;

  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select(
      "id, full_name, unit_id, monthly_rent, active, mobile, email, notes, start_date, end_date, unit:units!inner(name, property_id)",
    )
    .eq("units.property_id", property.id)
    .order("full_name");
  if (tenantsError) throw tenantsError;

  return (tenants ?? []).map((t) => {
    const unit = Array.isArray(t.unit) ? t.unit[0] : t.unit;
    return {
      id: t.id,
      fullName: t.full_name,
      unitId: t.unit_id,
      unitName: unit?.name ?? "",
      monthlyRent: t.monthly_rent,
      active: t.active,
      mobile: t.mobile,
      email: t.email,
      notes: t.notes,
      startDate: t.start_date,
      endDate: t.end_date,
    };
  });
}
