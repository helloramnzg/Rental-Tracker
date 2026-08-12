"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { PaymentStatus } from "@/services/payments/compute-payment-status";
import { ChartTooltip } from "./chart-tooltip";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: "Paid",
  partial: "Partial",
  outstanding: "Outstanding",
};

// One accent colour (green, for the positive/paid slice) plus neutral
// greys for the rest — never mix multiple accent colours in a single
// chart (docs/design/19-design-system.md Data Visualisation).
const STATUS_COLORS: Record<PaymentStatus, string> = {
  paid: "var(--chart-1)",
  partial: "var(--chart-neutral)",
  outstanding: "var(--chart-4)",
};

export function PaymentStatusChart({
  breakdown,
}: {
  breakdown: { status: PaymentStatus; count: number }[];
}) {
  const data = breakdown
    .filter((d) => d.count > 0)
    .map((d) => ({ name: STATUS_LABELS[d.status], status: d.status, value: d.count }));

  if (data.length === 0) {
    return (
      <p className="flex h-56 items-center justify-center text-small text-muted-foreground">
        No tenants billed this month yet.
      </p>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height={224}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={58}
          outerRadius={82}
          paddingAngle={3}
          cornerRadius={6}
        >
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} stroke="none" />
          ))}
        </Pie>
        <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-2xl font-bold">
          {total}
        </text>
        <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-caption">
          {total === 1 ? "tenant" : "tenants"}
        </text>
        <Tooltip
          content={(props) => (
            <ChartTooltip
              {...props}
              valueFormatter={(value) => `${value} ${value === 1 ? "tenant" : "tenants"}`}
            />
          )}
        />
        <Legend verticalAlign="bottom" height={32} />
      </PieChart>
    </ResponsiveContainer>
  );
}
