import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type RecordPaymentInput = {
  billingCycleId: string;
  tenantId: string;
  amount: number;
  paymentDate: string;
  method: Database["public"]["Enums"]["payment_method"];
  referenceNumber?: string | null;
  notes?: string | null;
};

// Inserts one payment row. Multiple payments per tenant per billing
// cycle are allowed (docs/product/18-payment-system.md: "Multiple
// payments allowed"), covering both partial and full settlement.
export async function recordPayment(
  supabase: SupabaseClient<Database>,
  input: RecordPaymentInput,
): Promise<{ paymentId: string }> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      billing_cycle_id: input.billingCycleId,
      tenant_id: input.tenantId,
      amount: input.amount,
      payment_date: input.paymentDate,
      method: input.method,
      reference_number: input.referenceNumber ?? null,
      notes: input.notes ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;

  return { paymentId: data.id };
}
