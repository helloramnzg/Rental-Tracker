"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  billingFormSchema,
  type BillingFormValues,
} from "@/features/billing/validation/schema";
import {
  saveBillingCycle,
  BillingCycleNotEditableError,
  type SaveBillingCycleResult,
} from "@/services/billing/save-billing-cycle";

// Standard response shape per docs/architecture/07-api-design.md.
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export async function saveBillingCycleAction(
  input: BillingFormValues,
): Promise<ActionResult<SaveBillingCycleResult>> {
  const parsed = billingFormSchema.safeParse(input);
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
    const result = await saveBillingCycle(supabase, parsed.data);
    revalidatePath("/billing");
    revalidatePath("/soa");
    revalidatePath("/payments");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof BillingCycleNotEditableError) {
      return {
        success: false,
        error: { code: "CONFLICT", message: error.message },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to save the billing cycle. Please try again.",
      },
    };
  }
}
