import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { PaymentNotEditableError } from "./update-payment";

// Correction path for human-error inputs (duplicate or mistaken entry).
// Blocked once the payment's billing cycle is closed
// (docs/product/18-payment-system.md: "Payment history cannot be
// deleted after billing is closed").
export async function deletePayment(
  supabase: SupabaseClient<Database>,
  { paymentId }: { paymentId: string },
): Promise<void> {
  const { data: existing, error: existingError } = await supabase
    .from("payments")
    .select("id, billing_cycle:billing_cycles(status)")
    .eq("id", paymentId)
    .single();
  if (existingError) throw existingError;

  const billingCycle = Array.isArray(existing.billing_cycle)
    ? existing.billing_cycle[0]
    : existing.billing_cycle;
  if (billingCycle?.status === "closed") {
    throw new PaymentNotEditableError();
  }

  const { error } = await supabase.from("payments").delete().eq("id", paymentId);
  if (error) throw error;
}
