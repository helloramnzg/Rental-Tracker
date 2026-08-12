import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type PaymentFixture = {
  paymentId: string;
  cleanup: () => Promise<void>;
};

export async function createPaymentFixture(
  supabase: SupabaseClient<Database>,
  {
    billingCycleId,
    tenantId,
    amount,
    paymentDate = "2026-01-01",
    method = "cash",
  }: {
    billingCycleId: string;
    tenantId: string;
    amount: number;
    paymentDate?: string;
    method?: Database["public"]["Enums"]["payment_method"];
  },
): Promise<PaymentFixture> {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      billing_cycle_id: billingCycleId,
      tenant_id: tenantId,
      amount,
      payment_date: paymentDate,
      method,
    })
    .select("id")
    .single();
  if (error) throw error;

  return {
    paymentId: data.id,
    // Idempotent even after a billing-cycle-fixture cleanup already
    // deleted every payment for that cycle.
    cleanup: async () => {
      const { error: deleteError } = await supabase.from("payments").delete().eq("id", data.id);
      if (deleteError) throw deleteError;
    },
  };
}
