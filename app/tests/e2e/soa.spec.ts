import { test, expect } from "@playwright/test";
import { loginAsLandlord } from "../support/e2e-login";
import { signInAsLandlord } from "../support/clients";
import { createTenantFixture, type TenantFixture } from "../support/factories/tenant";
import {
  createBillingCycleFixture,
  type BillingCycleFixture,
} from "../support/factories/billing-cycle";

// Full "generate and retrieve an SOA" journey per
// docs/design/22-layout-system.md SOA Screen: Header → Billing Month
// Selector → SOA Cards → Preview → Download. Runs against an ephemeral
// tenant/unit/billing-cycle fixture — see tests/support/README.md.
test.describe("Statements of Account", () => {
  let tenant: TenantFixture;
  let cycle: BillingCycleFixture;

  test.beforeAll(async () => {
    const supabase = await signInAsLandlord();
    tenant = await createTenantFixture(supabase, { dueDay: 10 });
    cycle = await createBillingCycleFixture(supabase, {
      tenantId: tenant.tenantId,
      rent: 8000,
      otherCharges: 0,
      motherMeterBill: 900,
      previousReading: 0,
      currentReading: 30,
      electricityRate: 15,
    });
  });

  test.afterAll(async () => {
    const supabase = await signInAsLandlord();
    const { data: soas } = await supabase
      .from("generated_soas")
      .select("pdf_path")
      .eq("billing_cycle_id", cycle.billingCycleId);
    if (soas && soas.length > 0) {
      await supabase.storage.from("soa").remove(soas.map((s) => s.pdf_path));
    }
    await cycle.cleanup();
    await tenant.cleanup();
  });

  test("generating an SOA makes Preview and Download available and opens a real PDF URL", async ({
    page,
    context,
  }) => {
    await loginAsLandlord(page);
    await page.goto(`/soa?year=${cycle.year}&month=${cycle.month}`);
    await page.waitForLoadState("networkidle");
    // The topbar's <h1> route title and the page's own <h2> both read
    // "Statements of Account" — level:2 disambiguates to the page heading.
    await expect(
      page.getByRole("heading", { name: "Statements of Account", level: 2 }),
    ).toBeVisible();
    // Before generation, the SOA cards (which show the tenant name)
    // don't render at all — only the empty state's Generate button does.
    await expect(page.getByText("No Statements of Account have been generated.")).toBeVisible();

    await page.getByRole("button", { name: "Generate SOAs" }).click();
    await expect(page.getByText("Generated", { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(tenant.tenantName)).toBeVisible();

    const previewButton = page.getByRole("button", { name: "Preview" });
    await expect(previewButton).toBeEnabled();

    // Chromium's built-in PDF viewer takes over the popup for an inline
    // PDF response, so neither "load" nor "commit" reliably fire on the
    // Page itself — wait for the actual network response instead, which
    // is driven by the network layer, not the PDF-viewer's rendering.
    const [popup, response] = await Promise.all([
      context.waitForEvent("page"),
      context.waitForEvent("response", {
        predicate: (res) => res.url().includes("/storage/v1/object/sign/soa/"),
        timeout: 15_000,
      }),
      previewButton.click(),
    ]);
    expect(response.url()).toContain("/storage/v1/object/sign/soa/");
    expect(response.ok()).toBe(true);
    await popup.close();
  });
});
