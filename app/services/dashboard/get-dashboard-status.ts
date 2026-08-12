import type { ChecklistItem, MonthlyCashFlowPoint } from "./get-dashboard-context";
import type { TenantPaymentRow } from "@/services/payments/get-payments-context";

export type DashboardStatus = {
  /** Top-of-page one-liner, under the greeting. */
  headline: string;
  /** Monthly Checklist card status. */
  checklist: string;
  /** Tenant Payment Status card status. Empty when there's no billing cycle yet (that card already has its own empty-state copy). */
  payments: string;
  /** Monthly Cash Flow trend vs. the previous month. Empty when there isn't a prior month to compare against. */
  cashFlow: string;
};

// Derives short, human status lines from data the Dashboard already
// fetched — no new queries, no UI-side calculation (per AGENTS.md
// "Don't put calculations into UI components"). Exceptions (money
// owed, work not started) always take priority over neutral "all
// good" copy.
export function getDashboardStatus({
  checklist,
  tenantRows,
  pendingSoas,
  monthlyCashFlow,
}: {
  checklist: ChecklistItem[];
  tenantRows: TenantPaymentRow[];
  pendingSoas: { pending: number; total: number } | null;
  monthlyCashFlow: MonthlyCashFlowPoint[];
}): DashboardStatus {
  const billingDone = checklist.find((c) => c.id === "billing")?.done ?? false;
  const soaDone = checklist.find((c) => c.id === "soa")?.done ?? false;
  const paymentsDone = checklist.find((c) => c.id === "payments")?.done ?? false;

  const owingCount = tenantRows.filter((r) => r.status !== "paid").length;

  return {
    headline: getHeadline({ billingDone, soaDone, owingCount, pendingSoas }),
    checklist: getChecklistStatus({ billingDone, soaDone, paymentsDone }),
    payments: getPaymentsStatus({ tenantRows, owingCount }),
    cashFlow: getCashFlowStatus(monthlyCashFlow),
  };
}

function getHeadline({
  billingDone,
  soaDone,
  owingCount,
  pendingSoas,
}: {
  billingDone: boolean;
  soaDone: boolean;
  owingCount: number;
  pendingSoas: { pending: number; total: number } | null;
}): string {
  if (owingCount > 0) {
    return owingCount === 1
      ? "1 payment needs your attention this month."
      : `${owingCount} payments need your attention this month.`;
  }
  if (!billingDone) {
    return "This month's billing hasn't been started yet.";
  }
  if (!soaDone && pendingSoas && pendingSoas.pending > 0) {
    return pendingSoas.pending === 1
      ? "1 statement still needs to be generated."
      : `${pendingSoas.pending} statements still need to be generated.`;
  }
  return "Everything is up to date.";
}

function getChecklistStatus({
  billingDone,
  soaDone,
  paymentsDone,
}: {
  billingDone: boolean;
  soaDone: boolean;
  paymentsDone: boolean;
}): string {
  if (!billingDone) return "Monthly billing still needs to be completed.";
  if (!soaDone) return "Billing is ready — Statements of Account still need to be generated.";
  if (!paymentsDone) return "Statements are out — outstanding balances still need to be collected.";
  return "All monthly billing steps are complete.";
}

function getPaymentsStatus({
  tenantRows,
  owingCount,
}: {
  tenantRows: TenantPaymentRow[];
  owingCount: number;
}): string {
  if (tenantRows.length === 0) return "";
  if (owingCount === 0) return "All tenants are paid up.";
  return owingCount === 1
    ? "1 tenant has an outstanding balance."
    : `${owingCount} tenants have an outstanding balance.`;
}

function getCashFlowStatus(monthlyCashFlow: MonthlyCashFlowPoint[]): string {
  if (monthlyCashFlow.length < 2) return "";
  const current = monthlyCashFlow[monthlyCashFlow.length - 1];
  const previous = monthlyCashFlow[monthlyCashFlow.length - 2];
  if (previous.collected <= 0) return "";

  const changePct = Math.round(
    ((current.collected - previous.collected) / previous.collected) * 100,
  );
  if (changePct === 0) return "Collected income is flat compared with last month.";
  const direction = changePct > 0 ? "up" : "down";
  return `Collected income is ${direction} ${Math.abs(changePct)}% compared with last month.`;
}
