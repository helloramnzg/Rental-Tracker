import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function TenantsLoading() {
  return (
    <>
      <PageHeader title="Tenants" />
      <Card>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-9 w-full max-w-xs" />
          <Skeleton className="h-9 w-40" />
        </CardContent>
      </Card>
      <div className="mt-6 flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </>
  );
}
