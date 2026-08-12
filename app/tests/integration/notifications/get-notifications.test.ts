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
import { generateAndStoreSoa } from "@/services/soa/generate-and-store-soa";
import { getNotifications } from "@/services/notifications/get-notifications";

// Bug 4: the bell has no persisted notification backend to read from
// (see the comment on get-notifications.ts) — it derives its list from
// the same payment/SOA data the Dashboard already surfaces for a given
// billing period. getNotifications takes an explicit {year, month}
// (same convention as getPaymentsContext/getSoaScreenContext) rather
// than computing "now" internally, specifically so it can be tested
// against an isolated fixture period like this one.
describe("getNotifications (integration)", () => {
  let supabase: SupabaseClient<Database>;
  let tenant: TenantFixture;
  let cycle: BillingCycleFixture;
  const uploadedPaths: string[] = [];

  beforeAll(async () => {
    supabase = await signInAsLandlord();
  });

  beforeEach(async () => {
    tenant = await createTenantFixture(supabase, { electricityType: "submeter" });
    cycle = await createBillingCycleFixture(supabase, { tenantId: tenant.tenantId, rent: 8000 });
  });

  afterEach(async () => {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from("soa").remove(uploadedPaths.splice(0));
    }
    await supabase.from("generated_soas").delete().eq("billing_cycle_id", cycle.billingCycleId);
    await cycle.cleanup();
    await tenant.cleanup();
  });

  it("includes an outstanding-balance item for an unpaid tenant", async () => {
    const result = await getNotifications(supabase, { year: cycle.year, month: cycle.month });
    const item = result.items.find((i) => i.id === `payment-${tenant.tenantId}`);

    expect(item).toBeDefined();
    expect(item?.type).toBe("payment");
    expect(item?.title).toContain(tenant.tenantName);
    expect(item?.href).toBe("/payments");
  });

  it("drops the payment item once the tenant is fully paid", async () => {
    const before = await getNotifications(supabase, { year: cycle.year, month: cycle.month });
    expect(before.items.some((i) => i.id === `payment-${tenant.tenantId}`)).toBe(true);

    const payment = await createPaymentFixture(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
      amount: cycle.totalDue,
    });
    try {
      const after = await getNotifications(supabase, { year: cycle.year, month: cycle.month });
      expect(after.items.some((i) => i.id === `payment-${tenant.tenantId}`)).toBe(false);
    } finally {
      await payment.cleanup();
    }
  });

  it("includes a pending-SOA item when the cycle has no generated SOA yet", async () => {
    const result = await getNotifications(supabase, { year: cycle.year, month: cycle.month });
    expect(result.items.some((i) => i.id === "soa-pending")).toBe(true);
  });

  it("drops the pending-SOA item once every tenant's SOA has been generated", async () => {
    const generated = await generateAndStoreSoa(supabase, {
      billingCycleId: cycle.billingCycleId,
      tenantId: tenant.tenantId,
    });
    uploadedPaths.push(generated.pdfPath);

    const result = await getNotifications(supabase, { year: cycle.year, month: cycle.month });
    expect(result.items.some((i) => i.id === "soa-pending")).toBe(false);
  });

  it("returns no items for a month with no billing cycle at all", async () => {
    const result = await getNotifications(supabase, { year: cycle.year - 5, month: cycle.month });
    expect(result.items).toEqual([]);
  });
});
