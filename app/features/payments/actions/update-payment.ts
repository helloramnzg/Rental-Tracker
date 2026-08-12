"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updatePaymentSchema,
  type UpdatePaymentFormValues,
} from "@/features/payments/validation/schema";
import {
  updatePayment,
  PaymentNotEditableError,
} from "@/services/payments/update-payment";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function updatePaymentAction(
  input: UpdatePaymentFormValues,
): Promise<ActionResult<{ paymentId: string }>> {
  const parsed = updatePaymentSchema.safeParse(input);
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
    const result = await updatePayment(supabase, {
      paymentId: parsed.data.paymentId,
      amount: parsed.data.amount,
      paymentDate: parsed.data.paymentDate,
      method: parsed.data.method,
      referenceNumber: parsed.data.referenceNumber || null,
      notes: parsed.data.notes || null,
    });
    revalidatePath("/payments");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof PaymentNotEditableError) {
      return {
        success: false,
        error: { code: "CONFLICT", message: error.message },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update the payment. Please try again.",
      },
    };
  }
}
