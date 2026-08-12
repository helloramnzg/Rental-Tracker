import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Shared collapse motion for the sidebar — width, labels, and the
// logo/toggle crossfade all use this one duration+easing so the
// whole sidebar reads as a single coordinated transition instead of
// several independently-timed animations. Arbitrary-value syntax is
// deliberate: Tailwind v4 only generates `duration-*`/`ease-*`
// utilities for its built-in numeric scale, not custom-named
// `--duration-*` theme keys, so a named token here would silently
// no-op (as `duration-fast` etc. already do elsewhere in this app).
// Ease-out-heavy curve: quick start, smooth deceleration into the
// final state — not a linear or symmetric ease-in-out.
export const SIDEBAR_MOTION = "duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]";

// Animates a label to/from zero width via `grid-template-columns:
// 1fr <-> 0fr` — the standard way to smoothly collapse an element to
// "no space" with no layout jump and no mid-transition text wrap
// (unlike toggling `display`, which can't be transitioned at all).
// Paired with an opacity fade so the label visibly fades rather than
// snapping.
//
// `expanded` covers both breakpoint-driven compactness (tablet stays
// forced-compact regardless of the desktop toggle) and state-driven
// compactness (desktop collapse) — the `lg:` prefix only takes over
// once both conditions allow it, matching how the rest of the
// sidebar splits those two concerns.
export function CollapsibleLabel({
  expanded,
  className,
  wrapperClassName,
  children,
}: {
  expanded: boolean;
  className?: string;
  /** Classes for the outer flex/grid item itself — e.g. `ml-auto` to
   * push it within a flex row. `className` only reaches the inner
   * content wrapper, which has no size of its own to apply layout
   * classes like margins against. */
  wrapperClassName?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid overflow-hidden transition-[grid-template-columns]",
        SIDEBAR_MOTION,
        "grid-cols-[0fr]",
        expanded && "lg:grid-cols-[1fr]",
        wrapperClassName,
      )}
    >
      <div
        className={cn(
          "overflow-hidden opacity-0 transition-opacity",
          SIDEBAR_MOTION,
          expanded && "lg:opacity-100",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
