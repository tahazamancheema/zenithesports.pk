import { cn } from "@/lib/utils";
import { AlertTriangle, type LucideIcon } from "lucide-react";
import { Button } from "./button";

export interface ErrorStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Error state display with retry button.
 */
export function ErrorState({
  icon: Icon = AlertTriangle,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-500/10 mb-4">
        <Icon className="h-8 w-8 text-[var(--color-danger)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-muted)] max-w-sm mb-4">
        {description}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
