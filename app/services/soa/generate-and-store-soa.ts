import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSoaData } from "./get-soa-data";
import { generateSoaPdf } from "./generate-soa-pdf";

function buildStoragePath(year: number, month: number, unitName: string): string {
  const monthPadded = String(month).padStart(2, "0");
  const unitSlug = unitName.trim().replace(/\s+/g, "-");
  return `${year}/${monthPadded}/${year}-${monthPadded}_SOA_${unitSlug}.pdf`;
}

// Generates and stores one tenant's SOA for a billing cycle. Always
// regenerates from the stored billing snapshot (docs/architecture/
// 10-pdf-generation.md), and always writes to the same deterministic
// storage path for a given (billing_cycle_id, tenant_id), so
// "regenerate" naturally overwrites rather than accumulating files —
// the underlying numbers are immutable even though the PDF rendering
// can be regenerated.
export async function generateAndStoreSoa(
  supabase: SupabaseClient<Database>,
  { billingCycleId, tenantId }: { billingCycleId: string; tenantId: string },
): Promise<{ pdfPath: string; generatedSoaId: string }> {
  const data = await getSoaData(supabase, { billingCycleId, tenantId });
  const pdfBytes = await generateSoaPdf(data);

  const pdfPath = buildStoragePath(
    data.billingCycle.year,
    data.billingCycle.month,
    data.unit.name,
  );

  const { error: uploadError } = await supabase.storage
    .from("soa")
    .upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
  if (uploadError) throw uploadError;

  const { data: soaRow, error: soaError } = await supabase
    .from("generated_soas")
    .upsert(
      {
        billing_cycle_id: billingCycleId,
        tenant_id: tenantId,
        pdf_path: pdfPath,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "billing_cycle_id,tenant_id" },
    )
    .select("id")
    .single();
  if (soaError) throw soaError;

  return { pdfPath, generatedSoaId: soaRow.id };
}

// Generates SOAs for every tenant billed in this cycle, then advances
// the cycle to "soa_generated" — which also locks it against further
// billing edits (services/billing/save-billing-cycle.ts only allows
// edits while status is "draft").
export async function generateSoasForBillingCycle(
  supabase: SupabaseClient<Database>,
  { billingCycleId }: { billingCycleId: string },
): Promise<{ pdfPath: string; generatedSoaId: string; tenantId: string }[]> {
  const { data: charges, error: chargesError } = await supabase
    .from("charges")
    .select("tenant_id")
    .eq("billing_cycle_id", billingCycleId);
  if (chargesError) throw chargesError;

  const results = [];
  for (const charge of charges ?? []) {
    const result = await generateAndStoreSoa(supabase, {
      billingCycleId,
      tenantId: charge.tenant_id,
    });
    results.push({ ...result, tenantId: charge.tenant_id });
  }

  const { error: statusError } = await supabase
    .from("billing_cycles")
    .update({ status: "soa_generated" })
    .eq("id", billingCycleId);
  if (statusError) throw statusError;

  return results;
}
