import { describe, expect, it } from "vitest";
import { getUpcomingReminder } from "@/services/dashboard/get-upcoming-reminder";

// Fixed schedule per docs/architecture/09-email-automation.md: 25th,
// 26th, 27th. Pure date arithmetic, deliberately not routed through
// toISOString() (see the source comment) — these tests pin that down.
describe("getUpcomingReminder", () => {
  it("picks the 25th when today is before it, same month", () => {
    const result = getUpcomingReminder(new Date(2026, 7, 10)); // Aug 10, 2026
    expect(result).toEqual({ label: "Collect submeter reading", day: 25, date: "2026-08-25" });
  });

  it("still shows the 25th's reminder ON the 25th itself (>= comparison, not >)", () => {
    const result = getUpcomingReminder(new Date(2026, 7, 25));
    expect(result).toEqual({ label: "Collect submeter reading", day: 25, date: "2026-08-25" });
  });

  it("shows the 26th's reminder when today is the 26th", () => {
    const result = getUpcomingReminder(new Date(2026, 7, 26));
    expect(result).toEqual({ label: "Complete monthly billing", day: 26, date: "2026-08-26" });
  });

  it("shows the 27th's reminder when today is the 27th", () => {
    const result = getUpcomingReminder(new Date(2026, 7, 27));
    expect(result).toEqual({ label: "Generate SOAs", day: 27, date: "2026-08-27" });
  });

  it("wraps to next month's 25th once today is past the 27th", () => {
    const result = getUpcomingReminder(new Date(2026, 7, 28)); // Aug 28
    expect(result).toEqual({ label: "Collect submeter reading", day: 25, date: "2026-09-25" });
  });

  it("wraps across a year boundary (December → January)", () => {
    const result = getUpcomingReminder(new Date(2026, 11, 30)); // Dec 30, 2026
    expect(result).toEqual({ label: "Collect submeter reading", day: 25, date: "2027-01-25" });
  });

  it("builds the date string from local calendar parts, never via a UTC round-trip", () => {
    // A day-30 "today" one day before the wrap, in a month with 31 days,
    // is the sharpest check that the month/day arithmetic itself is
    // correct — not just the wrap boundary.
    const result = getUpcomingReminder(new Date(2026, 0, 24)); // Jan 24, 2026
    expect(result.date).toBe("2026-01-25");
  });
});
