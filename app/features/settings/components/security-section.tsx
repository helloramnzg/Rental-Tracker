"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from "@/features/settings/validation/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function SecuritySection({
  email,
  createdAt,
  lastSignInAt,
  sessionExpiresAt,
}: {
  email: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  sessionExpiresAt: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordFormValues) {
    setError(null);
    setMessage(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password: values.password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setMessage("Password changed.");
    reset();
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
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

        <div>
          <h3 className="mb-3 text-h3 text-foreground">Change Password</h3>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-caption text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-caption text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Changing…" : "Change Password"}
              </Button>
            </div>
          </form>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-h3 text-foreground">Session Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-small text-muted-foreground">Signed in as</p>
              <p className="text-body text-foreground">{email}</p>
            </div>
            <div>
              <p className="text-small text-muted-foreground">Last sign-in</p>
              <p className="text-body text-foreground">{formatDateTime(lastSignInAt)}</p>
            </div>
            <div>
              <p className="text-small text-muted-foreground">Session expires</p>
              <p className="text-body text-foreground">{formatDateTime(sessionExpiresAt)}</p>
            </div>
            <div>
              <p className="text-small text-muted-foreground">Account created</p>
              <p className="text-body text-foreground">{formatDateTime(createdAt)}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="mb-3 text-h3 text-foreground">Logout</h3>
          <Button type="button" variant="outline" disabled={loggingOut} onClick={handleLogout}>
            <LogOut size={16} className="mr-1.5" />
            {loggingOut ? "Logging out…" : "Log Out"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
