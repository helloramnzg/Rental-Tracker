"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { propertySchema, type PropertyFormValues } from "@/features/settings/validation/schema";
import { updateProperty } from "@/services/settings/update-property";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function updatePropertyAction(
  input: PropertyFormValues,
): Promise<ActionResult<{ propertyId: string }>> {
  const parsed = propertySchema.safeParse(input);
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
    await updateProperty(supabase, {
      propertyId: parsed.data.propertyId,
      name: parsed.data.name,
      address: parsed.data.address || null,
    });
    revalidatePath("/settings");
    revalidatePath("/soa");
    return { success: true, data: { propertyId: parsed.data.propertyId } };
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update property details. Please try again.",
      },
    };
  }
}
