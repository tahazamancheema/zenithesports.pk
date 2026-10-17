import { cn } from "@/lib/utils";

export interface ProgressBarProps {
  /** Value between 0 and 100 */
  value: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Colour variant */
  variant?: "gold" | "danger" | "success" | "info";
  className?: string;
  /** Height */
  size?: "sm" | "md" | "lg";
}

const variantColors = {
  gold: "bg-[var(--color-gold-500)]",
  danger: "bg-[var(--color-danger)]",
  success: "bg-[var(--color-success)]",
  info: "bg-[var(--color-info)]",
};

const sizeStyles = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

/**
 * Progress bar with gold fill and optional percentage label.
 */
export function ProgressBar({
  value,
  showLabel = false,
  variant = "gold",
  className,
  size = "md",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "w-full bg-[var(--color-bg-600)] rounded-full overflow-hidden",
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            variantColors[variant]
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--color-text-faint)] font-[family-name:var(--font-mono)]">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
