import type { ReactNode } from "react";

// Shared page header per docs/design/22-layout-system.md Content
// Structure: every page begins with Header + optional Primary Action.
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-caption font-bold tracking-widest text-success uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className={eyebrow ? "mt-1 text-h2 text-foreground" : "text-h2 text-foreground"}>
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-small text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
