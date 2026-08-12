import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { generateAndStoreSoa } from "@/services/soa/generate-and-store-soa";

export type SoaFixture = {
  pdfPath: string;
  generatedSoaId: string;
  cleanup: () => Promise<void>;
};

// There's no simpler way to produce a valid PDF-in-storage +
// generated_soas row than calling the real service — this wraps it
// with Storage cleanup tracked, since storage.objects has a
// delete-protection trigger against direct SQL deletes (HANDOVER.md)
// and must be removed through the Storage API instead.
export async function generateSoaFixture(
  supabase: SupabaseClient<Database>,
  { billingCycleId, tenantId }: { billingCycleId: string; tenantId: string },
): Promise<SoaFixture> {
  const result = await generateAndStoreSoa(supabase, { billingCycleId, tenantId });

  return {
    ...result,
    cleanup: async () => {
      const { error: storageError } = await supabase.storage.from("soa").remove([result.pdfPath]);
      if (storageError) throw storageError;
      const { error: rowError } = await supabase
        .from("generated_soas")
        .delete()
        .eq("id", result.generatedSoaId);
      if (rowError) throw rowError;
    },
  };
}
