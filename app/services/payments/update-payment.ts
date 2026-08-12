import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export class PaymentNotEditableError extends Error {
  constructor() {
    super("This payment can no longer be edited because its billing cycle is closed.");
    this.name = "PaymentNotEditableError";
  }
}

export type UpdatePaymentInput = {
  paymentId: string;
  amount: number;
  paymentDate: string;
  method: Database["public"]["Enums"]["payment_method"];
  referenceNumber?: string | null;
  notes?: string | null;
};

// Correction path for human-error inputs (wrong amount, wrong date,
// wrong method) — not part of the original Phase 7 scope but added
// per explicit instruction. Blocked once the payment's billing cycle
// is closed, matching docs/product/18-payment-system.md's deletion
// rule and docs/business/10-business-rules.md's general "closed
// cycles are read-only".
export async function updatePayment(
  supabase: SupabaseClient<Database>,
  input: UpdatePaymentInput,
): Promise<{ paymentId: string }> {
  const { data: existing, error: existingError } = await supabase
    .from("payments")
    .select("id, billing_cycle:billing_cycles(status)")
    .eq("id", input.paymentId)
    .single();
  if (existingError) throw existingError;

  const billingCycle = Array.isArray(existing.billing_cycle)
    ? existing.billing_cycle[0]
    : existing.billing_cycle;
  if (billingCycle?.status === "closed") {
    throw new PaymentNotEditableError();
  }

  const { error } = await supabase
    .from("payments")
    .update({
      amount: input.amount,
      payment_date: input.paymentDate,
      method: input.method,
      reference_number: input.referenceNumber ?? null,
      notes: input.notes ?? null,
    })
    .eq("id", input.paymentId);
  if (error) throw error;

  return { paymentId: input.paymentId };
}
