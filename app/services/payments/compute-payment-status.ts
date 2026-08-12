export type PaymentStatus = "outstanding" | "partial" | "paid";

// Shared by the SOA and Payments screens (previously duplicated in
// services/soa/get-soa-data.ts — see HANDOVER.md Phase 7 notes).
export function computePaymentStatus(
  totalDue: number,
  amountPaid: number,
): PaymentStatus {
  if (amountPaid <= 0) return "outstanding";
  if (amountPaid >= totalDue) return "paid";
  return "partial";
}
