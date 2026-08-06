"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateSoaSchema } from "@/features/soa/validation/schema";
import { generateSoasForBillingCycle } from "@/services/soa/generate-and-store-soa";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

export async function generateSoaAction(input: {
  billingCycleId: string;
}): Promise<ActionResult<{ count: number }>> {
  const parsed = generateSoaSchema.safeParse(input);
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
    const results = await generateSoasForBillingCycle(supabase, parsed.data);
    revalidatePath("/soa");
    revalidatePath("/billing");
    revalidatePath("/dashboard");
    return { success: true, data: { count: results.length } };
  } catch {
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to generate Statements of Account. Please try again.",
      },
    };
  }
}
