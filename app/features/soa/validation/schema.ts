import { z } from "zod";

export const generateSoaSchema = z.object({
  billingCycleId: z.string().uuid(),
});
export type GenerateSoaInput = z.infer<typeof generateSoaSchema>;

export const downloadSoaSchema = z.object({
  generatedSoaId: z.string().uuid(),
});
export type DownloadSoaInput = z.infer<typeof downloadSoaSchema>;
