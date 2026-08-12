"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  billingSettingsSchema,
  type BillingSettingsFormValues,
} from "@/features/settings/validation/schema";
import { updateBillingSettings } from "@/services/settings/update-billing-settings";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function updateBillingSettingsAction(
  input: BillingSettingsFormValues,
): Promise<ActionResult<{ propertyId: string }>> {
  const parsed = billingSettingsSchema.safeParse(input);
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
    await updateBillingSettings(supabase, {
      propertyId: parsed.data.propertyId,
      electricityRate: parsed.data.electricityRate,
    });
    revalidatePath("/settings");
    revalidatePath("/billing");
    return { success: true, data: { propertyId: parsed.data.propertyId } };
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update billing settings. Please try again.",
      },
    };
  }
}
