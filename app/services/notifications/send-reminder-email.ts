import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getResendClient } from "@/lib/resend";
import { renderReminderEmail, REMINDER_SUBJECTS, type ReminderKind } from "@/emails/render";

export type SendReminderResult =
  | { success: true; emailId: string }
  | { success: false; error: string };

// Sends one reminder email to the landlord only
// (docs/architecture/09-email-automation.md — the application never
// emails tenants automatically). Failures are logged, not retried
// (Version 1 does not retry automatically per the same doc). Gated by
// Settings > Notification Preferences > Email Notifications (Phase 11).
export async function sendReminderEmail(
  supabase: SupabaseClient<Database>,
  kind: ReminderKind,
): Promise<SendReminderResult> {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("id")
    .eq("active", true)
    .limit(1)
    .single();
  if (propertyError) throw propertyError;

  const { data: settings, error: settingsError } = await supabase
    .from("settings")
    .select("email_notifications_enabled")
    .eq("property_id", property.id)
    .maybeSingle();
  if (settingsError) throw settingsError;

  if (settings && !settings.email_notifications_enabled) {
    const message = "Email notifications are disabled in Settings.";
    console.log(`[reminder-email:${kind}] skipped — ${message}`);
    return { success: false, error: message };
  }

  const fromEmail = process.env.FROM_EMAIL;
  const ownerEmail = process.env.OWNER_EMAIL;
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (!fromEmail || !ownerEmail) {
    const message = "FROM_EMAIL or OWNER_EMAIL is not configured.";
    console.error(`[reminder-email:${kind}] ${message}`);
    return { success: false, error: message };
  }

  // getResendClient() throws synchronously if RESEND_API_KEY is unset —
  // checked explicitly here so a missing key degrades the same way as a
  // missing FROM_EMAIL/OWNER_EMAIL, instead of an uncaught exception
  // surfacing as a bare 500 from the cron route handlers.
  if (!process.env.RESEND_API_KEY) {
    const message = "RESEND_API_KEY is not configured.";
    console.error(`[reminder-email:${kind}] ${message}`);
    return { success: false, error: message };
  }

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: ownerEmail,
    subject: REMINDER_SUBJECTS[kind],
    html: renderReminderEmail(kind, appUrl),
  });

  if (error) {
    console.error(`[reminder-email:${kind}] Resend error:`, error.message);
    return { success: false, error: error.message };
  }

  console.log(`[reminder-email:${kind}] sent, id=${data.id}`);
  return { success: true, emailId: data.id };
}
