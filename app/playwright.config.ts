import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Full user journeys only (docs/development/28-testing-strategy.md E2E
// section) against a real production build + the local Supabase
// instance. Production, not `next dev`: confirmed directly (not
// assumed) that `next dev`'s on-demand/Turbopack compilation can still
// be mid-flight after Playwright's networkidle resolves, so a click on
// the login form's submit button lands before React attaches its
// onSubmit handler — the browser then falls back to a native GET
// submit (?email=...&password=... in the URL) instead of authenticating.
// This is the same class of environment-specific flakiness HANDOVER.md
// documents for browser automation in this repo; the production build
// doesn't have it. See tests/support/README.md.
//
// Serialized (workers: 1) for the same reason integration tests are
// forced to a single fork — this app has exactly one property, so
// parallel specs would race on the same billing-cycle/settings
// singleton rows.
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalSetup: "./tests/support/e2e-global-setup.ts",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
