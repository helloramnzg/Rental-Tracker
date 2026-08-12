"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  billingSettingsSchema,
  type BillingSettingsFormValues,
} from "@/features/settings/validation/schema";
import { updateBillingSettingsAction } from "@/features/settings/actions/update-billing-settings";
import { formatCurrency } from "@/utils/format-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function BillingSettingsForm({
  propertyId,
  electricityRate,
  waterCharge,
}: {
  propertyId: string;
  electricityRate: number;
  waterCharge: number;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BillingSettingsFormValues>({
    resolver: zodResolver(billingSettingsSchema),
    defaultValues: { propertyId, electricityRate },
  });

  async function onSubmit(values: BillingSettingsFormValues) {
    setError(null);
    setMessage(null);
    const result = await updateBillingSettingsAction(values);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setMessage("Billing settings saved. Applies to future billing cycles only.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Settings</CardTitle>
        <CardDescription>
          Changes apply only to future billing cycles and do not modify previously generated
          SOAs.
        </CardDescription>
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
              <Label htmlFor="electricity-rate">Electricity Rate (₱/kWh)</Label>
              <Input
                id="electricity-rate"
                type="number"
                step="0.01"
                aria-invalid={!!errors.electricityRate}
                {...register("electricityRate", { valueAsNumber: true })}
              />
              {errors.electricityRate && (
                <p className="text-caption text-destructive">
                  {errors.electricityRate.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Water Charge</Label>
              <Input
                readOnly
                disabled
                value={formatCurrency(waterCharge)}
                className="bg-muted text-muted-foreground"
              />
              <p className="text-caption text-muted-foreground">
                Fixed by business rule — not configurable.
              </p>
            </div>
          </div>

          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save Billing Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
