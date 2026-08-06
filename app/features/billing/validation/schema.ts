import { z } from "zod";

// Shared client + server validation, per docs/architecture/04-tech-stack.md
// (React Hook Form + Zod) and docs/design/24-billing-screen.md Validation:
// current reading cannot be lower than previous; mother meter bill must
// be greater than zero.

export const tenantChargeInputSchema = z.object({
  tenantId: z.string().uuid(),
  rent: z.number().min(0, "Rent cannot be negative."),
  otherCharges: z.number().min(0, "Other charges cannot be negative."),
});

export const billingFormSchema = z
  .object({
    year: z.number().int().min(2000),
    month: z.number().int().min(1).max(12),
    motherMeterBill: z
      .number()
      .positive("Mother meter bill must be greater than zero."),
    previousReading: z.number().min(0),
    currentReading: z.number().min(0),
    electricityRate: z.number().positive("Electricity rate must be greater than zero."),
    tenantCharges: z.array(tenantChargeInputSchema).min(1),
  })
  .refine((data) => data.currentReading >= data.previousReading, {
    message: "Current reading cannot be lower than previous.",
    path: ["currentReading"],
  });

export type BillingFormValues = z.infer<typeof billingFormSchema>;
