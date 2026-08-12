import { heading, bodyText, list, button } from "./email-layout";

// docs/architecture/09-email-automation.md Reminder 2 (26th).
export function reminderBillingBody(appUrl: string): string {
  return [
    heading("Time to complete this month&rsquo;s billing"),
    bodyText("It&rsquo;s the 26th &mdash; here&rsquo;s what to do today:"),
    list(["Enter utility information", "Review electricity calculations", "Finalise billing"]),
    button(`${appUrl}/billing`, "Go to Monthly Billing"),
  ].join("");
}
