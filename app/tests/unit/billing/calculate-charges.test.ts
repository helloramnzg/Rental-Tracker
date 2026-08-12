import { describe, expect, it } from "vitest";
import { calculateCharges, WATER_CHARGE } from "@/services/billing/calculate-charges";

// Source of truth: docs/product/14-business-rules.md — Charges, Water Charge.
// Total Due = Rent + Electricity + Water + Other Charges + Previous Balance.
describe("calculateCharges", () => {
  it("sums all five components into totalDue", () => {
    const result = calculateCharges({
      rent: 8000,
      electricity: 750,
      otherCharges: 100,
      previousBalance: 500,
    });

    expect(result.totalDue).toBe(8000 + 750 + WATER_CHARGE + 100 + 500);
  });

  it("always applies the fixed ₱200 water charge, never a configurable value", () => {
    const result = calculateCharges({
      rent: 0,
      electricity: 0,
      otherCharges: 0,
      previousBalance: 0,
    });

    expect(result.water).toBe(200);
    expect(WATER_CHARGE).toBe(200);
  });

  it("carries a negative electricity cost straight through to totalDue (e.g. Unit 2 residual)", () => {
    const result = calculateCharges({
      rent: 5000,
      electricity: -300,
      otherCharges: 0,
      previousBalance: 0,
    });

    expect(result.electricity).toBe(-300);
    expect(result.totalDue).toBe(5000 - 300 + 200);
  });

  it("compounds a previous balance into totalDue without altering the other components", () => {
    const result = calculateCharges({
      rent: 8000,
      electricity: 500,
      otherCharges: 0,
      previousBalance: 3200,
    });

    expect(result.previousBalance).toBe(3200);
    expect(result.totalDue).toBe(8000 + 500 + 200 + 3200);
  });

  it("handles a zero-rent, zero-charges cycle (water charge is still owed)", () => {
    const result = calculateCharges({
      rent: 0,
      electricity: 0,
      otherCharges: 0,
      previousBalance: 0,
    });

    expect(result.totalDue).toBe(200);
  });
});
