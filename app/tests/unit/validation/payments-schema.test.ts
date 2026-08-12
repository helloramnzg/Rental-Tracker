import { describe, expect, it } from "vitest";
import {
  recordPaymentSchema,
  updatePaymentSchema,
  deletePaymentSchema,
} from "@/features/payments/validation/schema";

const validRecord = {
  billingCycleId: "11111111-1111-1111-1111-111111111111",
  tenantId: "33333333-3333-3333-3333-333333333331",
  amount: 1000,
  paymentDate: "2026-08-05",
  method: "cash" as const,
};

describe("recordPaymentSchema", () => {
  it("accepts a valid payment", () => {
    expect(recordPaymentSchema.safeParse(validRecord).success).toBe(true);
  });

  it("rejects a zero amount", () => {
    expect(recordPaymentSchema.safeParse({ ...validRecord, amount: 0 }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(recordPaymentSchema.safeParse({ ...validRecord, amount: -100 }).success).toBe(false);
  });

  it("rejects an empty payment date", () => {
    expect(recordPaymentSchema.safeParse({ ...validRecord, paymentDate: "" }).success).toBe(false);
  });

  it("rejects a method outside cash/gcash/bank_transfer", () => {
    expect(
      recordPaymentSchema.safeParse({ ...validRecord, method: "paypal" }).success,
    ).toBe(false);
  });

  it("accepts each of the three documented payment methods", () => {
    for (const method of ["cash", "gcash", "bank_transfer"] as const) {
      expect(recordPaymentSchema.safeParse({ ...validRecord, method }).success).toBe(true);
    }
  });

  it("accepts referenceNumber and notes when provided, without requiring them", () => {
    expect(recordPaymentSchema.safeParse(validRecord).success).toBe(true);
    expect(
      recordPaymentSchema.safeParse({
        ...validRecord,
        referenceNumber: "GC-12345",
        notes: "Partial settlement",
      }).success,
    ).toBe(true);
  });

  it("rejects a non-GUID tenantId or billingCycleId", () => {
    expect(recordPaymentSchema.safeParse({ ...validRecord, tenantId: "not-a-guid" }).success).toBe(
      false,
    );
    expect(
      recordPaymentSchema.safeParse({ ...validRecord, billingCycleId: "not-a-guid" }).success,
    ).toBe(false);
  });
});

describe("updatePaymentSchema", () => {
  it("accepts a valid update payload keyed by paymentId", () => {
    const result = updatePaymentSchema.safeParse({
      paymentId: "44444444-4444-4444-4444-444444444444",
      amount: 500,
      paymentDate: "2026-08-06",
      method: "gcash",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero or negative amount, same as record", () => {
    const base = {
      paymentId: "44444444-4444-4444-4444-444444444444",
      paymentDate: "2026-08-06",
      method: "gcash" as const,
    };
    expect(updatePaymentSchema.safeParse({ ...base, amount: 0 }).success).toBe(false);
    expect(updatePaymentSchema.safeParse({ ...base, amount: -1 }).success).toBe(false);
  });
});

describe("deletePaymentSchema", () => {
  it("accepts a bare paymentId", () => {
    expect(
      deletePaymentSchema.safeParse({ paymentId: "44444444-4444-4444-4444-444444444444" }).success,
    ).toBe(true);
  });

  it("rejects a missing paymentId", () => {
    expect(deletePaymentSchema.safeParse({}).success).toBe(false);
  });
});
