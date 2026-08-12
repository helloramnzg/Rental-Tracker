import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Per docs/design/21-component-library.md Empty State: icon, clear
// message, primary call-to-action.
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-16 text-center">
      <Icon size={32} className="text-muted-foreground" aria-hidden="true" />
      <h3 className="text-h3 text-foreground">{title}</h3>
      {description && (
        <p className="max-w-sm text-small text-muted-foreground">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
