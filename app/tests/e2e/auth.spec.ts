import { test, expect } from "@playwright/test";
import { loginAsLandlord } from "../support/e2e-login";

// Full authentication journeys per docs/architecture/08-authentication.md.
// Note: the app has no logout button anywhere in its UI (checked
// components/layout/{topbar,sidebar}.tsx) — "logout" here is simulated
// by clearing the session cookie directly, which still exercises the
// real thing that matters: middleware re-blocking protected routes once
// the session is gone.
test.describe("Authentication", () => {
  test("logging in with valid credentials reaches the dashboard and unlocks protected pages", async ({
    page,
  }) => {
    await loginAsLandlord(page);
    // The topbar's route title (components/layout/topbar.tsx) is an <h1>
    // reading "Dashboard" on every visit, satisfying docs/design/23-dashboard-spec.md's
    // Header requirement. The page's own content (features/dashboard/components/dashboard-view.tsx)
    // replaces that with a personalized greeting once real data exists —
    // there is no second "Dashboard" heading to disambiguate against.
    await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();

    await page.goto("/billing");
    await expect(page).toHaveURL(/\/billing/);
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
  });

  test("logging in with an invalid password shows an error and stays on /login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel("Email").fill(process.env.TEST_LANDLORD_EMAIL!);
    await page.getByLabel("Password").fill("definitely-the-wrong-password");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting a protected route while signed out redirects to /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("visiting /login while already signed in redirects to /dashboard", async ({ page }) => {
    await loginAsLandlord(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("clearing the session blocks every previously-accessible protected page again", async ({
    page,
  }) => {
    await loginAsLandlord(page);
    await page.goto("/payments");
    await expect(page).toHaveURL(/\/payments/);

    await page.context().clearCookies();
    await page.goto("/payments");
    await expect(page).toHaveURL(/\/login/);
  });
});
