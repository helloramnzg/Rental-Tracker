import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { signInAsLandlord } from "../../support/clients";
import {
  snapshotSettings,
  restoreSettings,
  type SettingsSnapshot,
} from "../../support/factories/settings";

// Resend is always mocked — no real network call or email send may
// ever happen from a test run. See tests/support/README.md.
vi.mock("@/lib/resend", () => ({
  getResendClient: vi.fn(),
}));

import { getResendClient } from "@/lib/resend";
import { sendReminderEmail } from "@/services/notifications/send-reminder-email";

function mockResendSend(result: { id: string } | null, error: { message: string } | null) {
  const send = vi.fn().mockResolvedValue({ data: result, error });
  vi.mocked(getResendClient).mockReturnValue({ emails: { send } } as unknown as ReturnType<
    typeof getResendClient
  >);
  return send;
}

describe("sendReminderEmail (integration)", () => {
  let supabase: SupabaseClient<Database>;
  let snapshot: SettingsSnapshot;

  beforeAll(async () => {
    supabase = await signInAsLandlord();
  });

  beforeEach(async () => {
    snapshot = await snapshotSettings(supabase);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await restoreSettings(supabase, snapshot);
  });

  it("sends with the correct subject/recipient for each reminder kind and returns the Resend id", async () => {
    const send = mockResendSend({ id: "resend-test-id" }, null);

    const result = await sendReminderEmail(supabase, "submeter");

    expect(result).toEqual({ success: true, emailId: "resend-test-id" });
    expect(send).toHaveBeenCalledTimes(1);
    const call = send.mock.calls[0][0];
    expect(call.from).toBe(process.env.FROM_EMAIL);
    expect(call.to).toBe(process.env.OWNER_EMAIL);
    expect(call.subject).toBe("Rental Billing Reminder — Collect Submeter Reading");
    expect(call.html).toContain("Rental Billing Reminder — Collect Submeter Reading");
  });

  it("skips sending and returns a clear error when email notifications are disabled in Settings", async () => {
    await supabase
      .from("settings")
      .update({ email_notifications_enabled: false })
      .eq("property_id", snapshot.propertyId);
    const send = mockResendSend({ id: "should-not-be-used" }, null);

    const result = await sendReminderEmail(supabase, "billing");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/disabled/i);
    }
    expect(send).not.toHaveBeenCalled();
  });

  it("sends when email notifications are re-enabled after being disabled", async () => {
    await supabase
      .from("settings")
      .update({ email_notifications_enabled: false })
      .eq("property_id", snapshot.propertyId);
    await supabase
      .from("settings")
      .update({ email_notifications_enabled: true })
      .eq("property_id", snapshot.propertyId);
    const send = mockResendSend({ id: "resend-test-id-2" }, null);

    const result = await sendReminderEmail(supabase, "soa-ready");

    expect(result).toEqual({ success: true, emailId: "resend-test-id-2" });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("surfaces a Resend error rather than throwing", async () => {
    mockResendSend(null, { message: "Resend rejected the request" });

    const result = await sendReminderEmail(supabase, "submeter");

    expect(result).toEqual({ success: false, error: "Resend rejected the request" });
  });

  it("returns a config error and never calls Resend when FROM_EMAIL/OWNER_EMAIL are unset", async () => {
    const originalFrom = process.env.FROM_EMAIL;
    const originalOwner = process.env.OWNER_EMAIL;
    delete process.env.FROM_EMAIL;
    delete process.env.OWNER_EMAIL;
    const send = mockResendSend({ id: "should-not-be-used" }, null);

    try {
      const result = await sendReminderEmail(supabase, "billing");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/not configured/i);
      }
      expect(send).not.toHaveBeenCalled();
    } finally {
      process.env.FROM_EMAIL = originalFrom;
      process.env.OWNER_EMAIL = originalOwner;
    }
  });

  it("returns a config error rather than throwing when RESEND_API_KEY is unset", async () => {
    const originalKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
    const send = mockResendSend({ id: "should-not-be-used" }, null);

    try {
      const result = await sendReminderEmail(supabase, "billing");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toMatch(/RESEND_API_KEY/);
      }
      expect(send).not.toHaveBeenCalled();
    } finally {
      process.env.RESEND_API_KEY = originalKey;
    }
  });
});
