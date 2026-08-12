"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { propertySchema, type PropertyFormValues } from "@/features/settings/validation/schema";
import { updatePropertyAction } from "@/features/settings/actions/update-property";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function PropertySettingsForm({
  propertyId,
  name,
  address,
}: {
  propertyId: string;
  name: string;
  address: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema),
    defaultValues: { propertyId, name, address: address ?? "" },
  });

  async function onSubmit(values: PropertyFormValues) {
    setError(null);
    setMessage(null);
    const result = await updatePropertyAction(values);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setMessage("Property details saved.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Settings</CardTitle>
        <CardDescription>Shown on generated Statements of Account.</CardDescription>
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

          <input type="hidden" {...register("propertyId")} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="property-name">Property Name</Label>
              <Input id="property-name" aria-invalid={!!errors.name} {...register("name")} />
              {errors.name && (
                <p className="text-caption text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="property-address">Property Address</Label>
              <Input id="property-address" {...register("address")} />
            </div>
          </div>

          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Property Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
