"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  archiveTenantSchema,
  type ArchiveTenantFormValues,
} from "@/features/tenants/validation/schema";
import { archiveTenant } from "@/services/tenants/archive-tenant";
import { TenantNotFoundError } from "@/services/tenants/update-tenant";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function archiveTenantAction(
  input: ArchiveTenantFormValues,
): Promise<ActionResult<{ tenantId: string }>> {
  const parsed = archiveTenantSchema.safeParse(input);
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
    await archiveTenant(supabase, { tenantId: parsed.data.tenantId });
    revalidatePath("/tenants");
    revalidatePath(`/tenants/${parsed.data.tenantId}`);
    revalidatePath("/dashboard");
    return { success: true, data: { tenantId: parsed.data.tenantId } };
  } catch (error) {
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
        message: "Failed to archive the tenant. Please try again.",
      },
    };
  }
}
