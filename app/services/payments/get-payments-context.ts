import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { computePaymentStatus, type PaymentStatus } from "./compute-payment-status";

export type TenantPaymentRow = {
  tenantId: string;
  tenantName: string;
  unitName: string;
  totalDue: number;
  amountPaid: number;
  outstanding: number;
  status: PaymentStatus;
};

export type PaymentHistoryEntry = {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  paymentDate: string;
  method: Database["public"]["Enums"]["payment_method"];
  referenceNumber: string | null;
  notes: string | null;
};

export type PaymentsContext = {
  billingCycle: {
    id: string;
    status: Database["public"]["Tables"]["billing_cycles"]["Row"]["status"];
  } | null;
  tenantRows: TenantPaymentRow[];
  history: PaymentHistoryEntry[];
  summary: { totalDue: number; totalReceived: number; totalOutstanding: number };
};

// Loads everything the Payments screen needs for a given month, scoped
// to that month's billing cycle — same convention as the Billing and
// SOA screens (docs/design/22-layout-system.md Payments Screen:
// Header → Payment Summary → Outstanding Balances → Payment History →
// Record Payment).
export async function getPaymentsContext(
  supabase: SupabaseClient<Database>,
  { year, month }: { year: number; month: number },
): Promise<PaymentsContext> {
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
    return {
      billingCycle: null,
      tenantRows: [],
      history: [],
      summary: { totalDue: 0, totalReceived: 0, totalOutstanding: 0 },
    };
  }

  const { data: charges, error: chargesError } = await supabase
    .from("charges")
    .select("tenant_id, total_due, tenant:tenants(full_name, unit:units(name))")
    .eq("billing_cycle_id", cycle.id);
  if (chargesError) throw chargesError;

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(
      "id, tenant_id, amount, payment_date, method, reference_number, notes, tenant:tenants(full_name)",
    )
    .eq("billing_cycle_id", cycle.id)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (paymentsError) throw paymentsError;

  const tenantRows: TenantPaymentRow[] = (charges ?? []).map((c) => {
    const tenant = Array.isArray(c.tenant) ? c.tenant[0] : c.tenant;
    const unit = tenant ? (Array.isArray(tenant.unit) ? tenant.unit[0] : tenant.unit) : null;
    const amountPaid = (payments ?? [])
      .filter((p) => p.tenant_id === c.tenant_id)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      tenantId: c.tenant_id,
      tenantName: tenant?.full_name ?? "",
      unitName: unit?.name ?? "",
      totalDue: c.total_due,
      amountPaid,
      outstanding: c.total_due - amountPaid,
      status: computePaymentStatus(c.total_due, amountPaid),
    };
  });

  const history: PaymentHistoryEntry[] = (payments ?? []).map((p) => {
    const tenant = Array.isArray(p.tenant) ? p.tenant[0] : p.tenant;
    return {
      id: p.id,
      tenantId: p.tenant_id,
      tenantName: tenant?.full_name ?? "",
      amount: p.amount,
      paymentDate: p.payment_date,
      method: p.method,
      referenceNumber: p.reference_number,
      notes: p.notes,
    };
  });

  const summary = tenantRows.reduce(
    (acc, row) => ({
      totalDue: acc.totalDue + row.totalDue,
      totalReceived: acc.totalReceived + row.amountPaid,
      totalOutstanding: acc.totalOutstanding + row.outstanding,
    }),
    { totalDue: 0, totalReceived: 0, totalOutstanding: 0 },
  );

  return { billingCycle: { id: cycle.id, status: cycle.status }, tenantRows, history, summary };
}
