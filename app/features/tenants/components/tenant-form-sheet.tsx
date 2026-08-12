"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { TenantDetail } from "@/services/tenants/get-tenant-detail";
import type { UnitOption } from "@/services/tenants/get-units-for-tenant-form";
import {
  createTenantSchema,
  updateTenantSchema,
  type CreateTenantFormValues,
  type UpdateTenantFormValues,
} from "@/features/tenants/validation/schema";
import { createTenantAction } from "@/features/tenants/actions/create-tenant";
import { updateTenantAction } from "@/features/tenants/actions/update-tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

export type TenantFormMode = { type: "create" } | { type: "edit"; tenant: TenantDetail };

// Builds "YYYY-MM-DD" from local date parts, not toISOString() (which
// converts to UTC first and can shift the calendar day backward in
// timezones ahead of UTC — see services/dashboard/get-upcoming-reminder.ts).
function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function TenantFormSheet({
  mode,
  units,
  onOpenChange,
  onSaved,
}: {
  mode: TenantFormMode | null;
  units: UnitOption[];
  onOpenChange: (open: boolean) => void;
  onSaved: (message: string) => void;
}) {
  return (
    <Sheet open={mode !== null} onOpenChange={onOpenChange}>
      <SheetContent>
        {mode?.type === "create" && (
          <CreateTenantForm units={units} onOpenChange={onOpenChange} onSaved={onSaved} />
        )}
        {mode?.type === "edit" && (
          <EditTenantForm
            tenant={mode.tenant}
            onOpenChange={onOpenChange}
            onSaved={onSaved}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function CreateTenantForm({
  units,
  onOpenChange,
  onSaved,
}: {
  units: UnitOption[];
  onOpenChange: (open: boolean) => void;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const form = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      unitId: units.find((u) => !u.hasActiveTenant)?.id ?? "",
      fullName: "",
      monthlyRent: 0,
      mobile: "",
      email: "",
      notes: "",
      startDate: todayIso(),
      endDate: "",
    },
  });
  const watched = useWatch({ control: form.control });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(values: CreateTenantFormValues) {
    setError(null);
    const result = await createTenantAction(values);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    onOpenChange(false);
    onSaved("Tenant created.");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
      <SheetHeader>
        <SheetTitle>Add Tenant</SheetTitle>
        <SheetDescription>Create a new tenant for a vacant unit.</SheetDescription>
      </SheetHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          aria-invalid={!!form.formState.errors.fullName}
          {...form.register("fullName")}
        />
        {form.formState.errors.fullName && (
          <p className="text-caption text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Unit</Label>
        <Select
          value={watched.unitId ?? ""}
          onValueChange={(v) => v && form.setValue("unitId", v)}
        >
          <SelectTrigger>
            <SelectValue>
              {(value: string) => units.find((u) => u.id === value)?.name ?? "Select a unit"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id} disabled={unit.hasActiveTenant}>
                {unit.name} {unit.hasActiveTenant ? "(occupied)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.unitId && (
          <p className="text-caption text-destructive">{form.formState.errors.unitId.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="monthlyRent">Monthly Rent</Label>
        <Input
          id="monthlyRent"
          type="number"
          step="0.01"
          aria-invalid={!!form.formState.errors.monthlyRent}
          {...form.register("monthlyRent", { valueAsNumber: true })}
        />
        {form.formState.errors.monthlyRent && (
          <p className="text-caption text-destructive">
            {form.formState.errors.monthlyRent.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">Tenant Start Date</Label>
          <Input
            id="startDate"
            type="date"
            aria-invalid={!!form.formState.errors.startDate}
            {...form.register("startDate")}
          />
          {form.formState.errors.startDate && (
            <p className="text-caption text-destructive">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">Tenant End Date</Label>
          <Input
            id="endDate"
            type="date"
            aria-invalid={!!form.formState.errors.endDate}
            {...form.register("endDate")}
          />
          {form.formState.errors.endDate && (
            <p className="text-caption text-destructive">{form.formState.errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="mobile">Contact Number</Label>
        <Input id="mobile" {...form.register("mobile")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          aria-invalid={!!form.formState.errors.email}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-caption text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" {...form.register("notes")} />
      </div>

      <SheetFooter>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating…" : "Create Tenant"}
        </Button>
      </SheetFooter>
    </form>
  );
}

function EditTenantForm({
  tenant,
  onOpenChange,
  onSaved,
}: {
  tenant: TenantDetail;
  onOpenChange: (open: boolean) => void;
  onSaved: (message: string) => void;
}) {
  const router = useRouter();
  const form = useForm<UpdateTenantFormValues>({
    resolver: zodResolver(updateTenantSchema),
    defaultValues: {
      tenantId: tenant.id,
      fullName: tenant.fullName,
      monthlyRent: tenant.monthlyRent,
      mobile: tenant.mobile ?? "",
      email: tenant.email ?? "",
      notes: tenant.notes ?? "",
      active: tenant.active,
      startDate: tenant.startDate,
      endDate: tenant.endDate ?? "",
    },
  });
  const watched = useWatch({ control: form.control });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    form.reset({
      tenantId: tenant.id,
      fullName: tenant.fullName,
      monthlyRent: tenant.monthlyRent,
      mobile: tenant.mobile ?? "",
      email: tenant.email ?? "",
      notes: tenant.notes ?? "",
      active: tenant.active,
      startDate: tenant.startDate,
      endDate: tenant.endDate ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  async function onSubmit(values: UpdateTenantFormValues) {
    setError(null);
    const result = await updateTenantAction(values);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    onOpenChange(false);
    onSaved("Tenant updated.");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 px-4 pb-4">
      <SheetHeader>
        <SheetTitle>Edit Tenant</SheetTitle>
        <SheetDescription>{tenant.unitName}</SheetDescription>
      </SheetHeader>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <input type="hidden" {...form.register("tenantId")} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-fullName">Full Name</Label>
        <Input
          id="edit-fullName"
          aria-invalid={!!form.formState.errors.fullName}
          {...form.register("fullName")}
        />
        {form.formState.errors.fullName && (
          <p className="text-caption text-destructive">{form.formState.errors.fullName.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-monthlyRent">Monthly Rent</Label>
        <Input
          id="edit-monthlyRent"
          type="number"
          step="0.01"
          aria-invalid={!!form.formState.errors.monthlyRent}
          {...form.register("monthlyRent", { valueAsNumber: true })}
        />
        {form.formState.errors.monthlyRent && (
          <p className="text-caption text-destructive">
            {form.formState.errors.monthlyRent.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-startDate">Tenant Start Date</Label>
          <Input
            id="edit-startDate"
            type="date"
            aria-invalid={!!form.formState.errors.startDate}
            {...form.register("startDate")}
          />
          {form.formState.errors.startDate && (
            <p className="text-caption text-destructive">
              {form.formState.errors.startDate.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-endDate">Tenant End Date</Label>
          <Input
            id="edit-endDate"
            type="date"
            aria-invalid={!!form.formState.errors.endDate}
            {...form.register("endDate")}
          />
          {form.formState.errors.endDate && (
            <p className="text-caption text-destructive">{form.formState.errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-mobile">Contact Number</Label>
        <Input id="edit-mobile" {...form.register("mobile")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-email">Email</Label>
        <Input
          id="edit-email"
          type="email"
          aria-invalid={!!form.formState.errors.email}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-caption text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="edit-notes">Notes</Label>
        <Input id="edit-notes" {...form.register("notes")} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Status</Label>
        <Select
          value={watched.active ? "active" : "archived"}
          onValueChange={(v) => v && form.setValue("active", v === "active")}
        >
          <SelectTrigger>
            <SelectValue>
              {(value: string) => (value === "active" ? "Active" : "Archived")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <SheetFooter>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </SheetFooter>
    </form>
  );
}
