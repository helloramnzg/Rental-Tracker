import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { signInAsLandlord } from "../../support/clients";
import { createTenantFixture, type TenantFixture } from "../../support/factories/tenant";
import { deleteBillingCycles } from "../../support/factories/billing-cycle";
import { randomTestYear, randomMonth } from "../../support/random";
import {
  saveBillingCycle,
  BillingCycleNotEditableError,
} from "@/services/billing/save-billing-cycle";
import { generateSoasForBillingCycle } from "@/services/soa/generate-and-store-soa";
import type { BillingFormValues } from "@/features/billing/validation/schema";

describe("saveBillingCycle (integration)", () => {
  let supabase: SupabaseClient<Database>;
  let tenant: TenantFixture;
  const createdCycleIds: string[] = [];

  beforeAll(async () => {
    supabase = await signInAsLandlord();
  });

  beforeEach(async () => {
    tenant = await createTenantFixture(supabase, { electricityType: "submeter" });
  });

  afterEach(async () => {
    await deleteBillingCycles(supabase, createdCycleIds.splice(0));
    await tenant.cleanup();
  });

  function baseInput(overrides?: Partial<BillingFormValues>): BillingFormValues {
    return {
      year: randomTestYear(),
      month: randomMonth(),
      billingDate: "2026-08-05",
      motherMeterBill: 2000,
      previousReading: 0,
      currentReading: 100,
      electricityRate: 15,
      tenantCharges: [{ tenantId: tenant.tenantId, rent: tenant.monthlyRent, otherCharges: 0 }],
      ...overrides,
    };
  }

  it("creates a new draft cycle with correctly calculated charges", async () => {
    const input = baseInput();
    const result = await saveBillingCycle(supabase, input);
    createdCycleIds.push(result.billingCycleId);

    expect(result.ownSoaRegenerated).toBe(false);
    expect(result.cascade.cascadedCycles).toBe(0);

    const { data: cycle } = await supabase
      .from("billing_cycles")
      .select("status, mother_meter_bill")
      .eq("id", result.billingCycleId)
      .single();
    expect(cycle?.status).toBe("draft");
    expect(cycle?.mother_meter_bill).toBe(2000);

    const { data: meterReading } = await supabase
      .from("meter_readings")
      .select("usage_kwh, unit1_electricity")
      .eq("billing_cycle_id", result.billingCycleId)
      .single();
    expect(meterReading?.usage_kwh).toBe(100);
    expect(meterReading?.unit1_electricity).toBe(1500); // 100 kWh * 15

    const { data: charge } = await supabase
      .from("charges")
      .select("electricity, water, total_due")
      .eq("billing_cycle_id", result.billingCycleId)
      .eq("tenant_id", tenant.tenantId)
      .single();
    expect(charge?.electricity).toBe(1500);
    expect(charge?.water).toBe(200);
    expect(charge?.total_due).toBe(tenant.monthlyRent + 1500 + 200);
  });

  it("re-saving the same (year, month) updates the existing cycle instead of creating a second one", async () => {
    const input = baseInput({ motherMeterBill: 2000, currentReading: 100 });
    const first = await saveBillingCycle(supabase, input);
    createdCycleIds.push(first.billingCycleId);

    const second = await saveBillingCycle(supabase, { ...input, motherMeterBill: 3000, currentReading: 120 });
    expect(second.billingCycleId).toBe(first.billingCycleId);

    const { data: cycles } = await supabase
      .from("billing_cycles")
      .select("id")
      .eq("year", input.year)
      .eq("month", input.month);
    expect(cycles).toHaveLength(1);

    const { data: charge } = await supabase
      .from("charges")
      .select("electricity")
      .eq("billing_cycle_id", first.billingCycleId)
      .eq("tenant_id", tenant.tenantId)
      .single();
    expect(charge?.electricity).toBe(120 * 15); // updated usage_kwh * rate
  });

  it("routes a submeter tenant to unit1Electricity and a residual tenant to unit2Electricity", async () => {
    const residualTenant = await createTenantFixture(supabase, { electricityType: "residual" });
    try {
      const input = baseInput({
        motherMeterBill: 2000,
        currentReading: 100,
        tenantCharges: [{ tenantId: residualTenant.tenantId, rent: residualTenant.monthlyRent, otherCharges: 0 }],
      });
      const result = await saveBillingCycle(supabase, input);

      const { data: charge } = await supabase
        .from("charges")
        .select("electricity")
        .eq("billing_cycle_id", result.billingCycleId)
        .eq("tenant_id", residualTenant.tenantId)
        .single();
      // unit1 cost = 100 * 15 = 1500; unit2 (residual) = motherMeterBill - unit1 = 500
      expect(charge?.electricity).toBe(500);

      // Deleted here, not via the outer afterEach's createdCycleIds:
      // this cycle's charges reference residualTenant, so it must be
      // torn down BEFORE residualTenant.cleanup() runs below, or the
      // tenant delete fails on the charges.tenant_id FK (ON DELETE
      // RESTRICT).
      await deleteBillingCycles(supabase, [result.billingCycleId]);
    } finally {
      await residualTenant.cleanup();
    }
  });

  it("rejects edits once the cycle status is closed", async () => {
    const input = baseInput();
    const result = await saveBillingCycle(supabase, input);
    createdCycleIds.push(result.billingCycleId);

    const { error: closeError } = await supabase
      .from("billing_cycles")
      .update({ status: "closed" })
      .eq("id", result.billingCycleId);
    expect(closeError).toBeNull();

    await expect(saveBillingCycle(supabase, { ...input, motherMeterBill: 9999 })).rejects.toBeInstanceOf(
      BillingCycleNotEditableError,
    );
  });

  it("regenerates the SOA and reports ownSoaRegenerated when editing a soa_generated cycle", async () => {
    const input = baseInput();
    const result = await saveBillingCycle(supabase, input);
    createdCycleIds.push(result.billingCycleId);

    const soaResults = await generateSoasForBillingCycle(supabase, {
      billingCycleId: result.billingCycleId,
    });

    try {
      const edited = await saveBillingCycle(supabase, { ...input, motherMeterBill: 2500 });
      expect(edited.billingCycleId).toBe(result.billingCycleId);
      expect(edited.ownSoaRegenerated).toBe(true);

      const { data: cycle } = await supabase
        .from("billing_cycles")
        .select("status")
        .eq("id", result.billingCycleId)
        .single();
      expect(cycle?.status).toBe("soa_generated");
    } finally {
      for (const soa of soaResults) {
        await supabase.storage.from("soa").remove([soa.pdfPath]);
      }
    }
  });

  it("rejects a zero mother meter bill at the database check-constraint level even if it slipped past Zod", async () => {
    // Belt-and-suspenders: the DB itself enforces `mother_meter_bill > 0`
    // (supabase/migrations/20260806111057_initial_schema.sql).
    await expect(
      saveBillingCycle(supabase, baseInput({ motherMeterBill: 0 })),
    ).rejects.toBeTruthy();
  });
});
