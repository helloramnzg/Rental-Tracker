import { describe, expect, it } from "vitest";
import { computePaymentStatus } from "@/services/payments/compute-payment-status";

// Shared by SOA and Payments (services/payments/compute-payment-status.ts) —
// the exact duplication HANDOVER.md flagged as a risk. One test file
// covering it protects both call sites from drifting apart again.
describe("computePaymentStatus", () => {
  it("is outstanding when nothing has been paid", () => {
    expect(computePaymentStatus(1000, 0)).toBe("outstanding");
  });

  it("is outstanding for a negative amountPaid (defensive — should never happen upstream)", () => {
    expect(computePaymentStatus(1000, -50)).toBe("outstanding");
  });

  it("is partial when some but not all has been paid", () => {
    expect(computePaymentStatus(1000, 500)).toBe("partial");
  });

  it("is paid when amountPaid exactly equals totalDue", () => {
    expect(computePaymentStatus(1000, 1000)).toBe("paid");
  });

  it("is paid when amountPaid exceeds totalDue (overpayment)", () => {
    expect(computePaymentStatus(1000, 1500)).toBe("paid");
  });

  it("is outstanding for a zero-due cycle with no payment — amountPaid <= 0 is checked first", () => {
    // Edge case worth pinning down explicitly: a totalDue of 0 does NOT
    // short-circuit to "paid" here, because the amountPaid <= 0 branch
    // is evaluated before the amountPaid >= totalDue branch.
    expect(computePaymentStatus(0, 0)).toBe("outstanding");
  });

  it("is partial for a payment just one cent short of totalDue", () => {
    expect(computePaymentStatus(1000, 999.99)).toBe("partial");
  });
});
