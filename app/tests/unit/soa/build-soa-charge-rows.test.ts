import { describe, expect, it } from "vitest";
import { buildSoaChargeRows } from "@/services/soa/generate-soa-pdf";
import type { SoaData } from "@/services/soa/get-soa-data";

function makeSoaData(overrides: Partial<SoaData> = {}): SoaData {
  return {
    property: { name: "Test Property", address: null },
    tenant: { fullName: "Juan Dela Cruz", dueDay: 10 },
    unit: { name: "Unit 1" },
    billingCycle: { year: 2026, month: 8, motherMeterBill: 1500 },
    meterReading: {
      previousReading: 100,
      currentReading: 220,
      usageKwh: 120,
      ratePerKwh: 15,
    },
    charges: {
      rent: 8000,
      electricity: 1800,
      water: 200,
      otherCharges: 0,
      previousBalance: 0,
      totalDue: 10000,
    },
    amountPaid: 0,
    balanceDue: 10000,
    paymentStatus: "outstanding",
    ...overrides,
  };
}

// docs/product/17-soa-specification.md: the SOA must display the
// electricity charge amount, never the kWh usage quantity.
describe("buildSoaChargeRows", () => {
  it("does not include a kWh/usage detail on the Electricity row", () => {
    const rows = buildSoaChargeRows(makeSoaData());
    const electricityRow = rows.find((r) => r.label === "Electricity");

    expect(electricityRow).toBeDefined();
    expect(electricityRow?.amount).toBe(1800);
    expect(electricityRow?.detail).toBeUndefined();
  });

  it("no row anywhere mentions kWh", () => {
    const rows = buildSoaChargeRows(makeSoaData());
    for (const row of rows) {
      expect(row.label.toLowerCase()).not.toContain("kwh");
      expect((row.detail ?? "").toLowerCase()).not.toContain("kwh");
    }
  });

  it("includes Rent, Electricity, Water, Other Charges, and Previous Balance with their stored amounts", () => {
    const rows = buildSoaChargeRows(makeSoaData({
      charges: {
        rent: 8000,
        electricity: 1800,
        water: 200,
        otherCharges: 150,
        previousBalance: 500,
        totalDue: 10650,
      },
    }));

    expect(rows).toEqual([
      { label: "Rent", amount: 8000 },
      { label: "Electricity", amount: 1800 },
      { label: "Water", amount: 200 },
      { label: "Other Charges", amount: 150 },
      { label: "Previous Balance", amount: 500 },
    ]);
  });
});
