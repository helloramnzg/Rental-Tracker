import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Reflects docs/design/26-settings-screen.md as currently documented.
export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Electricity Rate</CardTitle>
          <CardDescription>
            Configurable by the landlord. Defaults to ₱15.00 / kWh.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-small text-muted-foreground">
            Changes apply only to future billing cycles and do not modify
            previously generated SOAs.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
