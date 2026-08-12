import { describe, expect, it } from "vitest";
import { calculateElectricity } from "@/services/billing/calculate-electricity";

// Source of truth: docs/product/14-business-rules.md — Electricity.
// Unit 1: (Current − Previous) × Rate. Unit 2: Mother Meter Bill − Unit 1 cost.
describe("calculateElectricity", () => {
  it("computes usage and both units' cost from the documented formulas", () => {
    const result = calculateElectricity({
      previousReading: 100,
      currentReading: 150,
      ratePerKwh: 15,
      motherMeterBill: 2000,
    });

    expect(result.usageKwh).toBe(50);
    expect(result.unit1Electricity).toBe(750); // 50 * 15
    expect(result.unit2Electricity).toBe(1250); // 2000 - 750
  });

  it("returns zero usage and unit1 cost when readings are equal", () => {
    const result = calculateElectricity({
      previousReading: 200,
      currentReading: 200,
      ratePerKwh: 15,
      motherMeterBill: 500,
    });

    expect(result.usageKwh).toBe(0);
    expect(result.unit1Electricity).toBe(0);
    expect(result.unit2Electricity).toBe(500);
  });

  it("allows unit2 to go negative when the mother meter bill is less than unit1's cost", () => {
    // Pure calculation makes no judgment call here — validation of
    // "does this make sense" belongs to the caller, not this function.
    const result = calculateElectricity({
      previousReading: 0,
      currentReading: 1000,
      ratePerKwh: 15,
      motherMeterBill: 100,
    });

    expect(result.unit1Electricity).toBe(15000);
    expect(result.unit2Electricity).toBe(-14900);
  });

  it("handles fractional readings and rates without rounding", () => {
    const result = calculateElectricity({
      previousReading: 10.25,
      currentReading: 20.75,
      ratePerKwh: 15.5,
      motherMeterBill: 1000,
    });

    expect(result.usageKwh).toBeCloseTo(10.5, 10);
    expect(result.unit1Electricity).toBeCloseTo(162.75, 10);
    expect(result.unit2Electricity).toBeCloseTo(837.25, 10);
  });

  it("supports a zero electricity rate (edge case, not blocked at this layer)", () => {
    const result = calculateElectricity({
      previousReading: 0,
      currentReading: 100,
      ratePerKwh: 0,
      motherMeterBill: 500,
    });

    expect(result.unit1Electricity).toBe(0);
    expect(result.unit2Electricity).toBe(500);
  });
});
