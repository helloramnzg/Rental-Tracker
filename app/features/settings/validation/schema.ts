import { z } from "zod";

export const propertySchema = z.object({
  propertyId: z.string().guid(),
  name: z.string().trim().min(1, "Property name is required."),
  address: z.string().trim().optional(),
});

export type PropertyFormValues = z.infer<typeof propertySchema>;

export const billingSettingsSchema = z.object({
  propertyId: z.string().guid(),
  electricityRate: z.number().positive("Electricity rate must be greater than zero."),
});

export type BillingSettingsFormValues = z.infer<typeof billingSettingsSchema>;

export const notificationPreferencesSchema = z.object({
  propertyId: z.string().guid(),
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

export type NotificationPreferencesFormValues = z.infer<typeof notificationPreferencesSchema>;

// Profile and Change Password are validated client-side only (they go
// straight to Supabase Auth's browser client, not a Server Action —
// see features/settings/components/profile-form.tsx).
export const profileSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required."),
  phone: z.string().trim().optional(),
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
