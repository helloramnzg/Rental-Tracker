"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { MobileNav } from "./mobile-nav";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { PropertySummary } from "@/services/shell/get-property-summary";
import type { NotificationItem } from "@/services/notifications/get-notifications";
import { getInitial } from "@/lib/utils";
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
export function Topbar({
  property,
  landlordName,
  notifications,
}: {
  property: PropertySummary;
  landlordName: string;
  notifications: NotificationItem[];
}) {
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  notifications.length > 0
                    ? `Notifications (${notifications.length} need attention)`
                    : "Notifications"
                }
                className="relative"
              />
            }
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <p className="px-2 py-6 text-center text-small text-muted-foreground">
                  You&apos;re all caught up.
                </p>
              ) : (
                notifications.map((item) => (
                  <DropdownMenuItem key={item.id} render={<Link href={item.href} />}>
                    <div className="flex flex-col gap-0.5 py-0.5">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-caption text-muted-foreground">
                        {item.description}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" aria-label="User menu" />
            }
          >
            <Avatar size="sm">
              <AvatarFallback className="bg-accent text-accent-foreground">
                {getInitial(landlordName)}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{landlordName || "Landlord"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/settings" />}>
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
