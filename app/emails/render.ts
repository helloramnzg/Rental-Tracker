import { emailLayout } from "./email-layout";
import { reminderSubmeterBody } from "./reminder-submeter";
import { reminderBillingBody } from "./reminder-billing";
import { soaReadyBody } from "./soa-ready";

export type ReminderKind = "submeter" | "billing" | "soa-ready";

// Subject lines per docs/architecture/09-email-automation.md Reminder 1/2/3.
export const REMINDER_SUBJECTS: Record<ReminderKind, string> = {
  submeter: "Rental Billing Reminder — Collect Submeter Reading",
  billing: "Rental Billing Reminder — Complete Monthly Billing",
  "soa-ready": "Your Monthly SOAs Are Ready",
};

const BODY_BUILDERS: Record<ReminderKind, (appUrl: string) => string> = {
  submeter: reminderSubmeterBody,
  billing: reminderBillingBody,
  "soa-ready": soaReadyBody,
};

export function renderReminderEmail(kind: ReminderKind, appUrl: string): string {
  return emailLayout({
    title: REMINDER_SUBJECTS[kind],
    appUrl,
    bodyHtml: BODY_BUILDERS[kind](appUrl),
  });
}
