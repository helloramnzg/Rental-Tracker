import { describe, expect, it } from "vitest";
import { billingFormSchema } from "@/features/billing/validation/schema";

// docs/design/24-billing-screen.md Validation: current reading cannot
// be lower than previous; mother meter bill must be greater than zero.
const validInput = {
  year: 2026,
  month: 8,
  billingDate: "2026-08-05",
  motherMeterBill: 2000,
  previousReading: 100,
  currentReading: 150,
  electricityRate: 15,
  tenantCharges: [{ tenantId: "33333333-3333-3333-3333-333333333331", rent: 8000, otherCharges: 0 }],
};

describe("billingFormSchema", () => {
  it("accepts a fully valid billing form", () => {
    const result = billingFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects currentReading lower than previousReading", () => {
    const result = billingFormSchema.safeParse({
      ...validInput,
      previousReading: 200,
      currentReading: 150,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["currentReading"]);
  });

  it("accepts currentReading exactly equal to previousReading (zero usage is valid)", () => {
    const result = billingFormSchema.safeParse({
      ...validInput,
      previousReading: 150,
      currentReading: 150,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a zero mother meter bill", () => {
    const result = billingFormSchema.safeParse({ ...validInput, motherMeterBill: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects a negative mother meter bill", () => {
    const result = billingFormSchema.safeParse({ ...validInput, motherMeterBill: -500 });
    expect(result.success).toBe(false);
  });

  it("rejects a zero or negative electricity rate", () => {
    expect(billingFormSchema.safeParse({ ...validInput, electricityRate: 0 }).success).toBe(false);
    expect(billingFormSchema.safeParse({ ...validInput, electricityRate: -1 }).success).toBe(false);
  });

  it("rejects a negative previous reading", () => {
    const result = billingFormSchema.safeParse({ ...validInput, previousReading: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects an empty tenantCharges array — at least one tenant is required", () => {
    const result = billingFormSchema.safeParse({ ...validInput, tenantCharges: [] });
    expect(result.success).toBe(false);
  });

  it("rejects negative rent or negative other charges per tenant", () => {
    expect(
      billingFormSchema.safeParse({
        ...validInput,
        tenantCharges: [{ ...validInput.tenantCharges[0], rent: -1 }],
      }).success,
    ).toBe(false);
    expect(
      billingFormSchema.safeParse({
        ...validInput,
        tenantCharges: [{ ...validInput.tenantCharges[0], otherCharges: -1 }],
      }).success,
    ).toBe(false);
  });

  it("rejects month outside 1-12", () => {
    expect(billingFormSchema.safeParse({ ...validInput, month: 0 }).success).toBe(false);
    expect(billingFormSchema.safeParse({ ...validInput, month: 13 }).success).toBe(false);
  });

  it("accepts a hand-crafted vanity GUID tenantId that fails strict RFC4122 .uuid()", () => {
    // This is exactly the seed data shape — the schema deliberately uses
    // .guid() instead of .uuid() to allow it (see the schema's own
    // comment). Pinning it down so nobody "fixes" it back to .uuid().
    const result = billingFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a missing billingDate", () => {
    const result = billingFormSchema.safeParse({ ...validInput, billingDate: "" });
    expect(result.success).toBe(false);
  });
});
