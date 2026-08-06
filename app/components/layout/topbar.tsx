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
import { navItems, settingsNavItem } from "./nav-items";

// Fixed top navigation, per docs/design/22-layout-system.md Top
// Navigation. Search is documented as a future item and intentionally
// omitted here. Title is derived from the active route.
export function Topbar() {
  const pathname = usePathname();
  const title =
    [...navItems, settingsNavItem].find((item) =>
      pathname.startsWith(item.href),
    )?.label ?? "Rental Tracker";

  return (
    <header className="sticky top-0 z-sticky flex h-topbar-height shrink-0 items-center justify-between border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
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
