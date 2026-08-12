import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { signInAsLandlord } from "../../support/clients";
import {
  snapshotSettings,
  restoreSettings,
  type SettingsSnapshot,
} from "../../support/factories/settings";
import { getSettingsContext } from "@/services/settings/get-settings-context";
import { updateBillingSettings } from "@/services/settings/update-billing-settings";
import { updateProperty } from "@/services/settings/update-property";
import { updateNotificationPreferences } from "@/services/settings/update-notification-preferences";
import { getCurrentUserContext } from "@/services/settings/get-current-user-context";

// Settings is a real one-row-per-property singleton — every test
// snapshots it first and restores it in afterEach. See
// tests/support/README.md "isolated per test where practical".
describe("settings (integration)", () => {
  let supabase: SupabaseClient<Database>;
  let snapshot: SettingsSnapshot;

  beforeAll(async () => {
    supabase = await signInAsLandlord();
  });

  beforeEach(async () => {
    snapshot = await snapshotSettings(supabase);
  });

  afterEach(async () => {
    await restoreSettings(supabase, snapshot);
  });

  it("updateBillingSettings changes only the electricity rate, never the fixed water charge", async () => {
    await updateBillingSettings(supabase, {
      propertyId: snapshot.propertyId,
      electricityRate: 18.5,
    });

    const context = await getSettingsContext(supabase);
    expect(context.billing.electricityRate).toBe(18.5);
    expect(context.billing.waterCharge).toBe(200); // fixed, never persisted/overridden
  });

  it("updateProperty changes name and address without touching billing/notification settings", async () => {
    await updateProperty(supabase, {
      propertyId: snapshot.propertyId,
      name: "Renamed Test Property",
      address: "456 Different Street",
    });

    const context = await getSettingsContext(supabase);
    expect(context.property.name).toBe("Renamed Test Property");
    expect(context.property.address).toBe("456 Different Street");
    expect(context.billing.electricityRate).toBe(snapshot.defaultElectricityRate);
  });

  it("updateProperty accepts a null address", async () => {
    await updateProperty(supabase, {
      propertyId: snapshot.propertyId,
      name: snapshot.propertyName,
      address: null,
    });

    const context = await getSettingsContext(supabase);
    expect(context.property.address).toBeNull();
  });

  it("updateNotificationPreferences toggles both flags independently", async () => {
    await updateNotificationPreferences(supabase, {
      propertyId: snapshot.propertyId,
      emailEnabled: false,
      inAppEnabled: true,
    });

    let context = await getSettingsContext(supabase);
    expect(context.notifications.emailEnabled).toBe(false);
    expect(context.notifications.inAppEnabled).toBe(true);

    await updateNotificationPreferences(supabase, {
      propertyId: snapshot.propertyId,
      emailEnabled: true,
      inAppEnabled: false,
    });

    context = await getSettingsContext(supabase);
    expect(context.notifications.emailEnabled).toBe(true);
    expect(context.notifications.inAppEnabled).toBe(false);
  });

  // Landlord Name (Profile form) lives in auth.users.user_metadata, not
  // the settings/properties tables the rest of this file exercises —
  // see app/features/settings/components/profile-form.tsx. This
  // regression-tests that the write (auth.updateUser) is actually
  // readable back through the same server-side path the app uses to
  // display it (get-current-user-context.ts), across what is
  // effectively a fresh request — the exact "edit -> refresh" scenario
  // from the bug report.
  it("a landlord name saved via auth.updateUser is readable back via getCurrentUserContext", async () => {
    const before = await getCurrentUserContext(supabase);
    expect(before).not.toBeNull();
    const originalFullName = before!.fullName;
    const originalPhone = before!.phone;

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: "Regression Test Landlord", phone: originalPhone || null },
      });
      expect(error).toBeNull();

      const after = await getCurrentUserContext(supabase);
      expect(after?.fullName).toBe("Regression Test Landlord");
    } finally {
      const { error: restoreError } = await supabase.auth.updateUser({
        data: { full_name: originalFullName, phone: originalPhone || null },
      });
      expect(restoreError).toBeNull();
    }
  });

  it("getSettingsContext falls back to documented defaults when settings has never been written", async () => {
    // Simulate the pre-Settings-ever-saved state directly — deleting the
    // singleton row (not something the app itself ever does, but valid
    // to construct for this test) rather than through any service.
    await supabase.from("settings").delete().eq("property_id", snapshot.propertyId);

    const context = await getSettingsContext(supabase);
    expect(context.billing.electricityRate).toBe(15); // documented default
    expect(context.billing.waterCharge).toBe(200);
    expect(context.notifications.emailEnabled).toBe(true);
    expect(context.notifications.inAppEnabled).toBe(true);
  });
});
