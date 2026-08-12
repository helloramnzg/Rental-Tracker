import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Resend is always mocked — see tests/support/README.md.
vi.mock("@/lib/resend", () => ({
  getResendClient: vi.fn(),
}));

import { getResendClient } from "@/lib/resend";
import { GET as reminderSubmeterGet } from "@/app/api/cron/reminder-submeter/route";
import { GET as reminderBillingGet } from "@/app/api/cron/reminder-billing/route";
import { GET as soaReadyGet } from "@/app/api/cron/soa-ready/route";

function mockResendSend() {
  const send = vi.fn().mockResolvedValue({ data: { id: "cron-test-id" }, error: null });
  vi.mocked(getResendClient).mockReturnValue({ emails: { send } } as unknown as ReturnType<
    typeof getResendClient
  >);
  return send;
}

const ROUTES = [
  { name: "reminder-submeter", handler: reminderSubmeterGet, subject: "Collect Submeter Reading" },
  { name: "reminder-billing", handler: reminderBillingGet, subject: "Complete Monthly Billing" },
  { name: "soa-ready", handler: soaReadyGet, subject: "Your Monthly SOAs Are Ready" },
] as const;

describe("cron routes (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  for (const route of ROUTES) {
    it(`GET /api/cron/${route.name} returns 401 without a valid CRON_SECRET Bearer token`, async () => {
      const send = mockResendSend();
      const request = new Request(`https://example.com/api/cron/${route.name}`);
      const response = await route.handler(request);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.success).toBe(false);
      expect(send).not.toHaveBeenCalled();
    });

    it(`GET /api/cron/${route.name} sends the ${route.subject} reminder when authorized`, async () => {
      const send = mockResendSend();
      const request = new Request(`https://example.com/api/cron/${route.name}`, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
      });
      const response = await route.handler(request);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send.mock.calls[0][0].subject).toContain(route.subject);
    });

    it(`GET /api/cron/${route.name} rejects the wrong token`, async () => {
      const send = mockResendSend();
      const request = new Request(`https://example.com/api/cron/${route.name}`, {
        headers: { authorization: "Bearer wrong-token" },
      });
      const response = await route.handler(request);

      expect(response.status).toBe(401);
      expect(send).not.toHaveBeenCalled();
    });
  }
});
