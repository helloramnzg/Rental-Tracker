"use client";

import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NavLink } from "./nav-link";
import { navItems, settingsNavItem } from "./nav-items";

// Desktop/tablet sidebar. Hidden below the `md` breakpoint, where
// MobileNav (a Sheet drawer) takes over. Widths and breakpoints per
// docs/design/22-layout-system.md Responsive Behaviour.
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-[72px] lg:w-sidebar-width">
      <div className="flex h-topbar-height items-center gap-2 px-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
          RT
        </div>
        <span className="hidden text-base font-semibold lg:inline">
          Rental Tracker
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="flex flex-col gap-1 px-3 py-3">
        <NavLink
          item={settingsNavItem}
          active={pathname.startsWith(settingsNavItem.href)}
        />
      </div>

      <Separator className="bg-sidebar-border" />

      <div className="flex items-center gap-3 px-4 py-4">
        <Avatar className="size-8">
          <AvatarFallback className="bg-accent text-accent-foreground">
            L
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium lg:inline">
          Landlord
        </span>
      </div>
    </aside>
  );
}
