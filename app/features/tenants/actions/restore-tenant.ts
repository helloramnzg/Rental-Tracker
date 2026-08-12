"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  restoreTenantSchema,
  type RestoreTenantFormValues,
} from "@/features/tenants/validation/schema";
import { restoreTenant } from "@/services/tenants/restore-tenant";
import { TenantNotFoundError } from "@/services/tenants/update-tenant";
import { DuplicateActiveTenantError } from "@/services/tenants/create-tenant";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function restoreTenantAction(
  input: RestoreTenantFormValues,
): Promise<ActionResult<{ tenantId: string }>> {
  const parsed = restoreTenantSchema.safeParse(input);
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
    await restoreTenant(supabase, { tenantId: parsed.data.tenantId });
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${parsed.data.tenantId}`);
    revalidatePath("/dashboard");
    return { success: true, data: { tenantId: parsed.data.tenantId } };
  } catch (error) {
    if (error instanceof DuplicateActiveTenantError) {
      return {
        success: false,
        error: { code: "CONFLICT", message: error.message },
      };
    }
    if (error instanceof TenantNotFoundError) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: error.message },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to restore the tenant. Please try again.",
      },
    };
  }
}
