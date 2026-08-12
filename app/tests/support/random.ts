import { randomBytes } from "node:crypto";

// billing_cycles.year only has a `>= 2000` check constraint — picking
// from a far-future range means a fixture can never collide with real
// billing history or with docs/examples that use 2026.
export function randomTestYear(): number {
  return 5000 + Math.floor(Math.random() * 3000);
}

export function randomMonth(): number {
  return 1 + Math.floor(Math.random() * 12);
}

export function randomSuffix(): string {
  return randomBytes(4).toString("hex");
}
