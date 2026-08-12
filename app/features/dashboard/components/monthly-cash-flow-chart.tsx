"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyCashFlowPoint } from "@/services/dashboard/get-dashboard-context";
import { ChartTooltip } from "./chart-tooltip";

export function MonthlyCashFlowChart({ data }: { data: MonthlyCashFlowPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="flex h-72 items-center justify-center text-small text-muted-foreground">
        No billing history yet — this chart fills in as billing cycles are completed.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }} barGap={4}>
        <CartesianGrid stroke="var(--border)" strokeOpacity={0.6} vertical={false} />
        <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis
          stroke="var(--muted-foreground)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `₱${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip content={(props) => <ChartTooltip {...props} />} cursor={{ fill: "var(--muted)" }} />
        <Legend />
        <Bar dataKey="billed" name="Billed" fill="var(--chart-4)" radius={[8, 8, 0, 0]} maxBarSize={28} />
        <Bar dataKey="collected" name="Collected" fill="var(--chart-1)" radius={[8, 8, 0, 0]} maxBarSize={28} />
        <Bar dataKey="outstanding" name="Outstanding" fill="var(--chart-neutral)" radius={[8, 8, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
