"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Archive as ArchiveIcon, ArchiveRestore } from "lucide-react";
import type { TenantDetail } from "@/services/tenants/get-tenant-detail";
import { archiveTenantAction } from "@/features/tenants/actions/archive-tenant";
import { restoreTenantAction } from "@/features/tenants/actions/restore-tenant";
import { formatCurrency } from "@/utils/format-currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TenantFormSheet, type TenantFormMode } from "./tenant-form-sheet";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
    new Date(`${dateStr}T00:00:00`),
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-small text-muted-foreground">{label}</p>
      <p className="text-body text-foreground">{value}</p>
    </div>
  );
}

export function TenantDetailView({ tenant }: { tenant: TenantDetail }) {
  const router = useRouter();
  const [formMode, setFormMode] = useState<TenantFormMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleArchive() {
    setError(null);
    setPending(true);
    const result = await archiveTenantAction({ tenantId: tenant.id });
    setPending(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setMessage("Tenant archived.");
    router.refresh();
  }

  async function handleRestore() {
    setError(null);
    setPending(true);
    const result = await restoreTenantAction({ tenantId: tenant.id });
    setPending(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setMessage("Tenant restored.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/tenants" />}
        className="w-fit"
      >
        <ArrowLeft size={14} className="mr-1.5" />
        Back to Tenants
      </Button>

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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle>{tenant.fullName}</CardTitle>
            <Badge variant={tenant.active ? "default" : "neutral"}>
              {tenant.active ? "Active" : "Archived"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFormMode({ type: "edit", tenant })}
            >
              <Pencil size={14} className="mr-1.5" />
              Edit
            </Button>
            {tenant.active ? (
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleArchive}>
                <ArchiveIcon size={14} className="mr-1.5" />
                Archive
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleRestore}>
                <ArchiveRestore size={14} className="mr-1.5" />
                Restore
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Unit" value={tenant.unitName} />
          <Field label="Monthly Rent" value={formatCurrency(tenant.monthlyRent)} />
          <Field label="Contact Number" value={tenant.mobile || "—"} />
          <Field label="Email" value={tenant.email || "—"} />
          <Field label="Tenant Start Date" value={formatDate(tenant.startDate)} />
          <Field label="Tenant End Date" value={tenant.endDate ? formatDate(tenant.endDate) : "—"} />
          <Field label="Created" value={formatDateTime(tenant.createdAt)} />
          <Field label="Last Updated" value={formatDateTime(tenant.updatedAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body text-foreground">{tenant.notes || "No notes."}</p>
        </CardContent>
      </Card>

      <TenantFormSheet
        mode={formMode}
        units={[]}
        onOpenChange={(open) => !open && setFormMode(null)}
        onSaved={(msg) => {
          setMessage(msg);
          setError(null);
        }}
      />
    </div>
  );
}
