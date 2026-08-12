"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import {
  billingFormSchema,
  type BillingFormValues,
} from "@/features/billing/validation/schema";
import { saveBillingCycleAction } from "@/features/billing/actions/save-billing-cycle";
import { calculateElectricity } from "@/services/billing/calculate-electricity";
import { calculateCharges } from "@/services/billing/calculate-charges";
import type { BillingContext } from "@/services/billing/get-billing-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(Number.isFinite(value) ? value : 0);
}

// Builds "YYYY-MM-DD" from local date parts, not toISOString() (which
// converts to UTC first and can shift the calendar day backward in
// timezones ahead of UTC).
function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function BillingForm({
  year,
  month,
  context,
}: {
  year: number;
  month: number;
  context: BillingContext;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Only "closed" cycles are locked — billing edits are otherwise
  // always allowed, including after SOA generation (explicit product
  // decision: edits recalculate and regenerate automatically, see
  // services/billing/save-billing-cycle.ts). No workflow currently
  // sets a cycle to "closed", so isClosed is a forward-looking guard.
  const isClosed = context.existingCycle?.billingCycle.status === "closed";

  const defaultValues: BillingFormValues = useMemo(
    () => ({
      year,
      month,
      billingDate: context.existingCycle?.billingCycle.billing_date ?? todayIso(),
      motherMeterBill: context.existingCycle?.billingCycle.mother_meter_bill ?? 0,
      previousReading: context.previousReading,
      currentReading:
        context.existingCycle?.meterReading?.current_reading ??
        context.previousReading,
      electricityRate:
        context.existingCycle?.meterReading?.rate_per_kwh ??
        context.settings?.default_electricity_rate ??
        15,
      tenantCharges: context.tenants.map((t) => ({
        tenantId: t.tenant.id,
        rent: t.existingCharge?.rent ?? t.tenant.monthly_rent,
        otherCharges: t.existingCharge?.other_charges ?? 0,
      })),
    }),
    [year, month, context],
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BillingFormValues>({
    resolver: zodResolver(billingFormSchema),
    defaultValues,
    values: defaultValues,
  });

  const watched = useWatch({ control });

  const electricity = calculateElectricity({
    previousReading: watched.previousReading ?? 0,
    currentReading: watched.currentReading ?? 0,
    ratePerKwh: watched.electricityRate ?? 0,
    motherMeterBill: watched.motherMeterBill ?? 0,
  });

  const tenantRows = context.tenants.map((t, index) => {
    const rowValues = watched.tenantCharges?.[index];
    const electricityForTenant =
      t.unit.electricity_type === "submeter"
        ? electricity.unit1Electricity
        : electricity.unit2Electricity;
    const charges = calculateCharges({
      rent: rowValues?.rent ?? 0,
      electricity: electricityForTenant,
      otherCharges: rowValues?.otherCharges ?? 0,
      previousBalance: t.previousBalance,
    });
    return { tenantInfo: t, index, electricityForTenant, charges };
  });

  const grandTotal = tenantRows.reduce((sum, r) => sum + r.charges.totalDue, 0);

  function handleMonthChange(nextMonth: string | null) {
    if (!nextMonth) return;
    router.push(`/billing?year=${year}&month=${nextMonth}`);
  }

  function handleYearChange(nextYear: string | null) {
    if (!nextYear) return;
    router.push(`/billing?year=${nextYear}&month=${month}`);
  }

  async function onSubmit(values: BillingFormValues) {
    (window as unknown as { __onSubmitCalled: boolean }).__onSubmitCalled =
      true;
    setFormError(null);
    setSuccessMessage(null);

    const result = await saveBillingCycleAction(values);
    (window as unknown as { __actionResult: unknown }).__actionResult =
      result;

    if (!result.success) {
      setFormError(result.error.message);
      return;
    }

    const { ownSoaRegenerated, cascade } = result.data;
    const notes: string[] = [];
    if (ownSoaRegenerated) notes.push("its SOA was regenerated");
    if (cascade.cascadedCycles > 0) {
      notes.push(
        `${cascade.cascadedCycles} later billing cycle${cascade.cascadedCycles === 1 ? "" : "s"} recalculated` +
          (cascade.regeneratedSoaCycles > 0
            ? ` (${cascade.regeneratedSoaCycles} SOA${cascade.regeneratedSoaCycles === 1 ? "" : "s"} regenerated)`
            : ""),
      );
    }
    setSuccessMessage(
      notes.length > 0 ? `Billing cycle saved — ${notes.join("; ")}.` : "Billing cycle saved.",
    );
    router.refresh();
  }

  function onInvalid(errs: unknown) {
    (window as unknown as { __validationErrors: unknown }).__validationErrors =
      errs;
  }

  const yearOptions = Array.from(
    { length: 2035 - (year - 1) + 1 },
    (_, i) => year - 1 + i,
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        return handleSubmit(onSubmit, onInvalid)(e);
      }}
      className="flex flex-col gap-6 pb-24"
    >
      {isClosed && (
        <Alert>
          <AlertDescription>
            This billing cycle is closed and can&apos;t be edited here.
          </AlertDescription>
        </Alert>
      )}

      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Billing Month</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Month</Label>
            <Select
              value={String(month)}
              onValueChange={handleMonthChange}
              disabled={isClosed}
            >
              <SelectTrigger className="w-48">
                <SelectValue>
                  {(value: string) => MONTH_NAMES[Number(value) - 1]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={name} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Year</Label>
            <Select
              value={String(year)}
              onValueChange={handleYearChange}
              disabled={isClosed}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="billingDate">Billing Date</Label>
            <Input
              id="billingDate"
              type="date"
              disabled={isClosed}
              aria-invalid={!!errors.billingDate}
              {...register("billingDate")}
            />
            {errors.billingDate && (
              <p className="text-caption text-destructive">
                {errors.billingDate.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utility Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="motherMeterBill">Mother Meter Bill</Label>
            <Input
              id="motherMeterBill"
              type="number"
              step="0.01"
              disabled={isClosed}
              aria-invalid={!!errors.motherMeterBill}
              {...register("motherMeterBill", { valueAsNumber: true })}
            />
            {errors.motherMeterBill && (
              <p className="text-caption text-destructive">
                {errors.motherMeterBill.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="electricityRate">Electricity Rate (₱/kWh)</Label>
            <Input
              id="electricityRate"
              type="number"
              step="0.01"
              disabled={isClosed}
              aria-invalid={!!errors.electricityRate}
              {...register("electricityRate", { valueAsNumber: true })}
            />
            {errors.electricityRate && (
              <p className="text-caption text-destructive">
                {errors.electricityRate.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="previousReading">
              Previous Submeter Reading
            </Label>
            <Input
              id="previousReading"
              type="number"
              step="0.01"
              disabled={isClosed}
              aria-invalid={!!errors.previousReading}
              {...register("previousReading", { valueAsNumber: true })}
            />
            {errors.previousReading && (
              <p className="text-caption text-destructive">
                {errors.previousReading.message}
              </p>
            )}
            <p className="text-caption text-muted-foreground">
              Pre-filled from last month&apos;s reading — edit if it&apos;s wrong.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentReading">Current Submeter Reading</Label>
            <Input
              id="currentReading"
              type="number"
              step="0.01"
              disabled={isClosed}
              aria-invalid={!!errors.currentReading}
              {...register("currentReading", { valueAsNumber: true })}
            />
            {errors.currentReading && (
              <p className="text-caption text-destructive">
                {errors.currentReading.message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Electricity Calculation</CardTitle>
          <CardDescription>
            Unit 1: usage × rate. Unit 2: mother meter bill − Unit 1 cost.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-small text-muted-foreground">Usage (kWh)</p>
            <p className="text-h3 text-foreground">
              {electricity.usageKwh.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-small text-muted-foreground">
              Unit 1 Electricity
            </p>
            <p className="text-h3 text-foreground">
              {formatCurrency(electricity.unit1Electricity)}
            </p>
          </div>
          <div>
            <p className="text-small text-muted-foreground">
              Unit 2 Electricity
            </p>
            <p className="text-h3 text-foreground">
              {formatCurrency(electricity.unit2Electricity)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tenant Charges</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Electricity</TableHead>
                <TableHead>Water</TableHead>
                <TableHead>Other Charges</TableHead>
                <TableHead>Previous Balance</TableHead>
                <TableHead>Total Due</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenantRows.map((row) => (
                <TableRow key={row.tenantInfo.tenant.id}>
                  <TableCell className="font-semibold">
                    <input
                      type="hidden"
                      {...register(
                        `tenantCharges.${row.index}.tenantId` as const,
                      )}
                    />
                    {row.tenantInfo.tenant.full_name}
                  </TableCell>
                  <TableCell>{row.tenantInfo.unit.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-28"
                      disabled={isClosed}
                      {...register(
                        `tenantCharges.${row.index}.rent` as const,
                        { valueAsNumber: true },
                      )}
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(row.electricityForTenant)}</TableCell>
                  <TableCell>{formatCurrency(row.charges.water)}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      className="w-28"
                      disabled={isClosed}
                      {...register(
                        `tenantCharges.${row.index}.otherCharges` as const,
                        { valueAsNumber: true },
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    {formatCurrency(row.tenantInfo.previousBalance)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(row.charges.totalDue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-body text-muted-foreground">
            Total across all tenants
          </span>
          <span className="text-h2 text-foreground">
            {formatCurrency(grandTotal)}
          </span>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-border bg-background py-4">
        <div>
          {context.existingCycle && (
            <Badge variant={isClosed ? "default" : "neutral"}>
              {context.existingCycle.billingCycle.status}
            </Badge>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting || isClosed}>
          <Save className="mr-1.5" size={16} />
          {isSubmitting ? "Saving…" : "Save Billing Cycle"}
        </Button>
      </div>
    </form>
  );
}
