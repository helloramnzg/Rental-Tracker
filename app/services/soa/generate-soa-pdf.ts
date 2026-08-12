import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { SoaData } from "./get-soa-data";

// Page spec per docs/architecture/10-pdf-generation.md: A4 portrait,
// 20mm margins, Inter typeface. Inter is embedded from a bundled TTF
// (services/soa/fonts/) rather than pdf-lib's built-in standard fonts,
// which use WinAnsi encoding and cannot render the Philippine Peso
// sign (₱, U+20B1) required by the documented currency format.
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56.69; // 20mm

const COLOR_TEXT = rgb(0.12, 0.16, 0.22); // matches --text-primary
const COLOR_MUTED = rgb(0.42, 0.45, 0.5); // matches --text-secondary
const COLOR_BORDER = rgb(0.9, 0.91, 0.92);
const COLOR_PRIMARY_DARK = rgb(0.118, 0.239, 0.204); // #1E3D34

const STATUS_COLOR: Record<SoaData["paymentStatus"], ReturnType<typeof rgb>> = {
  paid: rgb(0.05, 0.45, 0.2),
  partial: rgb(0.62, 0.48, 0.05),
  outstanding: rgb(0.76, 0.15, 0.15),
};

const STATUS_LABEL: Record<SoaData["paymentStatus"], string> = {
  paid: "PAID",
  partial: "PARTIALLY PAID",
  outstanding: "OUTSTANDING",
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatCurrency(value: number): string {
  const formatted = new Intl.NumberFormat("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${value < 0 ? "-" : ""}₱${formatted}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

// Charge line items for the SOA table. Electricity intentionally has
// no `detail` — the SOA displays the resulting charge only, not the
// kWh usage quantity (docs/product/17-soa-specification.md). The
// usage/rate breakdown remains available in data.meterReading for
// callers that need it (e.g. the Billing screen), just not printed
// here. Exported as a pure function so this stays testable without
// parsing rendered PDF bytes.
export function buildSoaChargeRows(
  data: SoaData,
): { label: string; amount: number; detail?: string }[] {
  return [
    { label: "Rent", amount: data.charges.rent },
    { label: "Electricity", amount: data.charges.electricity },
    { label: "Water", amount: data.charges.water },
    { label: "Other Charges", amount: data.charges.otherCharges },
    { label: "Previous Balance", amount: data.charges.previousBalance },
  ];
}

export async function generateSoaPdf(data: SoaData): Promise<Uint8Array> {
  const fontsDir = path.join(process.cwd(), "services/soa/fonts");
  const [regularBytes, boldBytes] = await Promise.all([
    readFile(path.join(fontsDir, "Inter-Regular.ttf")),
    readFile(path.join(fontsDir, "Inter-Bold.ttf")),
  ]);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await pdfDoc.embedFont(regularBytes, { subset: true });
  const fontBold = await pdfDoc.embedFont(boldBytes, { subset: true });

  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  let y = PAGE_HEIGHT - MARGIN;

  // Header ------------------------------------------------------------
  page.drawText(data.property.name || "Rental Property", {
    x: MARGIN,
    y: y - 16,
    size: 18,
    font: fontBold,
    color: COLOR_PRIMARY_DARK,
  });
  y -= 34;

  if (data.property.address) {
    page.drawText(data.property.address, {
      x: MARGIN,
      y,
      size: 10,
      font,
      color: COLOR_MUTED,
    });
    y -= 18;
  }

  page.drawText("STATEMENT OF ACCOUNT", {
    x: MARGIN,
    y,
    size: 13,
    font: fontBold,
    color: COLOR_TEXT,
  });
  y -= 12;

  y = drawDivider(page, y, MARGIN, contentWidth);
  y -= 20;

  // Tenant / billing info ----------------------------------------------
  const billingMonthLabel = `${MONTH_NAMES[data.billingCycle.month - 1]} ${data.billingCycle.year}`;
  const now = new Date();
  const dueDate = data.tenant.dueDay
    ? new Date(data.billingCycle.year, data.billingCycle.month - 1, data.tenant.dueDay)
    : null;

  const infoLeft: [string, string][] = [
    ["Tenant", data.tenant.fullName],
    ["Unit", data.unit.name],
  ];
  const infoRight: [string, string][] = [
    ["Billing Month", billingMonthLabel],
    ["Issue Date", formatDate(now)],
    ...(dueDate ? ([["Due Date", formatDate(dueDate)]] as [string, string][]) : []),
  ];

  const infoStartY = y;
  y = drawLabelValueColumn(page, infoLeft, MARGIN, y, font, fontBold);
  drawLabelValueColumn(
    page,
    infoRight,
    MARGIN + contentWidth / 2,
    infoStartY,
    font,
    fontBold,
  );
  y -= 12;
  y = drawDivider(page, y, MARGIN, contentWidth);
  y -= 24;

  // Charges table -------------------------------------------------------
  const col2X = MARGIN + contentWidth - 100;

  page.drawText("Description", { x: MARGIN, y, size: 10, font: fontBold, color: COLOR_TEXT });
  page.drawText("Amount", { x: col2X, y, size: 10, font: fontBold, color: COLOR_TEXT });
  y -= 8;
  y = drawDivider(page, y, MARGIN, contentWidth);
  y -= 20;

  const rows = buildSoaChargeRows(data);

  for (const row of rows) {
    page.drawText(row.label, { x: MARGIN, y, size: 10.5, font, color: COLOR_TEXT });
    drawRightAligned(page, formatCurrency(row.amount), col2X + 100, y, font, 10.5, COLOR_TEXT);
    y -= 15;
    if (row.detail) {
      page.drawText(row.detail, { x: MARGIN, y, size: 8.5, font, color: COLOR_MUTED });
      y -= 15;
    } else {
      y -= 3;
    }
  }

  y -= 6;
  y = drawDivider(page, y, MARGIN, contentWidth);
  y -= 22;

  // Summary --------------------------------------------------------------
  page.drawText("Total Amount Due", {
    x: MARGIN,
    y,
    size: 12,
    font: fontBold,
    color: COLOR_TEXT,
  });
  drawRightAligned(
    page,
    formatCurrency(data.balanceDue),
    MARGIN + contentWidth,
    y,
    fontBold,
    13,
    COLOR_PRIMARY_DARK,
  );
  y -= 26;

  // Payment status --------------------------------------------------------
  const statusLabel = `Payment Status: ${STATUS_LABEL[data.paymentStatus]}`;
  page.drawText(statusLabel, {
    x: MARGIN,
    y,
    size: 10.5,
    font: fontBold,
    color: STATUS_COLOR[data.paymentStatus],
  });
  if (data.amountPaid > 0) {
    y -= 15;
    page.drawText(`Amount Paid: ${formatCurrency(data.amountPaid)}`, {
      x: MARGIN,
      y,
      size: 9.5,
      font,
      color: COLOR_MUTED,
    });
  }

  // Footer -----------------------------------------------------------------
  const footerY = MARGIN;
  drawDivider(page, footerY + 24, MARGIN, contentWidth);
  page.drawText(`Generated on ${formatDate(now)}`, {
    x: MARGIN,
    y: footerY + 8,
    size: 9,
    font,
    color: COLOR_MUTED,
  });
  drawRightAligned(
    page,
    "This is a system-generated document.",
    MARGIN + contentWidth,
    footerY + 8,
    font,
    9,
    COLOR_MUTED,
  );

  return pdfDoc.save();
}

function drawDivider(page: PDFPage, y: number, x: number, width: number): number {
  page.drawLine({
    start: { x, y },
    end: { x: x + width, y },
    thickness: 0.75,
    color: COLOR_BORDER,
  });
  return y;
}

function drawLabelValueColumn(
  page: PDFPage,
  rows: [string, string][],
  x: number,
  startY: number,
  font: PDFFont,
  fontBold: PDFFont,
): number {
  let y = startY;
  for (const [label, value] of rows) {
    page.drawText(label.toUpperCase(), { x, y, size: 8, font, color: COLOR_MUTED });
    y -= 13;
    page.drawText(value, { x, y, size: 10.5, font: fontBold, color: COLOR_TEXT });
    y -= 18;
  }
  return y;
}

function drawRightAligned(
  page: PDFPage,
  text: string,
  rightEdgeX: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: rightEdgeX - width, y, size, font, color });
}
