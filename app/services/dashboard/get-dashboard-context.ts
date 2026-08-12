import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPaymentsContext, type TenantPaymentRow } from "@/services/payments/get-payments-context";
import { getSoaScreenContext } from "@/services/soa/get-soa-screen-context";
import { getOccupiedUnitsStat, type OccupiedUnitsStat } from "@/services/tenants/get-occupied-units-stat";
import { getUpcomingReminder } from "./get-upcoming-reminder";
import { getDashboardStatus, type DashboardStatus } from "./get-dashboard-status";
import type { PaymentStatus } from "@/services/payments/compute-payment-status";

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export type ActivityItem = {
  id: string;
  type: "billing" | "soa" | "payment";
  description: string;
  timestamp: string;
};

export type MonthlyCashFlowPoint = {
  label: string;
  billed: number;
  collected: number;
  outstanding: number;
};

export type DashboardContext = {
  year: number;
  month: number;
  monthLabel: string;
  checklist: ChecklistItem[];
  kpis: {
    outstandingBalance: number;
    collectedThisMonth: number;
    pendingSoas: { pending: number; total: number } | null;
    upcomingReminder: { label: string; date: string };
    occupiedUnits: OccupiedUnitsStat;
  };
  tenantRows: TenantPaymentRow[];
  paymentStatusBreakdown: { status: PaymentStatus; count: number }[];
  monthlyCashFlow: MonthlyCashFlowPoint[];
  recentActivity: ActivityItem[];
  status: DashboardStatus;
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Aggregates everything the Dashboard needs. Reuses getPaymentsContext
// and getSoaScreenContext rather than re-querying the same tables
// (per AGENTS.md "Never duplicate calculations" / "Reuse existing
// services").
export async function getDashboardContext(
  supabase: SupabaseClient<Database>,
  { year, month }: { year: number; month: number },
): Promise<DashboardContext> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();
  if (propertyError) throw propertyError;

  const [paymentsContext, soaContext, occupiedUnits] = await Promise.all([
    getPaymentsContext(supabase, { year, month }),
    getSoaScreenContext(supabase, { year, month }),
    getOccupiedUnitsStat(supabase, { propertyId: property.id }),
  ]);

  const hasCycle = paymentsContext.billingCycle !== null;
  const soaGenerated = soaContext.cards.filter((c) => c.generatedSoaId !== null).length;
  const soaTotal = soaContext.cards.length;

  const checklist: ChecklistItem[] = [
    {
      id: "billing",
      label: "Complete Monthly Billing",
      done: hasCycle,
      href: "/billing",
    },
    {
      id: "soa",
      label: "Generate SOAs",
      done: hasCycle && soaTotal > 0 && soaGenerated === soaTotal,
      href: "/soa",
    },
    {
      id: "payments",
      label: "Record Payments",
      done: hasCycle && paymentsContext.summary.totalOutstanding <= 0,
      href: "/payments",
    },
  ];

  const paymentStatusCounts = new Map<PaymentStatus, number>([
    ["outstanding", 0],
    ["partial", 0],
    ["paid", 0],
  ]);
  for (const row of paymentsContext.tenantRows) {
    paymentStatusCounts.set(row.status, (paymentStatusCounts.get(row.status) ?? 0) + 1);
  }
  const paymentStatusBreakdown = Array.from(paymentStatusCounts.entries()).map(
    ([status, count]) => ({ status, count }),
  );

  const monthlyCashFlow = await getMonthlyCashFlow(supabase, { propertyId: property.id, year, month });

  const recentActivity = await getRecentActivity(supabase, { propertyId: property.id });

  const reminder = getUpcomingReminder(new Date());

  const pendingSoas = hasCycle ? { pending: soaTotal - soaGenerated, total: soaTotal } : null;

  const status = getDashboardStatus({
    checklist,
    tenantRows: paymentsContext.tenantRows,
    pendingSoas,
    monthlyCashFlow,
  });

  return {
    year,
    month,
    monthLabel: `${MONTH_NAMES[month - 1]} ${year}`,
    checklist,
    kpis: {
      outstandingBalance: paymentsContext.summary.totalOutstanding,
      collectedThisMonth: paymentsContext.summary.totalReceived,
      pendingSoas,
      upcomingReminder: {
        label: reminder.label,
        date: reminder.date,
      },
      occupiedUnits,
    },
    tenantRows: paymentsContext.tenantRows,
    paymentStatusBreakdown,
    monthlyCashFlow,
    recentActivity,
    status,
  };
}

async function getMonthlyCashFlow(
  supabase: SupabaseClient<Database>,
  { propertyId, year, month }: { propertyId: string; year: number; month: number },
): Promise<MonthlyCashFlowPoint[]> {
  const { data: cycles, error: cyclesError } = await supabase
    .from("billing_cycles")
    .select("id, year, month")
    .eq("property_id", propertyId)
    .or(`year.lt.${year},and(year.eq.${year},month.lte.${month})`)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(6);
  if (cyclesError) throw cyclesError;
  if (!cycles || cycles.length === 0) return [];

  const cycleIds = cycles.map((c) => c.id);

  const [{ data: charges, error: chargesError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase.from("charges").select("billing_cycle_id, total_due").in("billing_cycle_id", cycleIds),
      supabase.from("payments").select("billing_cycle_id, amount").in("billing_cycle_id", cycleIds),
    ]);
  if (chargesError) throw chargesError;
  if (paymentsError) throw paymentsError;

  const points = cycles.map((cycle) => {
    const billed = (charges ?? [])
      .filter((c) => c.billing_cycle_id === cycle.id)
      .reduce((sum, c) => sum + c.total_due, 0);
    const collected = (payments ?? [])
      .filter((p) => p.billing_cycle_id === cycle.id)
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      label: `${MONTH_NAMES[cycle.month - 1].slice(0, 3)} ${cycle.year}`,
      billed,
      collected,
      outstanding: billed - collected,
    };
  });

  return points.reverse();
}

async function getRecentActivity(
  supabase: SupabaseClient<Database>,
  { propertyId }: { propertyId: string },
): Promise<ActivityItem[]> {
  const [{ data: cycles, error: cyclesError }, { data: soas, error: soasError }, { data: payments, error: paymentsError }] =
    await Promise.all([
      supabase
        .from("billing_cycles")
        .select("id, year, month, created_at")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("generated_soas")
        .select("id, generated_at, tenant:tenants(full_name), billing_cycle:billing_cycles!inner(property_id)")
        .eq("billing_cycle.property_id", propertyId)
        .order("generated_at", { ascending: false })
        .limit(5),
      supabase
        .from("payments")
        .select("id, amount, created_at, tenant:tenants(full_name), billing_cycle:billing_cycles!inner(property_id)")
        .eq("billing_cycle.property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);
  if (cyclesError) throw cyclesError;
  if (soasError) throw soasError;
  if (paymentsError) throw paymentsError;

  const items: ActivityItem[] = [
    ...(cycles ?? []).map((c) => ({
      id: `cycle-${c.id}`,
      type: "billing" as const,
      description: `Billing cycle created — ${MONTH_NAMES[c.month - 1]} ${c.year}`,
      timestamp: c.created_at,
    })),
    ...(soas ?? []).map((s) => {
      const tenant = Array.isArray(s.tenant) ? s.tenant[0] : s.tenant;
      return {
        id: `soa-${s.id}`,
        type: "soa" as const,
        description: `SOA generated — ${tenant?.full_name ?? "tenant"}`,
        timestamp: s.generated_at,
      };
    }),
    ...(payments ?? []).map((p) => {
      const tenant = Array.isArray(p.tenant) ? p.tenant[0] : p.tenant;
      return {
        id: `payment-${p.id}`,
        type: "payment" as const,
        description: `Payment recorded — ${tenant?.full_name ?? "tenant"} (₱${p.amount.toLocaleString("en-PH")})`,
        timestamp: p.created_at,
      };
    }),
  ];

  return items
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8);
}
