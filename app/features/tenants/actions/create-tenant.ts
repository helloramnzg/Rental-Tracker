"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createTenantSchema,
  type CreateTenantFormValues,
} from "@/features/tenants/validation/schema";
import {
  createTenant,
  DuplicateActiveTenantError,
  UnitNotFoundError,
} from "@/services/tenants/create-tenant";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function createTenantAction(
  input: CreateTenantFormValues,
): Promise<ActionResult<{ tenantId: string }>> {
  const parsed = createTenantSchema.safeParse(input);
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
    const result = await createTenant(supabase, {
      unitId: parsed.data.unitId,
      fullName: parsed.data.fullName,
      monthlyRent: parsed.data.monthlyRent,
      mobile: parsed.data.mobile || null,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate || null,
    });
    revalidatePath("/tenants");
    revalidatePath("/dashboard");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof DuplicateActiveTenantError || error instanceof UnitNotFoundError) {
      return {
        success: false,
        error: { code: "CONFLICT", message: error.message },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create the tenant. Please try again.",
      },
    };
  }
}
