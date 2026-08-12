import { test, expect } from "@playwright/test";
import { loginAsLandlord } from "../support/e2e-login";
import { signInAsLandlord } from "../support/clients";
import { createTenantFixture, type TenantFixture } from "../support/factories/tenant";
import {
  createBillingCycleFixture,
  type BillingCycleFixture,
} from "../support/factories/billing-cycle";
import { selectOption } from "../support/e2e-select";

// Full "record a payment" journey per docs/design/22-layout-system.md
// Payments Screen: Header → Payment Summary → Outstanding Balances →
// Payment History → Record Payment. Runs against an ephemeral
// tenant/unit/billing-cycle fixture, not the real seeded tenants — see
// tests/support/README.md.
test.describe("Payments", () => {
  let tenant: TenantFixture;
  let cycle: BillingCycleFixture;

  test.beforeAll(async () => {
    const supabase = await signInAsLandlord();
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

  test.afterAll(async () => {
    await cycle.cleanup();
    await tenant.cleanup();
  });

  test("recording a payment, then correcting it, walks the balance from outstanding to partial to paid", async ({
    page,
  }) => {
    await loginAsLandlord(page);
    await page.goto(`/payments?year=${cycle.year}&month=${cycle.month}`);
    await page.waitForLoadState("networkidle");
    // The topbar's <h1> route title and the page's own <h2> both read
    // "Payments" — level:2 disambiguates to the page heading.
    await expect(page.getByRole("heading", { name: "Payments", level: 2 })).toBeVisible();
    // Appears in both the Outstanding Balances table and the Record
    // Payment form's pre-selected Tenant dropdown value.
    await expect(page.getByText(tenant.tenantName).first()).toBeVisible();

    const balanceRow = page.getByRole("row", { name: new RegExp(tenant.tenantName) });
    await expect(balanceRow.getByText("outstanding", { exact: true })).toBeVisible();

    // The Record Payment form lives in a closed-by-default Sheet
    // (features/payments/components/payments-view.tsx) — Base UI's Portal
    // doesn't mount its content until opened, so the trigger in the page
    // header must be clicked before the form (and its comboboxes) exist.
    await page.getByRole("button", { name: "Record Payment" }).click();

    const halfDue = Math.round(cycle.totalDue / 2);
    const recordForm = page
      .locator("form")
      .filter({ has: page.getByRole("button", { name: "Record Payment" }) });
    const tenantSelect = recordForm.getByRole("combobox").nth(0);
    const methodSelect = recordForm.getByRole("combobox").nth(1);

    await selectOption(page, tenantSelect, `${tenant.tenantName} (${tenant.unitName})`);
    await page.getByLabel("Amount").fill(String(halfDue));
    await selectOption(page, methodSelect, "GCash");
    await page.getByLabel("Reference Number").fill("E2E-GC-001");
    await recordForm.getByRole("button", { name: "Record Payment" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Payment recorded" })).toBeVisible();
    await expect(balanceRow.getByText("partial", { exact: true })).toBeVisible();
    await expect(page.getByText("E2E-GC-001")).toBeVisible();

    // Correct the amount via the Edit sheet so the balance clears to paid
    // — the same correction journey docs/product/18-payment-system.md
    // implies is needed for human-error entries.
    await page.getByRole("button", { name: "Edit payment" }).first().click();
    const editSheet = page.getByRole("dialog");
    await expect(editSheet.getByText("Edit Payment")).toBeVisible();
    await editSheet.getByLabel("Amount").fill(String(cycle.totalDue));
    await editSheet.getByRole("button", { name: "Save Changes" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Payment updated" })).toBeVisible();
    await expect(balanceRow.getByText("paid", { exact: true })).toBeVisible();
  });
});
