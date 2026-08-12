"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  deletePaymentSchema,
  type DeletePaymentFormValues,
} from "@/features/payments/validation/schema";
import { deletePayment } from "@/services/payments/delete-payment";
import { PaymentNotEditableError } from "@/services/payments/update-payment";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function deletePaymentAction(
  input: DeletePaymentFormValues,
): Promise<ActionResult<{ paymentId: string }>> {
  const parsed = deletePaymentSchema.safeParse(input);
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
    await deletePayment(supabase, { paymentId: parsed.data.paymentId });
    revalidatePath("/payments");
    revalidatePath("/dashboard");
    return { success: true, data: { paymentId: parsed.data.paymentId } };
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
        message: "Failed to delete the payment. Please try again.",
      },
    };
  }
}
