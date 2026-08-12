"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, ArchiveRestore, Archive as ArchiveIcon, Users } from "lucide-react";
import type { TenantListItem } from "@/services/tenants/get-tenants-list";
import type { UnitOption } from "@/services/tenants/get-units-for-tenant-form";
import type { TenantDetail } from "@/services/tenants/get-tenant-detail";
import { archiveTenantAction } from "@/features/tenants/actions/archive-tenant";
import { restoreTenantAction } from "@/features/tenants/actions/restore-tenant";
import { formatCurrency } from "@/utils/format-currency";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TenantFormSheet, type TenantFormMode } from "./tenant-form-sheet";

type StatusFilter = "active" | "archived" | "all";

const STATUS_LABELS: Record<StatusFilter, string> = {
  active: "Active",
  archived: "Archived",
  all: "All",
};

function toTenantDetail(t: TenantListItem): TenantDetail {
  // Enough of TenantDetail for the Edit form, which only reads these
  // fields — createdAt/updatedAt aren't shown in the list (and the
  // Edit form doesn't display them), so those two are left blank
  // rather than re-fetched. notes/startDate/endDate ARE editable here,
  // so they must carry real values — previously notes was hardcoded to
  // null, which silently wiped any existing notes on every list-based edit.
  return {
    id: t.id,
    fullName: t.fullName,
    unitId: t.unitId,
    unitName: t.unitName,
    monthlyRent: t.monthlyRent,
    active: t.active,
    mobile: t.mobile,
    email: t.email,
    notes: t.notes,
    startDate: t.startDate,
    endDate: t.endDate,
    createdAt: "",
    updatedAt: "",
  };
}

export function TenantListView({
  tenants,
  units,
}: {
  tenants: TenantListItem[];
  units: UnitOption[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [sortByUnit, setSortByUnit] = useState(false);
  const [formMode, setFormMode] = useState<TenantFormMode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let rows = tenants;

    if (statusFilter !== "all") {
      rows = rows.filter((t) => (statusFilter === "active" ? t.active : !t.active));
    }

    const query = search.trim().toLowerCase();
    if (query) {
      rows = rows.filter(
        (t) =>
          t.fullName.toLowerCase().includes(query) ||
          t.unitName.toLowerCase().includes(query) ||
          (t.email ?? "").toLowerCase().includes(query) ||
          (t.mobile ?? "").toLowerCase().includes(query),
      );
    }

    if (sortByUnit) {
      rows = [...rows].sort((a, b) => a.unitName.localeCompare(b.unitName));
    }

    return rows;
  }, [tenants, statusFilter, search, sortByUnit]);

  async function handleArchive(tenantId: string) {
    setError(null);
    setPendingId(tenantId);
    const result = await archiveTenantAction({ tenantId });
    setPendingId(null);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setMessage("Tenant archived.");
    router.refresh();
  }

  async function handleRestore(tenantId: string) {
    setError(null);
    setPendingId(tenantId);
    const result = await restoreTenantAction({ tenantId });
    setPendingId(null);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    setMessage("Tenant restored.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
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
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search tenants…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => v && setStatusFilter(v as StatusFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue>{(v: string) => STATUS_LABELS[v as StatusFilter]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant={sortByUnit ? "default" : "outline"}
              size="sm"
              onClick={() => setSortByUnit((v) => !v)}
            >
              Sort by Unit
            </Button>
          </div>
          <Button onClick={() => setFormMode({ type: "create" })}>
            <UserPlus className="mr-1.5" size={16} />
            Add Tenant
          </Button>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            tenants.length === 0
              ? "No tenants yet."
              : "No tenants match your search or filter."
          }
          description={tenants.length === 0 ? "Add your first tenant to get started." : undefined}
          action={
            tenants.length === 0 ? (
              <Button onClick={() => setFormMode({ type: "create" })}>Add Tenant</Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Monthly Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell
                      className="cursor-pointer font-medium hover:underline"
                      onClick={() => router.push(`/tenants/${tenant.id}`)}
                    >
                      {tenant.fullName}
                    </TableCell>
                    <TableCell>{tenant.unitName}</TableCell>
                    <TableCell>{formatCurrency(tenant.monthlyRent)}</TableCell>
                    <TableCell>
                      <Badge variant={tenant.active ? "default" : "neutral"}>
                        {tenant.active ? "Active" : "Archived"}
                      </Badge>
                    </TableCell>
                    <TableCell>{tenant.mobile || "—"}</TableCell>
                    <TableCell>{tenant.email || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormMode({ type: "edit", tenant: toTenantDetail(tenant) })}
                      >
                        Edit
                      </Button>
                      {tenant.active ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Archive tenant"
                          disabled={pendingId === tenant.id}
                          onClick={() => handleArchive(tenant.id)}
                        >
                          <ArchiveIcon size={14} />
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Restore tenant"
                          disabled={pendingId === tenant.id}
                          onClick={() => handleRestore(tenant.id)}
                        >
                          <ArchiveRestore size={14} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <TenantFormSheet
        mode={formMode}
        units={units}
        onOpenChange={(open) => !open && setFormMode(null)}
        onSaved={(msg) => {
          setMessage(msg);
          setError(null);
        }}
      />
    </div>
  );
}
