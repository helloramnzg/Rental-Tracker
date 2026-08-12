import { z } from "zod";

// Shared client + server validation, per docs/architecture/04-tech-stack.md
// (React Hook Form + Zod).
//
// IDs use .guid() (version-agnostic 8-4-4-4-12 hex format), not
// .uuid() (which additionally enforces RFC4122 version/variant
// nibbles). This project's seed data (supabase/seed.sql) uses
// hand-crafted "vanity" IDs like 33333333-3333-3333-3333-333333333331
// that are valid GUIDs but fail strict RFC4122 .uuid() validation —
// confirmed by testing directly, since this is the only property this
// app has, .uuid() would reject every real unit/tenant reference and
// make the Create/Edit Tenant forms non-functional. New rows created
// via gen_random_uuid() satisfy either check.

const emailField = z
  .string()
  .trim()
  .refine((v) => v === "" || z.string().email().safeParse(v).success, {
    message: "Enter a valid email address.",
  })
  .optional();

const leaseDates = {
  startDate: z.string().trim().min(1, "Start date is required."),
  endDate: z.string().trim().optional(),
};

function endDateNotBeforeStart(data: { startDate: string; endDate?: string }) {
  return !data.endDate || data.endDate >= data.startDate;
}
const endDateRefinement = {
  message: "End date cannot be earlier than start date.",
  path: ["endDate"],
};

export const createTenantSchema = z
  .object({
    unitId: z.string().guid("Select a unit."),
    fullName: z.string().trim().min(1, "Name is required."),
    monthlyRent: z.number().positive("Monthly rent must be greater than zero."),
    mobile: z.string().trim().optional(),
    email: emailField,
    notes: z.string().trim().optional(),
    ...leaseDates,
  })
  .refine(endDateNotBeforeStart, endDateRefinement);

export type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

export const updateTenantSchema = z
  .object({
    tenantId: z.string().guid(),
    fullName: z.string().trim().min(1, "Name is required."),
    monthlyRent: z.number().positive("Monthly rent must be greater than zero."),
    mobile: z.string().trim().optional(),
    email: emailField,
    notes: z.string().trim().optional(),
    active: z.boolean(),
    ...leaseDates,
  })
  .refine(endDateNotBeforeStart, endDateRefinement);

export type UpdateTenantFormValues = z.infer<typeof updateTenantSchema>;

export const archiveTenantSchema = z.object({ tenantId: z.string().guid() });
export type ArchiveTenantFormValues = z.infer<typeof archiveTenantSchema>;

export const restoreTenantSchema = z.object({ tenantId: z.string().guid() });
export type RestoreTenantFormValues = z.infer<typeof restoreTenantSchema>;
