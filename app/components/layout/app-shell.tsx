import type { ReactNode } from "react";
import type { PropertySummary } from "@/services/shell/get-property-summary";
import type { NotificationItem } from "@/services/notifications/get-notifications";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { SidebarStateProvider } from "./sidebar-context";

// Application shell shared by every authenticated page, per
// docs/design/22-layout-system.md Application Shell: "Sidebar remains
// fixed. Top navigation remains fixed. Main content scrolls
// independently." The outer container is capped at exactly h-screen
// (not min-h-screen, which grows with content) so the sidebar and
// topbar never stretch — only <main> scrolls. SidebarStateProvider
// wraps the whole shell so the collapse toggle and its persisted
// state are consistent across every page, not re-implemented per page.
export function AppShell({
  children,
  property,
  landlordName,
  notifications,
}: {
  children: ReactNode;
  property: PropertySummary;
  landlordName: string;
  notifications: NotificationItem[];
}) {
  return (
    <SidebarStateProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar property={property} landlordName={landlordName} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar property={property} landlordName={landlordName} notifications={notifications} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1440px] px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarStateProvider>
  );
}
