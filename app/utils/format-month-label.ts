export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}
