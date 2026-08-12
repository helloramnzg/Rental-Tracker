import { describe, expect, it } from "vitest";
import {
  propertySchema,
  billingSettingsSchema,
  notificationPreferencesSchema,
  profileSchema,
  changePasswordSchema,
} from "@/features/settings/validation/schema";

const PROPERTY_ID = "11111111-1111-1111-1111-111111111111";

describe("propertySchema", () => {
  it("accepts a valid property update", () => {
    expect(
      propertySchema.safeParse({ propertyId: PROPERTY_ID, name: "Sample Rental Property", address: "123 St" })
        .success,
    ).toBe(true);
  });

  it("rejects an empty/whitespace-only name", () => {
    expect(propertySchema.safeParse({ propertyId: PROPERTY_ID, name: "   " }).success).toBe(false);
  });

  it("treats address as optional", () => {
    expect(propertySchema.safeParse({ propertyId: PROPERTY_ID, name: "Sample" }).success).toBe(true);
  });
});

describe("billingSettingsSchema", () => {
  it("accepts the documented default electricity rate", () => {
    expect(
      billingSettingsSchema.safeParse({ propertyId: PROPERTY_ID, electricityRate: 15 }).success,
    ).toBe(true);
  });

  it("rejects a zero or negative electricity rate", () => {
    expect(
      billingSettingsSchema.safeParse({ propertyId: PROPERTY_ID, electricityRate: 0 }).success,
    ).toBe(false);
    expect(
      billingSettingsSchema.safeParse({ propertyId: PROPERTY_ID, electricityRate: -5 }).success,
    ).toBe(false);
  });
});

describe("notificationPreferencesSchema", () => {
  it("accepts all four boolean combinations of email/in-app toggles", () => {
    for (const emailEnabled of [true, false]) {
      for (const inAppEnabled of [true, false]) {
        expect(
          notificationPreferencesSchema.safeParse({ propertyId: PROPERTY_ID, emailEnabled, inAppEnabled })
            .success,
        ).toBe(true);
      }
    }
  });

  it("rejects a non-boolean toggle value", () => {
    expect(
      notificationPreferencesSchema.safeParse({
        propertyId: PROPERTY_ID,
        emailEnabled: "yes",
        inAppEnabled: true,
      }).success,
    ).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts a valid profile", () => {
    expect(
      profileSchema.safeParse({ fullName: "Riri", phone: "+639170000000", email: "landlord@example.com" })
        .success,
    ).toBe(true);
  });

  it("rejects an invalid email address", () => {
    expect(profileSchema.safeParse({ fullName: "Riri", email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty name", () => {
    expect(profileSchema.safeParse({ fullName: "", email: "landlord@example.com" }).success).toBe(
      false,
    );
  });
});

describe("changePasswordSchema", () => {
  it("accepts matching passwords of at least 8 characters", () => {
    expect(
      changePasswordSchema.safeParse({ password: "correcthorse", confirmPassword: "correcthorse" })
        .success,
    ).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = changePasswordSchema.safeParse({
      password: "correcthorse",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      changePasswordSchema.safeParse({ password: "short", confirmPassword: "short" }).success,
    ).toBe(false);
  });
});
