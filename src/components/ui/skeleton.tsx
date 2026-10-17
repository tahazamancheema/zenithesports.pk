import { cn } from "@/lib/utils";

export interface SkeletonProps {
  className?: string;
  /** Width, e.g. "w-32" or "w-full" */
  width?: string;
  /** Height, e.g. "h-4" or "h-10" */
  height?: string;
  /** Whether it's a circle (for avatars) */
  circle?: boolean;
}

/**
 * Skeleton loading placeholder with gold shimmer animation.
 *
 * @example
 * <Skeleton width="w-full" height="h-6" />
 * <Skeleton circle className="h-10 w-10" />
 */
export function Skeleton({
  className,
  width = "w-full",
  height = "h-4",
  circle = false,
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "skeleton-shimmer",
        circle ? "rounded-full" : "rounded-[var(--radius-md)]",
        width,
        height,
        className
      )}
    />
  );
}

/** Group of skeleton lines for text content */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-4"
          width={i === lines - 1 ? "w-2/3" : "w-full"}
        />
      ))}
    </div>
  );
}
