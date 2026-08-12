"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  notificationPreferencesSchema,
  type NotificationPreferencesFormValues,
} from "@/features/settings/validation/schema";
import { updateNotificationPreferences } from "@/services/settings/update-notification-preferences";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function updateNotificationPreferencesAction(
  input: NotificationPreferencesFormValues,
): Promise<ActionResult<{ propertyId: string }>> {
  const parsed = notificationPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid input." },
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
    await updateNotificationPreferences(supabase, {
      propertyId: parsed.data.propertyId,
      emailEnabled: parsed.data.emailEnabled,
      inAppEnabled: parsed.data.inAppEnabled,
    });
    revalidatePath("/settings");
    return { success: true, data: { propertyId: parsed.data.propertyId } };
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update notification preferences. Please try again.",
      },
    };
  }
}
