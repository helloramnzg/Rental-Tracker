import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

describe("isAuthorizedCronRequest", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalSecret;
  });

  it("authorizes a request with the correct Bearer token", () => {
    const request = new Request("https://example.com/api/cron/reminder-submeter", {
      headers: { authorization: "Bearer test-secret" },
    });
    expect(isAuthorizedCronRequest(request)).toBe(true);
  });

  it("rejects a request with the wrong token", () => {
    const request = new Request("https://example.com/api/cron/reminder-submeter", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });

  it("rejects a request with no authorization header", () => {
    const request = new Request("https://example.com/api/cron/reminder-submeter");
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });

  it("rejects a non-Bearer authorization scheme", () => {
    const request = new Request("https://example.com/api/cron/reminder-submeter", {
      headers: { authorization: "Basic test-secret" },
    });
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });

  it("fails closed when CRON_SECRET is not configured, even with a matching header", () => {
    delete process.env.CRON_SECRET;
    const request = new Request("https://example.com/api/cron/reminder-submeter", {
      headers: { authorization: "Bearer undefined" },
    });
    expect(isAuthorizedCronRequest(request)).toBe(false);
  });
});
