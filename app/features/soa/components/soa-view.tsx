"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, RefreshCw } from "lucide-react";
import type { SoaScreenContext } from "@/services/soa/get-soa-screen-context";
import { generateSoaAction } from "@/features/soa/actions/generate-soa";
import { getSoaDownloadUrlAction } from "@/features/soa/actions/download-soa";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function SoaView({
  year,
  month,
  monthLabel,
  context,
}: {
  year: number;
  month: number;
  monthLabel: string;
  context: SoaScreenContext;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  function handleMonthChange(nextMonth: string | null) {
    if (!nextMonth) return;
    router.push(`/soa?year=${year}&month=${nextMonth}`);
  }

  function handleYearChange(nextYear: string | null) {
    if (!nextYear) return;
    router.push(`/soa?year=${nextYear}&month=${month}`);
  }

  async function handleGenerate() {
    if (!context.billingCycle) return;
    setError(null);
    setGenerating(true);
    const result = await generateSoaAction({
      billingCycleId: context.billingCycle.id,
    });
    setGenerating(false);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    router.refresh();
  }

  async function handleDownload(
    generatedSoaId: string,
    mode: "preview" | "download",
  ) {
    setError(null);
    setDownloadingId(generatedSoaId);
    const result = await getSoaDownloadUrlAction({ generatedSoaId, mode });
    setDownloadingId(null);
    if (!result.success) {
      setError(result.error.message);
      return;
    }
    window.open(result.data.url, "_blank", "noopener,noreferrer");
  }

  async function handleDownloadAll() {
    setError(null);
    setDownloadingAll(true);
    const generated = context.cards.filter((c) => c.generatedSoaId);
    for (const card of generated) {
      const result = await getSoaDownloadUrlAction({
        generatedSoaId: card.generatedSoaId!,
        mode: "download",
      });
      if (!result.success) {
        setError(result.error.message);
        continue;
      }
      // Anchor-click downloads rather than window.open — opening N
      // new tabs gets popup-blocked after the first; triggering N
      // file downloads this way does not.
      const link = document.createElement("a");
      link.href = result.data.url;
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setDownloadingAll(false);
  }

  const yearOptions = Array.from(
    { length: 2035 - (year - 1) + 1 },
    (_, i) => year - 1 + i,
  );
  const hasAnySoa = context.cards.some((c) => c.generatedSoaId);

  return (
    <>
      <PageHeader
        eyebrow={monthLabel}
        title="Statements of Account"
        description="Generate from saved billing snapshots, then preview or download each statement."
        action={
          context.billingCycle && hasAnySoa ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadAll} disabled={downloadingAll}>
                <Download className="mr-1.5" size={16} />
                {downloadingAll ? "Downloading…" : "Download All"}
              </Button>
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                <RefreshCw className="mr-1.5" size={16} />
                {generating ? "Regenerating…" : "Regenerate All"}
              </Button>
            </div>
          ) : undefined
        }
      />
      <div className="flex flex-col gap-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Billing Month</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Select value={String(month)} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-48">
                <SelectValue>
                  {(value: string) => MONTH_NAMES[Number(value) - 1]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTH_NAMES.map((name, i) => (
                  <SelectItem key={name} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={handleYearChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {!context.billingCycle && (
          <EmptyState
            icon={FileText}
            title="No billing cycle exists for this month yet."
            description="Complete Monthly Billing for this month before generating Statements of Account."
          />
        )}

        {context.billingCycle && !hasAnySoa && (
          <EmptyState
            icon={FileText}
            title="No Statements of Account have been generated."
            action={
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate SOAs"}
              </Button>
            }
          />
        )}

        {context.billingCycle && hasAnySoa && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {context.cards.map((card) => (
              <Card key={card.tenantId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{card.tenantName}</CardTitle>
                    <Badge variant={card.generatedSoaId ? "default" : "neutral"}>
                      {card.generatedSoaId ? "Generated" : "Pending"}
                    </Badge>
                  </div>
                  <CardDescription>{card.unitName}</CardDescription>
                </CardHeader>
                <CardContent>
                  {card.generatedAt && (
                    <p className="text-small text-muted-foreground">
                      Generated {formatDateTime(card.generatedAt)}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!card.generatedSoaId}
                    onClick={() =>
                      card.generatedSoaId &&
                      handleDownload(card.generatedSoaId, "preview")
                    }
                  >
                    <FileText className="mr-1.5" size={14} />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    disabled={!card.generatedSoaId || downloadingId === card.generatedSoaId}
                    onClick={() =>
                      card.generatedSoaId &&
                      handleDownload(card.generatedSoaId, "download")
                    }
                  >
                    <Download className="mr-1.5" size={14} />
                    {downloadingId === card.generatedSoaId ? "Preparing…" : "Download"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
