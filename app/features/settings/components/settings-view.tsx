import type { SettingsContext } from "@/services/settings/get-settings-context";
import type { CurrentUserContext } from "@/services/settings/get-current-user-context";
import { PropertySettingsForm } from "./property-settings-form";
import { BillingSettingsForm } from "./billing-settings-form";
import { ProfileForm } from "./profile-form";
import { SecuritySection } from "./security-section";
import { NotificationPreferencesForm } from "./notification-preferences-form";

export function SettingsView({
  settings,
  user,
}: {
  settings: SettingsContext;
  user: CurrentUserContext;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PropertySettingsForm
        propertyId={settings.property.id}
        name={settings.property.name}
        address={settings.property.address}
      />
      <BillingSettingsForm
        propertyId={settings.property.id}
        electricityRate={settings.billing.electricityRate}
        waterCharge={settings.billing.waterCharge}
      />
      <ProfileForm fullName={user.fullName} phone={user.phone} email={user.email} />
      <SecuritySection
        email={user.email}
        createdAt={user.createdAt}
        lastSignInAt={user.lastSignInAt}
        sessionExpiresAt={user.sessionExpiresAt}
      />
      <NotificationPreferencesForm
        propertyId={settings.property.id}
        emailEnabled={settings.notifications.emailEnabled}
        inAppEnabled={settings.notifications.inAppEnabled}
      />
    </div>
  );
}
