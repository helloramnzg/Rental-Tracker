"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Wallet, Pencil, Trash2, Plus } from "lucide-react";
import type {
  PaymentsContext,
  PaymentHistoryEntry,
} from "@/services/payments/get-payments-context";
import type { PaymentStatus } from "@/services/payments/compute-payment-status";
import {
  recordPaymentSchema,
  updatePaymentSchema,
  type RecordPaymentFormValues,
  type UpdatePaymentFormValues,
} from "@/features/payments/validation/schema";
import { recordPaymentAction } from "@/features/payments/actions/record-payment";
import { updatePaymentAction } from "@/features/payments/actions/update-payment";
import { deletePaymentAction } from "@/features/payments/actions/delete-payment";
import { formatCurrency } from "@/utils/format-currency";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  gcash: "GCash",
  bank_transfer: "Bank Transfer",
};

const STATUS_VARIANT: Record<PaymentStatus, "default" | "warning" | "destructive"> = {
  paid: "default",
  partial: "warning",
  outstanding: "destructive",
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
    new Date(`${dateStr}T00:00:00`),
  );
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentsView({
  year,
  month,
  monthLabel,
  context,
}: {
  year: number;
  month: number;
  monthLabel: string;
  context: PaymentsContext;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentHistoryEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recordSheetOpen, setRecordSheetOpen] = useState(false);

  function handleMonthChange(nextMonth: string | null) {
    if (!nextMonth) return;
    router.push(`/payments?year=${year}&month=${nextMonth}`);
  }

  function handleYearChange(nextYear: string | null) {
    if (!nextYear) return;
    router.push(`/payments?year=${nextYear}&month=${month}`);
  }

  const recordDefaultValues: RecordPaymentFormValues = useMemo(
    () => ({
      billingCycleId: context.billingCycle?.id ?? "",
      tenantId: context.tenantRows[0]?.tenantId ?? "",
      amount: 0,
      paymentDate: todayIso(),
      method: "cash",
      referenceNumber: "",
      notes: "",
    }),
    [context.billingCycle?.id, context.tenantRows],
  );

  const recordForm = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: recordDefaultValues,
    values: recordDefaultValues,
  });

  const watchedRecord = useWatch({ control: recordForm.control });

  async function onRecordSubmit(values: RecordPaymentFormValues) {
    setError(null);
    setSuccessMessage(null);
    const result = await recordPaymentAction(values);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage("Payment recorded.");
    recordForm.reset({
      billingCycleId: context.billingCycle?.id ?? "",
      tenantId: values.tenantId,
      amount: 0,
      paymentDate: todayIso(),
      method: "cash",
      referenceNumber: "",
      notes: "",
    });
    setRecordSheetOpen(false);
    router.refresh();
  }

  const editForm = useForm<UpdatePaymentFormValues>({
    resolver: zodResolver(updatePaymentSchema),
  });

  useEffect(() => {
    if (!editingPayment) return;
    editForm.reset({
      paymentId: editingPayment.id,
      amount: editingPayment.amount,
      paymentDate: editingPayment.paymentDate,
      method: editingPayment.method,
      referenceNumber: editingPayment.referenceNumber ?? "",
      notes: editingPayment.notes ?? "",
    });
  }, [editingPayment, editForm]);

  const watchedEdit = useWatch({ control: editForm.control });

  async function onEditSubmit(values: UpdatePaymentFormValues) {
    setError(null);
    const result = await updatePaymentAction(values);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setEditingPayment(null);
    setSuccessMessage("Payment updated.");
    router.refresh();
  }

  async function handleDelete(paymentId: string) {
    if (!window.confirm("Delete this payment? This cannot be undone.")) return;
    setError(null);
    setDeletingId(paymentId);
    const result = await deletePaymentAction({ paymentId });
    setDeletingId(null);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setSuccessMessage("Payment deleted.");
    router.refresh();
  }

  const yearOptions = Array.from(
    { length: 2035 - (year - 1) + 1 },
    (_, i) => year - 1 + i,
  );
  const hasCycle = context.billingCycle !== null;

  return (
    <>
      <PageHeader
        eyebrow={monthLabel}
        title="Payments"
        description="Record payments, correct mistakes, and review outstanding balances."
        action={
          hasCycle ? (
            <Button onClick={() => setRecordSheetOpen(true)}>
              <Plus className="mr-1.5" size={16} />
              Record Payment
            </Button>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
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
          <Select value={String(month)} onValueChange={handleMonthChange}>
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
          <Select value={String(year)} onValueChange={handleYearChange}>
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
        </CardContent>
      </Card>

      {!hasCycle && (
        <EmptyState
          icon={Wallet}
          title="No billing cycle exists for this month yet."
          description="Complete Monthly Billing for this month before recording payments."
        />
      )}

      {hasCycle && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Total Due</CardDescription>
                <CardTitle className="text-h2">
                  {formatCurrency(context.summary.totalDue)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Payments Received</CardDescription>
                <CardTitle className="text-h2">
                  {formatCurrency(context.summary.totalReceived)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Outstanding Balance</CardDescription>
                <CardTitle className="text-h2">
                  {formatCurrency(context.summary.totalOutstanding)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Outstanding Balances</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
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
                      <TableCell className="font-semibold">{row.tenantName}</TableCell>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {context.history.length === 0 ? (
                <p className="text-small text-muted-foreground">
                  No payments have been recorded for this month yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {context.history.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell className="font-semibold">{payment.tenantName}</TableCell>
                        <TableCell>{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>{METHOD_LABELS[payment.method]}</TableCell>
                        <TableCell>{payment.referenceNumber || "—"}</TableCell>
                        <TableCell className="max-w-48 truncate">
                          {payment.notes || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Edit payment"
                            onClick={() => setEditingPayment(payment)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Delete payment"
                            disabled={deletingId === payment.id}
                            onClick={() => handleDelete(payment.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

        </>
      )}

      <Sheet open={recordSheetOpen} onOpenChange={setRecordSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Record Payment</SheetTitle>
            <SheetDescription>
              Record a payment against the saved billing cycle.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={recordForm.handleSubmit(onRecordSubmit)}
            className="flex flex-col gap-4 px-4"
          >
            <input type="hidden" {...recordForm.register("billingCycleId")} />

            <div className="flex flex-col gap-1.5">
              <Label>Tenant</Label>
              <Select
                value={watchedRecord.tenantId ?? ""}
                onValueChange={(v) => v && recordForm.setValue("tenantId", v)}
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: string) => {
                      const row = context.tenantRows.find((r) => r.tenantId === value);
                      return row ? `${row.tenantName} (${row.unitName})` : "Select tenant";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {context.tenantRows.map((row) => (
                    <SelectItem key={row.tenantId} value={row.tenantId}>
                      {row.tenantName} ({row.unitName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                aria-invalid={!!recordForm.formState.errors.amount}
                {...recordForm.register("amount", { valueAsNumber: true })}
              />
              {recordForm.formState.errors.amount && (
                <p className="text-caption text-destructive">
                  {recordForm.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input id="paymentDate" type="date" {...recordForm.register("paymentDate")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Method</Label>
              <Select
                value={watchedRecord.method ?? "cash"}
                onValueChange={(v) =>
                  v && recordForm.setValue("method", v as RecordPaymentFormValues["method"])
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: string) => METHOD_LABELS[value] ?? "Select method"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input id="referenceNumber" {...recordForm.register("referenceNumber")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...recordForm.register("notes")} />
            </div>

            <SheetFooter>
              <Button type="submit" disabled={recordForm.formState.isSubmitting}>
                {recordForm.formState.isSubmitting ? "Recording…" : "Record Payment"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet
        open={editingPayment !== null}
        onOpenChange={(open) => !open && setEditingPayment(null)}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Payment</SheetTitle>
            <SheetDescription>
              Correct a mistaken amount, date, method, or notes.
            </SheetDescription>
          </SheetHeader>
          <form
            onSubmit={editForm.handleSubmit(onEditSubmit)}
            className="flex flex-col gap-4 px-4"
          >
            <input type="hidden" {...editForm.register("paymentId")} />

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                aria-invalid={!!editForm.formState.errors.amount}
                {...editForm.register("amount", { valueAsNumber: true })}
              />
              {editForm.formState.errors.amount && (
                <p className="text-caption text-destructive">
                  {editForm.formState.errors.amount.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-paymentDate">Payment Date</Label>
              <Input id="edit-paymentDate" type="date" {...editForm.register("paymentDate")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Method</Label>
              <Select
                value={watchedEdit.method ?? "cash"}
                onValueChange={(v) =>
                  v && editForm.setValue("method", v as UpdatePaymentFormValues["method"])
                }
              >
                <SelectTrigger>
                  <SelectValue>
                    {(value: string) => METHOD_LABELS[value] ?? "Select method"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-referenceNumber">Reference Number</Label>
              <Input id="edit-referenceNumber" {...editForm.register("referenceNumber")} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input id="edit-notes" {...editForm.register("notes")} />
            </div>

            <SheetFooter>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting ? "Saving…" : "Save Changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
      </div>
    </>
  );
}
