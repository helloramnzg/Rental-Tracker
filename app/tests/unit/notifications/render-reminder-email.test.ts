import { describe, expect, it } from "vitest";
import { renderReminderEmail, REMINDER_SUBJECTS, type ReminderKind } from "@/emails/render";

// docs/architecture/09-email-automation.md Reminder 1/2/3 — subject
// lines and purpose. Landlord-only per the same doc: templates must
// never address or reference a tenant.
describe("renderReminderEmail", () => {
  const kinds: ReminderKind[] = ["submeter", "billing", "soa-ready"];

  it("has an exact subject line per kind matching the documented copy", () => {
    expect(REMINDER_SUBJECTS.submeter).toBe(
      "Rental Billing Reminder — Collect Submeter Reading",
    );
    expect(REMINDER_SUBJECTS.billing).toBe(
      "Rental Billing Reminder — Complete Monthly Billing",
    );
    expect(REMINDER_SUBJECTS["soa-ready"]).toBe("Your Monthly SOAs Are Ready");
  });

  it("produces distinct HTML for each of the three kinds", () => {
    const rendered = kinds.map((kind) => renderReminderEmail(kind, "https://app.example.com"));
    expect(new Set(rendered).size).toBe(kinds.length);
  });

  for (const kind of kinds) {
    it(`embeds the appUrl as a link in the ${kind} email`, () => {
      const html = renderReminderEmail(kind, "https://app.example.com");
      expect(html).toContain('href="https://app.example.com"');
    });

    it(`includes the subject as the document title in the ${kind} email`, () => {
      const html = renderReminderEmail(kind, "https://app.example.com");
      expect(html).toContain(`<title>${REMINDER_SUBJECTS[kind]}</title>`);
    });

    it(`is well-formed HTML with a single doctype for the ${kind} email`, () => {
      const html = renderReminderEmail(kind, "https://app.example.com");
      expect(html.trim().startsWith("<!doctype html>")).toBe(true);
      expect(html).toContain("<html>");
      expect(html).toContain("</html>");
    });
  }
});
