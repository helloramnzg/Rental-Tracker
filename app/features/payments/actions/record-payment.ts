"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  recordPaymentSchema,
  type RecordPaymentFormValues,
} from "@/features/payments/validation/schema";
import { recordPayment } from "@/services/payments/record-payment";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function recordPaymentAction(
  input: RecordPaymentFormValues,
): Promise<ActionResult<{ paymentId: string }>> {
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid input.",
      },
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: { code: "UNAUTHORIZED", message: "You must be signed in." },
    };
  }

  try {
    const result = await recordPayment(supabase, {
      billingCycleId: parsed.data.billingCycleId,
      tenantId: parsed.data.tenantId,
      amount: parsed.data.amount,
      paymentDate: parsed.data.paymentDate,
      method: parsed.data.method,
      referenceNumber: parsed.data.referenceNumber || null,
      notes: parsed.data.notes || null,
    });
    revalidatePath("/payments");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to record the payment. Please try again.",
      },
    };
  }
}
