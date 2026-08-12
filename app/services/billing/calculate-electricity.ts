// Pure calculation. No DB, no React.
// Source of truth: docs/product/14-business-rules.md — Electricity.
//
// Unit 1: (Current Reading − Previous Reading) × Electricity Rate
// Unit 2: Mother Meter Bill − Unit 1 Electricity Cost

export type ElectricityCalculation = {
  usageKwh: number;
  unit1Electricity: number;
  unit2Electricity: number;
};

export function calculateElectricity({
  previousReading,
  currentReading,
  ratePerKwh,
  motherMeterBill,
}: {
  previousReading: number;
  currentReading: number;
  ratePerKwh: number;
  motherMeterBill: number;
}): ElectricityCalculation {
  const usageKwh = currentReading - previousReading;
  const unit1Electricity = usageKwh * ratePerKwh;
  const unit2Electricity = motherMeterBill - unit1Electricity;

  return { usageKwh, unit1Electricity, unit2Electricity };
}
