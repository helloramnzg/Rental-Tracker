import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Drives the real login form (app/app/login/login-form.tsx) — this is
// the actual authentication journey, not a cookie shortcut, since
// Authentication itself is one of the E2E targets.
export async function loginAsLandlord(page: Page): Promise<void> {
  const email = requireEnv("TEST_LANDLORD_EMAIL");
  const password = requireEnv("TEST_LANDLORD_PASSWORD");

  await page.goto("/login");
  // Without this, the "Sign in" button can be clicked before React
  // hydrates and attaches the form's onSubmit handler — the browser
  // then falls back to a native GET submit, landing on
  // /login?email=...&password=... instead of authenticating. Waiting
  // for network idle is a reliable-enough proxy for "hydrated" on a
  // page this simple.
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required test env var ${name}. Check .env.test / .env.test.example.`);
  }
  return value;
}
