import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Enable hover gold edge-light effect */
  hover?: boolean;
  /** Optional accent colour strip at top */
  accentColor?: string;
  /** Make the entire card a link */
  as?: "div" | "article";
}

/**
 * Card component with dark surface, hairline border, and optional gold hover glow.
 *
 * @example
 * <Card hover accentColor="var(--color-valorant)">
 *   <h3>Tournament Title</h3>
 * </Card>
 */
export function Card({
  children,
  className,
  hover = false,
  accentColor,
  as: Component = "div",
}: CardProps) {
  return (
    <Component
      className={cn(
        "relative bg-[var(--color-bg-800)]",
        "border border-[var(--color-line-800)]",
        "rounded-[var(--radius-md)] overflow-hidden",
        "transition-all duration-200",
        hover && [
          "hover:border-[var(--color-gold-600)]/50",
          "hover:shadow-[var(--gold-glow)]",
          "hover:bg-[color-mix(in_srgb,var(--color-bg-800),var(--color-gold-500)_3%)]",
        ],
        className
      )}
    >
      {accentColor && (
        <div
          className="h-0.5 w-full"
          style={{ backgroundColor: accentColor }}
        />
      )}
      {children}
    </Component>
  );
}

/** Card section with consistent padding */
export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-5", className)}>
      {children}
    </div>
  );
}

/** Card footer (e.g., for CTAs) */
export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "px-5 py-3 border-t border-[var(--color-line-800)]",
        "bg-[var(--color-bg-900)]/50",
        className
      )}
    >
      {children}
    </div>
  );
}
