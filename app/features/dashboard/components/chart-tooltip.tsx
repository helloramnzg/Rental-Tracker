"use client";

import type { TooltipContentProps } from "recharts";
import { formatCurrency } from "@/utils/format-currency";

// Shared Recharts tooltip for the dashboard's charts — dark rounded
// card, one row per series, matching the reference's tooltip style
// instead of Recharts' unstyled default box. `valueFormatter` defaults
// to peso formatting (the cash flow chart's series); pass a different
// one for non-currency values like the payment-status donut's counts.
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter = (value) => formatCurrency(value),
}: TooltipContentProps & { valueFormatter?: (value: number) => string }) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg bg-foreground px-3 py-2 text-background shadow-md">
      {label && <p className="mb-1.5 text-caption font-semibold">{label}</p>}
      <div className="flex flex-col gap-1">
        {payload.map((entry, index) => (
          <div key={entry.name ?? index} className="flex items-center gap-2 text-caption">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-background/70">{entry.name}</span>
            <span className="ml-auto font-semibold">
              {valueFormatter(Number(entry.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
