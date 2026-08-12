"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase/client";
import { profileSchema, type ProfileFormValues } from "@/features/settings/validation/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

// Landlord Name and Contact Number live in Supabase Auth's
// user_metadata — there is no public.users table (see
// docs/architecture/06-database-design.md "users"). Updated directly
// via the browser client, same pattern as app/login/login-form.tsx,
// not a Server Action.
export function ProfileForm({
  fullName,
  phone,
  email,
}: {
  fullName: string;
  phone: string;
  email: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName, phone, email },
  });

  async function onSubmit(values: ProfileFormValues) {
    setError(null);
    setMessage(null);
    const supabase = createClient();

    const { error: metadataError } = await supabase.auth.updateUser({
      data: { full_name: values.fullName, phone: values.phone || null },
    });
    if (metadataError) {
      setError(metadataError.message);
      return;
    }

    const emailChanged = values.email !== email;
    if (emailChanged) {
      const { error: emailError } = await supabase.auth.updateUser({ email: values.email });
      if (emailError) {
        setError(emailError.message);
        return;
      }
      setMessage(
        `Name and contact number saved. A confirmation link was sent to ${values.email} — the email on file won't change until you click it.`,
      );
    } else {
      setMessage("Profile saved.");
    }

    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Changing your email requires confirming the new address.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-name">Landlord Name</Label>
              <Input
                id="profile-name"
                aria-invalid={!!errors.fullName}
                {...register("fullName")}
              />
              {errors.fullName && (
                <p className="text-caption text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-phone">Contact Number</Label>
              <Input id="profile-phone" {...register("phone")} />
            </div>

            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input
                id="profile-email"
                type="email"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-caption text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
