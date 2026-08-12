import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { signInAsLandlord } from "../../support/clients";
import { createTenantFixture, type TenantFixture } from "../../support/factories/tenant";
import {
  createBillingCycleFixture,
  type BillingCycleFixture,
} from "../../support/factories/billing-cycle";
import { createPaymentFixture } from "../../support/factories/payment";
import {
  generateAndStoreSoa,
  generateSoasForBillingCycle,
} from "@/services/soa/generate-and-store-soa";
import { getSoaData } from "@/services/soa/get-soa-data";
import { getSoaScreenContext } from "@/services/soa/get-soa-screen-context";

describe("SOA generation (integration)", () => {
  let supabase: SupabaseClient<Database>;
  let tenant: TenantFixture;
  let cycle: BillingCycleFixture;
  const uploadedPaths: string[] = [];

  beforeAll(async () => {
    supabase = await signInAsLandlord();
  });

  beforeEach(async () => {
    tenant = await createTenantFixture(supabase, { electricityType: "submeter", dueDay: 10 });
    cycle = await createBillingCycleFixture(supabase, {
      tenantId: tenant.tenantId,
      rent: 8000,
      otherCharges: 150,
      motherMeterBill: 1500,
      previousReading: 10,
      currentReading: 60,
      electricityRate: 15,
    });
  });

  afterEach(async () => {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("soa").remove(uploadedPaths.splice(0));
    }
    await supabase.from("generated_soas").delete().eq("billing_cycle_id", cycle.billingCycleId);
    await cycle.cleanup();
    await tenant.cleanup();
  });

  it("generates a non-empty PDF, uploads it, and records a generated_soas row", async () => {
    const result = await generateAndStoreSoa(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
    });
    uploadedPaths.push(result.pdfPath);

    expect(result.pdfPath).toContain(tenant.unitName.trim().replace(/\s+/g, "-"));

    const { data: downloaded, error: downloadError } = await supabase.storage
      .from("soa")
      .download(result.pdfPath);
    expect(downloadError).toBeNull();
    expect(downloaded).not.toBeNull();
    const bytes = await downloaded!.arrayBuffer();
    expect(bytes.byteLength).toBeGreaterThan(1000);
    // %PDF magic bytes
    expect(new TextDecoder().decode(new Uint8Array(bytes).slice(0, 4))).toBe("%PDF");

    const { data: soaRow } = await supabase
      .from("generated_soas")
      .select("id, pdf_path, tenant_id")
      .eq("id", result.generatedSoaId)
      .single();
    expect(soaRow?.pdf_path).toBe(result.pdfPath);
    expect(soaRow?.tenant_id).toBe(tenant.tenantId);
  });

  it("regenerating overwrites the same deterministic path rather than creating a second object", async () => {
    const first = await generateAndStoreSoa(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
    });
    uploadedPaths.push(first.pdfPath);

    const second = await generateAndStoreSoa(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
    });

    expect(second.pdfPath).toBe(first.pdfPath);
    expect(second.generatedSoaId).toBe(first.generatedSoaId);

    const { data: rows } = await supabase
      .from("generated_soas")
      .select("id")
      .eq("billing_cycle_id", cycle.billingCycleId)
      .eq("tenant_id", tenant.tenantId);
    expect(rows).toHaveLength(1);
  });

  it("generateSoasForBillingCycle transitions the cycle to soa_generated", async () => {
    const results = await generateSoasForBillingCycle(supabase, {
      billingCycleId: cycle.billingCycleId,
    });
    uploadedPaths.push(...results.map((r) => r.pdfPath));

    const { data: updatedCycle } = await supabase
      .from("billing_cycles")
      .select("status")
      .eq("id", cycle.billingCycleId)
      .single();
    expect(updatedCycle?.status).toBe("soa_generated");
  });

  it("getSoaData reflects payment status from actual recorded payments, not live tenant data", async () => {
    const outstandingBefore = await getSoaData(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
    });
    expect(outstandingBefore.paymentStatus).toBe("outstanding");
    expect(outstandingBefore.amountPaid).toBe(0);
    expect(outstandingBefore.tenant.dueDay).toBe(10);

    const payment = await createPaymentFixture(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: outstandingBefore.charges.totalDue,
    });
    try {
      const paidAfter = await getSoaData(supabase, {
        billingCycleId: cycle.billingCycleId,
        tenantId: tenant.tenantId,
      });
      expect(paidAfter.paymentStatus).toBe("paid");
      expect(paidAfter.amountPaid).toBe(outstandingBefore.charges.totalDue);
      // The billing snapshot itself must not change because a payment
      // was recorded (docs/architecture/10-pdf-generation.md).
      expect(paidAfter.charges.totalDue).toBe(outstandingBefore.charges.totalDue);
    } finally {
      await payment.cleanup();
    }
  });

  it("nets an advance/partial payment against the balance due, without altering the stored charge snapshot", async () => {
    const before = await getSoaData(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
    });
    expect(before.balanceDue).toBe(before.charges.totalDue);

    // e.g. charge = totalDue, advance payment = 2000 of it.
    const payment = await createPaymentFixture(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: 2000,
    });
    try {
      const afterPartial = await getSoaData(supabase, {
        billingCycleId: cycle.billingCycleId,
        tenantId: tenant.tenantId,
      });
      expect(afterPartial.amountPaid).toBe(2000);
      expect(afterPartial.balanceDue).toBe(before.charges.totalDue - 2000);
      expect(afterPartial.paymentStatus).toBe("partial");
      // The underlying charge snapshot must stay untouched.
      expect(afterPartial.charges.totalDue).toBe(before.charges.totalDue);
    } finally {
      await payment.cleanup();
    }
  });

  it("fully paying the balance brings balanceDue to zero", async () => {
    const before = await getSoaData(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
    });

    const payment = await createPaymentFixture(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: before.charges.totalDue,
    });
    try {
      const after = await getSoaData(supabase, {
        billingCycleId: cycle.billingCycleId,
        tenantId: tenant.tenantId,
      });
      expect(after.balanceDue).toBe(0);
      expect(after.paymentStatus).toBe("paid");
    } finally {
      await payment.cleanup();
    }
  });

  it("multiple payments toward the same cycle are all applied to the balance due", async () => {
    const before = await getSoaData(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
    });

    const firstPayment = await createPaymentFixture(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: 1000,
    });
    const secondPayment = await createPaymentFixture(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: 1500,
    });
    try {
      const after = await getSoaData(supabase, {
        billingCycleId: cycle.billingCycleId,
        tenantId: tenant.tenantId,
      });
      expect(after.amountPaid).toBe(2500);
      expect(after.balanceDue).toBe(before.charges.totalDue - 2500);
    } finally {
      await firstPayment.cleanup();
      await secondPayment.cleanup();
    }
  });

  it("getSoaScreenContext lists a card per billed tenant with generation metadata once generated", async () => {
    const before = await getSoaScreenContext(supabase, { year: cycle.year, month: cycle.month });
    expect(before.billingCycle?.id).toBe(cycle.billingCycleId);
    const cardBefore = before.cards.find((c) => c.tenantId === tenant.tenantId);
    expect(cardBefore?.generatedSoaId).toBeNull();

    const results = await generateSoasForBillingCycle(supabase, {
      billingCycleId: cycle.billingCycleId,
    });
    uploadedPaths.push(...results.map((r) => r.pdfPath));

    const after = await getSoaScreenContext(supabase, { year: cycle.year, month: cycle.month });
    const cardAfter = after.cards.find((c) => c.tenantId === tenant.tenantId);
    expect(cardAfter?.generatedSoaId).not.toBeNull();
    expect(cardAfter?.generatedAt).not.toBeNull();
    expect(cardAfter?.emailedAt).toBeNull();
  });
});
