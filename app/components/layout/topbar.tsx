"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PropertySummary } from "@/services/shell/get-property-summary";
import { navItems, settingsNavItem } from "./nav-items";

function todayLabel() {
  return new Intl.DateTimeFormat("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
}

// Fixed top navigation, per docs/design/22-layout-system.md Top
// Navigation. Search is documented as a future item and intentionally
// omitted here. Title is derived from the active route.
export function Topbar({ property }: { property: PropertySummary }) {
  const pathname = usePathname();
  const title =
    [...navItems, settingsNavItem].find((item) =>
      pathname.startsWith(item.href),
    )?.label ?? "Upa OS";

  return (
    <header className="sticky top-0 z-sticky flex h-topbar-height shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <div className="flex items-baseline gap-1.5">
          <h1 className="text-small font-semibold text-foreground">{title}</h1>
          <span className="hidden text-caption text-muted-foreground sm:inline">
            · {property.name}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden text-caption text-muted-foreground md:inline">
          {todayLabel()}
        </span>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell size={20} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="User menu" />
            }
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-accent text-accent-foreground">
                L
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href="/settings" />}>
              Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
