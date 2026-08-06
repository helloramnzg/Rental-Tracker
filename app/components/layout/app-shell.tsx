import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

// Application shell shared by every authenticated page, per
// docs/design/22-layout-system.md Application Shell.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
