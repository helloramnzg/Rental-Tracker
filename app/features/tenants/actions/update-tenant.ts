"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  updateTenantSchema,
  type UpdateTenantFormValues,
} from "@/features/tenants/validation/schema";
import {
  updateTenant,
  TenantNotFoundError,
} from "@/services/tenants/update-tenant";
import { DuplicateActiveTenantError } from "@/services/tenants/create-tenant";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function updateTenantAction(
  input: UpdateTenantFormValues,
): Promise<ActionResult<{ tenantId: string }>> {
  const parsed = updateTenantSchema.safeParse(input);
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
    await updateTenant(supabase, {
      tenantId: parsed.data.tenantId,
      patch: {
        fullName: parsed.data.fullName,
        monthlyRent: parsed.data.monthlyRent,
        mobile: parsed.data.mobile || null,
        email: parsed.data.email || null,
        notes: parsed.data.notes || null,
        active: parsed.data.active,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate || null,
      },
    });
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
        message: "Failed to update the tenant. Please try again.",
      },
    };
  }
}
