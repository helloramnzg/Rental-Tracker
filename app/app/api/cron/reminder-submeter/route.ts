import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { createServiceRoleClient } from "@/lib/supabase/service-role-client";
import { sendReminderEmail } from "@/services/notifications/send-reminder-email";

// docs/architecture/09-email-automation.md Reminder 1: 25th, 09:00 PHT.
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const result = await sendReminderEmail(supabase, "submeter");
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
