"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CollapsibleLabel } from "./collapsible-label";
import type { NavItem } from "./nav-items";

export function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              // justify-start is fixed (never toggled) so the icon's
              // position never jumps — with symmetric padding it
              // already reads as centred once the label collapses to
              // zero width beside it.
              "flex items-center justify-start gap-3 rounded-[10px] px-3 py-2 text-small",
              "transition-colors duration-fast ease-standard",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                : "font-normal text-sidebar-foreground hover:bg-sidebar-accent/60",
            )}
          />
        }
      >
        {/* Active = Phosphor fill weight, inactive = regular weight, same icon either way. */}
        <Icon size={20} weight={active ? "fill" : "regular"} className="shrink-0" />
        <CollapsibleLabel expanded={!collapsed} className="whitespace-nowrap">
          {item.label}
        </CollapsibleLabel>
      </TooltipTrigger>
      <TooltipContent side="right" className={collapsed ? undefined : "lg:hidden"}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  );
}
