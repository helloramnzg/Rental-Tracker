import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type TenantDetail = {
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
  createdAt: string;
  updatedAt: string;
};

export async function getTenantDetail(
  supabase: SupabaseClient<Database>,
  { tenantId }: { tenantId: string },
): Promise<TenantDetail | null> {
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select(
      "id, full_name, unit_id, monthly_rent, active, mobile, email, notes, start_date, end_date, created_at, updated_at, unit:units(name)",
    )
    .eq("id", tenantId)
    .maybeSingle();
  if (error) throw error;
  if (!tenant) return null;

  const unit = Array.isArray(tenant.unit) ? tenant.unit[0] : tenant.unit;

  return {
    id: tenant.id,
    fullName: tenant.full_name,
    unitId: tenant.unit_id,
    unitName: unit?.name ?? "",
    monthlyRent: tenant.monthly_rent,
    active: tenant.active,
    mobile: tenant.mobile,
    email: tenant.email,
    notes: tenant.notes,
    startDate: tenant.start_date,
    endDate: tenant.end_date,
    createdAt: tenant.created_at,
    updatedAt: tenant.updated_at,
  };
}
