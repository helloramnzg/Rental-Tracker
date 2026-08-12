"use server";

import { createClient } from "@/lib/supabase/server";
import { downloadSoaSchema } from "@/features/soa/validation/schema";
import type { ActionResult } from "@/features/billing/actions/save-billing-cycle";

const SIGNED_URL_TTL_SECONDS = 60;

export async function getSoaDownloadUrlAction(input: {
  generatedSoaId: string;
  mode?: "preview" | "download";
}): Promise<ActionResult<{ url: string; fileName: string }>> {
  const parsed = downloadSoaSchema.safeParse(input);
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

  const { data: soa, error: soaError } = await supabase
    .from("generated_soas")
    .select("pdf_path")
    .eq("id", parsed.data.generatedSoaId)
    .single();

  if (soaError || !soa) {
    return {
      success: false,
      error: { code: "NOT_FOUND", message: "Statement of Account not found." },
    };
  }

  const forceDownload = (input.mode ?? "download") === "download";

  const { data: signed, error: signError } = await supabase.storage
    .from("soa")
    .createSignedUrl(
      soa.pdf_path,
      SIGNED_URL_TTL_SECONDS,
      forceDownload ? { download: true } : {},
    );

  if (signError || !signed) {
    return {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Failed to prepare download." },
    };
  }

  return {
    success: true,
    data: { url: signed.signedUrl, fileName: soa.pdf_path.split("/").pop() ?? "SOA.pdf" },
  };
}
