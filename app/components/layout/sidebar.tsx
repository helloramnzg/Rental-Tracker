"use client";

import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { PropertySummary } from "@/services/shell/get-property-summary";
import { useSidebarState } from "./sidebar-context";
import { CollapsibleLabel, SIDEBAR_MOTION } from "./collapsible-label";
import { NavLink } from "./nav-link";
import { navItems, settingsNavItem } from "./nav-items";

// Desktop/tablet sidebar. Hidden below the `md` breakpoint, where
// MobileNav (a Sheet drawer) takes over. Widths and breakpoints per
// docs/design/22-layout-system.md Responsive Behaviour. `collapsed`
// (from SidebarStateProvider) only controls the `lg`+ width — the
// `md` icon-rail tier stays forced-compact regardless, unchanged.
//
// Every collapsing element here (width, labels, the property card,
// the logo/toggle crossfade) shares SIDEBAR_MOTION so the whole
// thing moves as one system rather than a pile of separately-timed
// animations.
export function Sidebar({ property }: { property: PropertySummary }) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarState();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-[72px]",
        "transition-[width]",
        SIDEBAR_MOTION,
        collapsed ? "lg:w-[72px]" : "lg:w-sidebar-width",
      )}
    >
      <div
        className={cn(
          // Compact (centred, no gap/padding) by default — covers the
          // `md` tablet tier, which is always forced-compact — and
          // only switches to the spread-out expanded layout at `lg`+
          // when not collapsed. Matches how CollapsibleLabel splits
          // the same two concerns.
          "flex h-topbar-height shrink-0 items-center justify-center gap-0 px-0",
          !collapsed && "lg:justify-start lg:gap-2.5 lg:px-4",
        )}
      >
        {/* Logo doubles as the expand control once collapsed. It's
            the same button node in both states — never unmounted —
            so collapsing/expanding is a style transition, never an
            abrupt element swap. */}
        <button
          type="button"
          onClick={collapsed ? toggle : undefined}
          aria-label={collapsed ? "Expand sidebar" : undefined}
          aria-hidden={!collapsed}
          tabIndex={collapsed ? 0 : -1}
          className={cn(
            "group relative flex size-8 shrink-0 items-center justify-center rounded-md transition-colors",
            SIDEBAR_MOTION,
            collapsed
              ? "cursor-pointer hover:bg-sidebar-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              : "cursor-default",
          )}
        >
          <img
            src="/brand/logo-mark.svg"
            alt=""
            className={cn(
              "h-5 w-auto transition-opacity",
              SIDEBAR_MOTION,
              collapsed && "group-hover:opacity-0 group-focus-visible:opacity-0",
            )}
          />
          <PanelLeft
            size={18}
            aria-hidden="true"
            className={cn(
              "absolute inset-0 m-auto opacity-0 transition-opacity",
              SIDEBAR_MOTION,
              collapsed && "group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          />
        </button>

        <CollapsibleLabel expanded={!collapsed} className="whitespace-nowrap text-lg font-bold">
          Upa OS
        </CollapsibleLabel>

        <CollapsibleLabel
          expanded={!collapsed}
          wrapperClassName={collapsed ? undefined : "ml-auto"}
        >
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={toggle}
            aria-label="Collapse sidebar"
            aria-hidden={collapsed}
            tabIndex={collapsed ? -1 : 0}
          >
            <PanelLeft size={18} />
          </Button>
        </CollapsibleLabel>
      </div>

      <div
        className={cn(
          "grid px-3 transition-[grid-template-rows]",
          SIDEBAR_MOTION,
          "grid-rows-[0fr]",
          !collapsed && "lg:grid-rows-[1fr]",
        )}
      >
        <div className="overflow-hidden pb-4">
          <div
            className={cn(
              "rounded-lg bg-accent px-3 py-2.5 text-accent-foreground opacity-0 transition-opacity",
              SIDEBAR_MOTION,
              !collapsed && "lg:opacity-100",
            )}
          >
            <p className="truncate text-small font-semibold">{property.name}</p>
            <p className="line-clamp-2 text-caption text-accent-foreground/80">
              {property.occupiedUnits.occupied} occupied unit
              {property.occupiedUnits.occupied === 1 ? "" : "s"}
              {property.address ? ` · ${property.address}` : ""}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            active={pathname.startsWith(item.href)}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="flex flex-col gap-1 px-3 py-3">
        <NavLink
          item={settingsNavItem}
          active={pathname.startsWith(settingsNavItem.href)}
          collapsed={collapsed}
        />
      </div>

      <Separator className="bg-sidebar-border" />

      <div className="flex items-center gap-3 px-4 py-4">
        <Avatar className="size-8">
          <AvatarFallback className="bg-accent text-accent-foreground">
            L
          </AvatarFallback>
        </Avatar>
        <CollapsibleLabel expanded={!collapsed} className="whitespace-nowrap text-caption font-semibold">
          Landlord
        </CollapsibleLabel>
      </div>
    </aside>
  );
}
