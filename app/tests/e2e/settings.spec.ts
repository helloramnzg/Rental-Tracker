import { test, expect } from "@playwright/test";
import { loginAsLandlord } from "../support/e2e-login";
import { signInAsLandlord } from "../support/clients";
import {
  snapshotSettings,
  restoreSettings,
  type SettingsSnapshot,
} from "../support/factories/settings";
import { selectOption } from "../support/e2e-select";

// Full "update settings" journey per docs/design/26-settings-screen.md
// and the Notification Preferences section. Settings is a real
// one-row-per-property singleton — snapshot/restore around the test,
// same as the Settings integration tests. See tests/support/README.md.
//
// Card titles (components/ui/card.tsx CardTitle) render as plain
// `<div data-slot="card-title">`, not a heading element, so they're
// located by that data-slot rather than getByRole("heading").
test.describe("Settings", () => {
  let snapshot: SettingsSnapshot;

  test.beforeEach(async () => {
    const supabase = await signInAsLandlord();
    snapshot = await snapshotSettings(supabase);
  });

  test.afterEach(async () => {
    const supabase = await signInAsLandlord();
    await restoreSettings(supabase, snapshot);
  });

  function cardByTitle(page: import("@playwright/test").Page, title: string) {
    return page
      .locator('[data-slot="card"]')
      .filter({ has: page.locator('[data-slot="card-title"]', { hasText: title }) });
  }

  test("updating the electricity rate persists across a reload, water charge stays fixed", async ({
    page,
  }) => {
    await loginAsLandlord(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const billingCard = cardByTitle(page, "Billing Settings");
    await expect(billingCard).toBeVisible();

    const rateInput = page.locator("#electricity-rate");
    await rateInput.fill("18.75");
    await billingCard.getByRole("button", { name: "Save Billing Settings" }).click();

    await expect(page.getByRole("alert").filter({ hasText: "Billing settings saved" })).toBeVisible();

    await page.reload();
    await expect(page.locator("#electricity-rate")).toHaveValue("18.75");
    // formatCurrency(200) → "₱200.00", but it's an <input value=...>, not
    // rendered text — getByText can't see it, so check the value directly.
    await expect(cardByTitle(page, "Billing Settings").locator("input[readonly]")).toHaveValue(
      "₱200.00",
    );
  });

  test("toggling notification preferences persists across a reload", async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");

    const notificationsCard = cardByTitle(page, "Notification Preferences");
    await expect(notificationsCard).toBeVisible();
    const emailSelect = notificationsCard.getByRole("combobox").nth(0);

    await selectOption(page, emailSelect, "Disabled");
    await notificationsCard.getByRole("button", { name: "Save Notification Preferences" }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: "Notification preferences saved" }),
    ).toBeVisible();

    await page.reload();
    // toContainText, not toHaveText: the trigger's rendered text also
    // includes the (decorative, but text-visible) chevron-down glyph.
    const reloadedCard = cardByTitle(page, "Notification Preferences");
    await expect(reloadedCard.getByRole("combobox").nth(0)).toContainText("Disabled");
  });
});
