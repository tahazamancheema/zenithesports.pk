import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox, type LucideIcon } from "lucide-react";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
}

/**
 * Empty state display with icon, title, description, and optional CTA.
 *
 * @example
 * <EmptyState
 *   icon={Trophy}
 *   title="No tournaments match your filters"
 *   description="Try adjusting your filters or check back later."
 *   action={{ label: "Clear Filters", onClick: clearFilters }}
 * />
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[var(--gold-tint-sm)] mb-4">
        <Icon className="h-8 w-8 text-[var(--color-gold-500)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
