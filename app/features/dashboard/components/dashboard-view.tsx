"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Search,
  Receipt,
  FileText,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  ActivityItem,
  DashboardContext,
} from "@/services/dashboard/get-dashboard-context";
import { formatCurrency } from "@/utils/format-currency";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentStatusChart } from "./payment-status-chart";
import { MonthlyCashFlowChart } from "./monthly-cash-flow-chart";
import type { PaymentStatus } from "@/services/payments/compute-payment-status";

const STATUS_VARIANT: Record<PaymentStatus, "default" | "warning" | "destructive"> = {
  paid: "default",
  partial: "warning",
  outstanding: "destructive",
};

// Each activity type gets a distinct icon + soft tint so the feed is
// scannable at a glance — the same "leading icon identifies the row"
// concept as the reference, adapted to types we actually have instead
// of per-vendor logos.
const ACTIVITY_ICON: Record<ActivityItem["type"], LucideIcon> = {
  billing: Receipt,
  soa: FileText,
  payment: Wallet,
};

const ACTIVITY_TINT: Record<ActivityItem["type"], string> = {
  billing: "bg-info/25",
  soa: "bg-purple/40",
  payment: "bg-success/25",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(`${iso}T00:00:00`));
}

function formatActivityDate(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(iso));
}

function formatActivityTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { timeStyle: "short" }).format(new Date(iso));
}

function tenantInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0].slice(0, 2);
  return initials.toUpperCase();
}

export type DashboardGreeting = {
  timeOfDay: "morning" | "afternoon" | "evening";
  name: string | null;
};

export function DashboardView({
  context,
  greeting,
}: {
  context: DashboardContext;
  greeting: DashboardGreeting;
}) {
  // Most urgent balance to surface in the Attention card — the
  // tenant with the largest amount still outstanding this cycle.
  // Presentation-only selection over already-computed tenantRows; no
  // new calculation. The card itself always renders beside the
  // metrics panel; only its content switches when nothing is owed.
  const mostUrgent = context.tenantRows
    .filter((row) => row.status !== "paid" && row.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding)[0];

  const totalBilled = context.tenantRows.reduce((sum, row) => sum + row.totalDue, 0);
  const totalCollectedShown = context.monthlyCashFlow.reduce((sum, point) => sum + point.collected, 0);

  const [activitySearch, setActivitySearch] = useState("");
  const filteredActivity = context.recentActivity.filter((item) =>
    item.description.toLowerCase().includes(activitySearch.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-caption font-bold tracking-widest text-success uppercase">
          {context.monthLabel} billing cycle
        </p>
        <h1 className="mt-1 text-h1 text-foreground">
          Good {greeting.timeOfDay}
          {greeting.name ? `, ${greeting.name}` : ""}.
        </h1>
        <p className="mt-1.5 text-body text-muted-foreground">{context.status.headline}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg bg-primary px-6 py-6 text-primary-foreground sm:px-8 sm:py-7">
          <p className="text-caption font-bold tracking-widest text-chart-1 uppercase">
            Upcoming reminder · {formatDate(context.kpis.upcomingReminder.date)}
          </p>
          <h2 className="mt-1.5 text-h2 text-primary-foreground">
            {mostUrgent ? `${mostUrgent.tenantName} has a balance due.` : "You're all caught up."}
          </h2>
          <p className="mt-1.5 text-body text-primary-foreground/80">
            {mostUrgent
              ? "Review the outstanding balance and send a reminder before the billing deadline."
              : "No outstanding balances this month — nice work."}
          </p>
          <div className="mt-5 flex flex-col items-start justify-between gap-4 border-t border-primary-foreground/15 pt-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-h2 text-primary-foreground">
                {formatCurrency(mostUrgent ? mostUrgent.outstanding : context.kpis.collectedThisMonth)}
              </p>
              <p className="text-caption text-primary-foreground/70">
                {mostUrgent ? "Outstanding balance" : "Collected this month"} · {context.monthLabel}
              </p>
            </div>
            <Button nativeButton={false} render={<Link href="/payments" />}>
              {mostUrgent ? "Review payment" : "View payments"} <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </div>

        <Card className="h-fit gap-0 py-0">
          <CardContent className="divide-y divide-border px-0">
            <MetricRow label="Occupied Units">
              {context.kpis.occupiedUnits.occupied} / {context.kpis.occupiedUnits.total}
            </MetricRow>
            <MetricRow label="Outstanding Balance">
              {formatCurrency(context.kpis.outstandingBalance)}
            </MetricRow>
            <MetricRow label="Collected This Month">
              {formatCurrency(context.kpis.collectedThisMonth)}
            </MetricRow>
            <MetricRow label="Pending SOAs">
              {context.kpis.pendingSoas ? (
                <Badge variant={context.kpis.pendingSoas.pending === 0 ? "default" : "warning"}>
                  {context.kpis.pendingSoas.total - context.kpis.pendingSoas.pending} of{" "}
                  {context.kpis.pendingSoas.total} generated
                </Badge>
              ) : (
                "—"
              )}
            </MetricRow>
            <MetricRow label="Upcoming Reminder" align="top">
              <span className="flex flex-col items-end">
                <span className="font-semibold text-foreground">
                  {context.kpis.upcomingReminder.label}
                </span>
                <span className="text-caption font-normal text-muted-foreground">
                  {formatDate(context.kpis.upcomingReminder.date)}
                </span>
              </span>
            </MetricRow>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Checklist — {context.monthLabel}</CardTitle>
          <CardDescription>{context.status.checklist}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-3 sm:gap-0 sm:pt-0">
          {context.checklist.map((item, index) => (
            <div
              key={item.id}
              className={
                index === 0
                  ? "flex items-start gap-2.5 py-3 sm:pt-4 sm:pr-4"
                  : "flex items-start gap-2.5 border-t border-border py-3 sm:border-t-0 sm:border-l sm:py-4 sm:pt-4 sm:pl-4"
              }
            >
              {item.done ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-success" />
              ) : (
                <Circle size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex flex-col gap-1">
                <span className={item.done ? "text-body text-foreground" : "text-body text-muted-foreground"}>
                  {item.label}
                </span>
                {!item.done && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto justify-start p-0 text-caption"
                    nativeButton={false}
                    render={<Link href={item.href} />}
                  >
                    Continue <ArrowRight size={12} className="ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Payment Status</CardTitle>
          {context.status.payments && <CardDescription>{context.status.payments}</CardDescription>}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {context.tenantRows.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No billing cycle exists for this month yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {context.tenantRows.map((row) => (
                  <TableRow key={row.tenantId}>
                    <TableCell className="font-semibold">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          <AvatarFallback className="bg-accent text-caption text-accent-foreground">
                            {tenantInitials(row.tenantName)}
                          </AvatarFallback>
                        </Avatar>
                        {row.tenantName}
                      </div>
                    </TableCell>
                    <TableCell>{row.unitName}</TableCell>
                    <TableCell>{formatCurrency(row.totalDue)}</TableCell>
                    <TableCell>{formatCurrency(row.amountPaid)}</TableCell>
                    <TableCell>{formatCurrency(row.outstanding)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <p className="mt-1 text-h1 text-foreground">{formatCurrency(totalBilled)}</p>
            <CardDescription>Total billed · {context.monthLabel}</CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentStatusChart breakdown={context.paymentStatusBreakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
            <p className="mt-1 text-h1 text-foreground">{formatCurrency(totalCollectedShown)}</p>
            <CardDescription>
              Collected across the last {context.monthlyCashFlow.length || 0} month
              {context.monthlyCashFlow.length === 1 ? "" : "s"}
            </CardDescription>
            {context.status.cashFlow && <CardDescription>{context.status.cashFlow}</CardDescription>}
          </CardHeader>
          <CardContent>
            <MonthlyCashFlowChart data={context.monthlyCashFlow} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          {context.recentActivity.length > 0 && (
            <CardAction>
              <div className="relative w-full max-w-[220px]">
                <Search
                  size={16}
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  placeholder="Search activity…"
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {context.recentActivity.length === 0 ? (
            <p className="text-small text-muted-foreground">No activity has been recorded yet.</p>
          ) : filteredActivity.length === 0 ? (
            <p className="text-small text-muted-foreground">No activity matches your search.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredActivity.map((item) => {
                  const Icon = ACTIVITY_ICON[item.type];
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground",
                              ACTIVITY_TINT[item.type],
                            )}
                          >
                            <Icon size={16} />
                          </span>
                          <span className="font-medium text-foreground">{item.description}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatActivityDate(item.timestamp)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatActivityTime(item.timestamp)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricRow({
  label,
  align = "center",
  children,
}: {
  label: string;
  align?: "center" | "top";
  children: ReactNode;
}) {
  return (
    <div
      className={`flex justify-between gap-4 px-6 py-3.5 text-small ${
        align === "top" ? "items-start" : "items-center"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold text-foreground">{children}</span>
    </div>
  );
}
