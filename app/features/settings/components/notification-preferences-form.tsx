"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  notificationPreferencesSchema,
  type NotificationPreferencesFormValues,
} from "@/features/settings/validation/schema";
import { updateNotificationPreferencesAction } from "@/features/settings/actions/update-notification-preferences";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function toggleLabel(value: boolean) {
  return value ? "Enabled" : "Disabled";
}

export function NotificationPreferencesForm({
  propertyId,
  emailEnabled,
  inAppEnabled,
}: {
  propertyId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const form = useForm<NotificationPreferencesFormValues>({
    resolver: zodResolver(notificationPreferencesSchema),
    defaultValues: { propertyId, emailEnabled, inAppEnabled },
  });
  const watched = useWatch({ control: form.control });

  async function onSubmit(values: NotificationPreferencesFormValues) {
    setError(null);
    setMessage(null);
    const result = await updateNotificationPreferencesAction(values);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setMessage("Notification preferences saved.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          The 25th/26th/27th reminder schedule itself is fixed and not configurable — this only
          controls whether those emails send at all.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

          <input type="hidden" {...form.register("propertyId")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Email Notifications</Label>
              <Select
                value={toggleLabel(watched.emailEnabled ?? true)}
                onValueChange={(v) => v && form.setValue("emailEnabled", v === "Enabled")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enabled">Enabled</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-caption text-muted-foreground">
                Reminder emails to the landlord (25th/26th/27th).
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>In-app Notifications</Label>
              <Select
                value={toggleLabel(watched.inAppEnabled ?? true)}
                onValueChange={(v) => v && form.setValue("inAppEnabled", v === "Enabled")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enabled">Enabled</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-caption text-muted-foreground">
                No in-app notification system exists yet — this preference is saved but has no
                effect until one is built.
              </p>
            </div>
          </div>

          <div>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save Notification Preferences"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
