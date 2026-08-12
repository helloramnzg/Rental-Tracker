import { test, expect } from "@playwright/test";
import { loginAsLandlord } from "../support/e2e-login";
import { randomTestYear, randomMonth } from "../support/random";
import { signInAsLandlord } from "../support/clients";
import { getActivePropertyId } from "../support/factories/shared";
import { deleteBillingCycles } from "../support/factories/billing-cycle";

// Full "complete a month's billing" journey per
// docs/project/00-project-charter.md Success Criteria (steps 1-3):
// enter mother meter bill, enter current submeter reading, review
// calculations, save.
//
// Unlike the other E2E specs, this one drives the actual "create a
// cycle" flow against the real seeded tenants (the Billing form always
// shows every currently active tenant, not a selectable fixture) — so
// it must clean up the real billing_cycle row it creates itself, rather
// than relying on a factory's own teardown.
test.describe("Billing", () => {
  let year: number;
  let month: number;

  test.beforeEach(() => {
    year = randomTestYear();
    month = randomMonth();
  });

  test.afterEach(async () => {
    const supabase = await signInAsLandlord();
    const propertyId = await getActivePropertyId(supabase);
    const { data: cycle } = await supabase
      .from("billing_cycles")
      .select("id")
      .eq("property_id", propertyId)
      .eq("year", year)
      .eq("month", month)
      .maybeSingle();
    if (cycle) {
      await deleteBillingCycles(supabase, [cycle.id]);
    }
  });

  test("creating a billing cycle calculates electricity and totals, then persists on reload", async ({
    page,
  }) => {
    await loginAsLandlord(page);
    await page.goto(`/billing?year=${year}&month=${month}`);
    await page.waitForLoadState("networkidle");
    // The topbar's <h1> route title and the page's own <h2> both read
    // "Monthly Billing" — level:2 disambiguates to the page heading.
    await expect(page.getByRole("heading", { name: "Monthly Billing", level: 2 })).toBeVisible();

    const previousReadingInput = page.locator("#previousReading");
    const previousReading = Number(await previousReadingInput.inputValue());
    const currentReading = previousReading + 40;

    await page.locator("#motherMeterBill").fill("1800");
    await page.locator("#electricityRate").fill("15");
    await page.locator("#currentReading").fill(String(currentReading));

    // Electricity Calculation card updates live, before any save.
    const usageLabel = page.locator("p", { hasText: "Usage (kWh)" });
    await expect(usageLabel).toBeVisible();
    const usageValue = usageLabel.locator("xpath=following-sibling::p[1]");
    await expect(usageValue).toHaveText("40.00");

    await page.getByRole("button", { name: "Save Billing Cycle" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Billing cycle saved" })).toBeVisible();

    // A fresh load must show the persisted values, not just client state.
    await page.reload();
    await expect(page.locator("#motherMeterBill")).toHaveValue("1800");
    await expect(page.locator("#currentReading")).toHaveValue(String(currentReading));
    await expect(page.getByText("draft", { exact: true })).toBeVisible();
  });

  test("rejects a current reading lower than the previous reading with an inline validation message", async ({
    page,
  }) => {
    await loginAsLandlord(page);
    await page.goto(`/billing?year=${year}&month=${month}`);
    await page.waitForLoadState("networkidle");

    const previousReadingInput = page.locator("#previousReading");
    await previousReadingInput.fill("100");
    await page.locator("#currentReading").fill("50");
    await page.locator("#motherMeterBill").fill("1000");

    await page.getByRole("button", { name: "Save Billing Cycle" }).click();
    await expect(page.getByText("Current reading cannot be lower than previous.")).toBeVisible();
  });
});
