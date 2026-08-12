export type UpcomingReminder = {
  label: string;
  day: number;
};

// Fixed schedule per docs/architecture/09-email-automation.md — not
// configurable, so this is pure date arithmetic, no DB read.
const SCHEDULE: UpcomingReminder[] = [
  { label: "Collect submeter reading", day: 25 },
  { label: "Complete monthly billing", day: 26 },
  { label: "Generate SOAs", day: 27 },
];

export function getUpcomingReminder(today: Date): UpcomingReminder & { date: string } {
  const day = today.getDate();
  const next = SCHEDULE.find((item) => item.day >= day) ?? SCHEDULE[0];
  const isNextMonth = next.day < day;

  // Build the "YYYY-MM-DD" string from local date parts directly —
  // never round-trip through toISOString() here, which converts to
  // UTC first and silently shifts the calendar day backward whenever
  // the server's local timezone is ahead of UTC (e.g. PHT, UTC+8).
  const targetDate = new Date(today.getFullYear(), today.getMonth() + (isNextMonth ? 1 : 0), next.day);
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(targetDate.getDate()).padStart(2, "0");

  return { ...next, date: `${year}-${month}-${dayOfMonth}` };
}
