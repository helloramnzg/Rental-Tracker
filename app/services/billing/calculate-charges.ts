// Pure calculation. No DB, no React.
// Source of truth: docs/product/14-business-rules.md — Charges, Water Charge.

// Water Charge is a fixed, non-configurable business rule.
export const WATER_CHARGE = 200.0;

export type TenantCharges = {
  rent: number;
  electricity: number;
  water: number;
  otherCharges: number;
  previousBalance: number;
  totalDue: number;
};

export function calculateCharges({
  rent,
  electricity,
  otherCharges,
  previousBalance,
}: {
  rent: number;
  electricity: number;
  otherCharges: number;
  previousBalance: number;
}): TenantCharges {
  const water = WATER_CHARGE;
  const totalDue = rent + electricity + water + otherCharges + previousBalance;

  return { rent, electricity, water, otherCharges, previousBalance, totalDue };
}
