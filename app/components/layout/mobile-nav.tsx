"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { navItems, settingsNavItem } from "./nav-items";

// Slide-out drawer for screens below the `md` breakpoint, per
// docs/design/22-layout-system.md Responsive Behaviour (Mobile:
// "Sidebar becomes a slide-out drawer").
export function MobileNav() {
  const pathname = usePathname();
  const items = [...navItems, settingsNavItem];

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation"
          />
        }
      >
        <Menu size={20} />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-sidebar-width max-w-[80vw] bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="h-topbar-height justify-center border-b border-sidebar-border px-4">
          <SheetTitle className="text-lg font-bold text-sidebar-foreground">
            Upa OS
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-3 py-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-[10px] px-3 py-2 text-small",
                  "transition-colors duration-fast ease-standard",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "font-normal text-sidebar-foreground hover:bg-sidebar-accent/60",
                )}
              >
                <Icon size={20} weight={active ? "fill" : "regular"} className="shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
