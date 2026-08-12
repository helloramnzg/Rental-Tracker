import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { signInAsLandlord } from "../../support/clients";
import { createTenantFixture, type TenantFixture } from "../../support/factories/tenant";
import {
  createBillingCycleFixture,
  type BillingCycleFixture,
} from "../../support/factories/billing-cycle";
import { recordPayment } from "@/services/payments/record-payment";
import { updatePayment, PaymentNotEditableError } from "@/services/payments/update-payment";
import { deletePayment } from "@/services/payments/delete-payment";
import { getPaymentsContext } from "@/services/payments/get-payments-context";

describe("payments (integration)", () => {
  let supabase: SupabaseClient<Database>;
  let tenant: TenantFixture;
  let cycle: BillingCycleFixture;

  beforeAll(async () => {
    supabase = await signInAsLandlord();
  });

  beforeEach(async () => {
    tenant = await createTenantFixture(supabase);
    cycle = await createBillingCycleFixture(supabase, {
      tenantId: tenant.tenantId,
      rent: 5000,
      otherCharges: 0,
      motherMeterBill: 300,
      previousReading: 0,
      currentReading: 20,
      electricityRate: 15,
    });
  });

  afterEach(async () => {
    await cycle.cleanup();
    await tenant.cleanup();
  });

  it("recordPayment inserts a row and is reflected in getPaymentsContext's tenant row", async () => {
    const halfDue = Math.round(cycle.totalDue / 2);
    await recordPayment(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: halfDue,
      paymentDate: "2026-01-01",
      method: "gcash",
      referenceNumber: "GC-001",
    });

    const context = await getPaymentsContext(supabase, { year: cycle.year, month: cycle.month });
    const row = context.tenantRows.find((r) => r.tenantId === tenant.tenantId);
    expect(row?.amountPaid).toBe(halfDue);
    expect(row?.outstanding).toBe(cycle.totalDue - halfDue);
    expect(row?.status).toBe("partial");
    expect(context.history).toHaveLength(1);
    expect(context.history[0]?.method).toBe("gcash");
    expect(context.history[0]?.referenceNumber).toBe("GC-001");
  });

  it("supports multiple partial payments that sum toward the total and flip status to paid", async () => {
    const firstAmount = Math.floor(cycle.totalDue / 3);
    const secondAmount = cycle.totalDue - firstAmount;

    await recordPayment(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: firstAmount,
      paymentDate: "2026-01-05",
      method: "cash",
    });
    const midway = await getPaymentsContext(supabase, { year: cycle.year, month: cycle.month });
    expect(midway.tenantRows[0]?.status).toBe("partial");

    await recordPayment(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: secondAmount,
      paymentDate: "2026-01-20",
      method: "bank_transfer",
    });
    const final = await getPaymentsContext(supabase, { year: cycle.year, month: cycle.month });
    expect(final.tenantRows[0]?.status).toBe("paid");
    expect(final.tenantRows[0]?.outstanding).toBe(0);
    expect(final.history).toHaveLength(2);
    expect(final.summary.totalReceived).toBe(cycle.totalDue);
  });

  it("treats an overpayment as paid, with a negative outstanding amount surfaced rather than hidden", async () => {
    const overpayAmount = cycle.totalDue + 500;
    await recordPayment(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: overpayAmount,
      paymentDate: "2026-01-01",
      method: "cash",
    });

    const context = await getPaymentsContext(supabase, { year: cycle.year, month: cycle.month });
    const row = context.tenantRows.find((r) => r.tenantId === tenant.tenantId);
    expect(row?.status).toBe("paid");
    expect(row?.outstanding).toBe(-500);
  });

  it("getPaymentsContext returns an empty, zeroed context for a month with no billing cycle", async () => {
    const context = await getPaymentsContext(supabase, { year: 6001, month: 1 });
    expect(context.billingCycle).toBeNull();
    expect(context.tenantRows).toEqual([]);
    expect(context.history).toEqual([]);
    expect(context.summary).toEqual({ totalDue: 0, totalReceived: 0, totalOutstanding: 0 });
  });

  it("updatePayment corrects amount/date/method/reference on an existing payment", async () => {
    const { paymentId } = await recordPayment(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: 100,
      paymentDate: "2026-01-01",
      method: "cash",
    });

    await updatePayment(supabase, {
      paymentId,
      amount: 250,
      paymentDate: "2026-01-02",
      method: "gcash",
      referenceNumber: "GC-999",
    });

    const { data: updated } = await supabase
      .from("payments")
      .select("amount, payment_date, method, reference_number")
      .eq("id", paymentId)
      .single();
    expect(updated?.amount).toBe(250);
    expect(updated?.method).toBe("gcash");
    expect(updated?.reference_number).toBe("GC-999");
  });

  it("deletePayment removes the row and it disappears from getPaymentsContext", async () => {
    const { paymentId } = await recordPayment(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: 100,
      paymentDate: "2026-01-01",
      method: "cash",
    });

    await deletePayment(supabase, { paymentId });

    const { data } = await supabase.from("payments").select("id").eq("id", paymentId);
    expect(data).toEqual([]);
    const context = await getPaymentsContext(supabase, { year: cycle.year, month: cycle.month });
    expect(context.history).toEqual([]);
  });

  it("rejects updatePayment and deletePayment once the billing cycle is closed", async () => {
    const { paymentId } = await recordPayment(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: 100,
      paymentDate: "2026-01-01",
      method: "cash",
    });

    await supabase.from("billing_cycles").update({ status: "closed" }).eq("id", cycle.billingCycleId);

    await expect(
      updatePayment(supabase, {
        paymentId,
        amount: 200,
        paymentDate: "2026-01-01",
        method: "cash",
      }),
    ).rejects.toBeInstanceOf(PaymentNotEditableError);

    await expect(deletePayment(supabase, { paymentId })).rejects.toBeInstanceOf(PaymentNotEditableError);

    // Reopen so the fixture's own teardown (which deletes payments by
    // billing_cycle_id) isn't itself blocked by the same guard — the
    // guard lives in the service layer, not the database, so a direct
    // table delete in cleanup is unaffected either way, but keep the
    // fixture's invariants honest.
    await supabase.from("billing_cycles").update({ status: "draft" }).eq("id", cycle.billingCycleId);
  });

  it("rejects a non-positive amount at the database check-constraint level", async () => {
    await expect(
      recordPayment(supabase, {
        billingCycleId: cycle.billingCycleId,
        tenantId: tenant.tenantId,
        amount: 0,
        paymentDate: "2026-01-01",
        method: "cash",
      }),
    ).rejects.toBeTruthy();
  });
});
