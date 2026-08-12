import { heading, bodyText, list, button } from "./email-layout";

// docs/architecture/09-email-automation.md Reminder 1 (25th).
export function reminderSubmeterBody(appUrl: string): string {
  return [
    heading("Time to collect this month&rsquo;s submeter reading"),
    bodyText("It&rsquo;s the 25th &mdash; here&rsquo;s what to do before tomorrow&rsquo;s billing:"),
    list([
      "Record the current submeter reading",
      "Obtain the mother meter bill",
      "Confirm water charges",
    ]),
    button(`${appUrl}/billing`, "Go to Monthly Billing"),
  ].join("");
}
