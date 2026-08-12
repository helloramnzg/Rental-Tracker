import { z } from "zod";

// Shared client + server validation, per docs/architecture/04-tech-stack.md
// (React Hook Form + Zod).
//
// tenantId uses .guid() (version-agnostic), not .uuid() (RFC4122
// strict) — see features/tenants/validation/schema.ts for why: seed
// tenant IDs are hand-crafted vanity UUIDs that fail .uuid()'s
// variant-nibble check.

export const paymentMethodSchema = z.enum(["cash", "gcash", "bank_transfer"]);

export const recordPaymentSchema = z.object({
  billingCycleId: z.string().guid(),
  tenantId: z.string().guid(),
  amount: z.number().positive("Amount must be greater than zero."),
  paymentDate: z.string().min(1, "Payment date is required."),
  method: paymentMethodSchema,
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

export const updatePaymentSchema = z.object({
  paymentId: z.string().guid(),
  amount: z.number().positive("Amount must be greater than zero."),
  paymentDate: z.string().min(1, "Payment date is required."),
  method: paymentMethodSchema,
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdatePaymentFormValues = z.infer<typeof updatePaymentSchema>;

export const deletePaymentSchema = z.object({
  paymentId: z.string().guid(),
});

export type DeletePaymentFormValues = z.infer<typeof deletePaymentSchema>;
