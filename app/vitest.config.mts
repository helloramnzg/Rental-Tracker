import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Two projects per docs/development/28-testing-strategy.md's pyramid:
// - unit: pure functions only (services/*, emails/*, validation) — no
//   network, no DB, safe to run fully parallel.
// - integration: hits the local Supabase instance directly. Forced to a
//   single fork/no file-parallelism because this app's domain has only
//   one property — see tests/support/README.md for why that constraint
//   shapes the whole fixture strategy.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(rootDir, ".") },
  },
  test: {
    projects: [
      {
        resolve: { alias: { "@": path.resolve(rootDir, ".") } },
        test: {
          name: "unit",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        resolve: { alias: { "@": path.resolve(rootDir, ".") } },
        test: {
          name: "integration",
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          setupFiles: ["tests/support/integration-setup.ts"],
          testTimeout: 30_000,
          hookTimeout: 30_000,
          pool: "forks",
          maxWorkers: 1,
          sequence: { concurrent: false },
        },
      },
    ],
  },
});
