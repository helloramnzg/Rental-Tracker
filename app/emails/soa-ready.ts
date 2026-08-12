import { heading, bodyText, list, button } from "./email-layout";

// docs/architecture/09-email-automation.md Reminder 3 (27th). Worded as
// a same-day action prompt rather than a status report — a calendar
// trigger can't confirm SOAs have actually been generated yet, only
// that today is the day to do it (see docs/product/16-notification-system.md
// and docs/business/10-business-rules.md, which frame all three
// reminders the same way).
export function soaReadyBody(appUrl: string): string {
  return [
    heading("It&rsquo;s SOA day"),
    bodyText("It&rsquo;s the 27th &mdash; generate and review this month&rsquo;s Statements of Account:"),
    list([
      "Generate both Statements of Account",
      "Review the PDFs",
      "They&rsquo;ll be ready to send to tenants manually tomorrow",
    ]),
    button(`${appUrl}/soa`, "Go to Statements of Account"),
  ].join("");
}
