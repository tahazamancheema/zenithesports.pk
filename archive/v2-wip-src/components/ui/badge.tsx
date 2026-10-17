import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "gold"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "valorant"
  | "freefire"
  | "pubgm";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  /** Pulsing dot indicator */
  pulse?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    "border-[var(--color-line-600)] text-[var(--color-text-muted)]",
  gold: "border-[var(--color-gold-600)] text-[var(--color-gold-400)] bg-[var(--gold-tint-sm)]",
  success:
    "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
  danger: "border-red-500/30 text-red-400 bg-red-500/5",
  warning:
    "border-yellow-500/30 text-yellow-400 bg-yellow-500/5",
  info: "border-blue-500/30 text-blue-400 bg-blue-500/5",
  valorant:
    "border-[var(--color-valorant)]/30 text-[var(--color-valorant)] bg-[var(--color-valorant)]/5",
  freefire:
    "border-[var(--color-freefire)]/30 text-[var(--color-freefire)] bg-[var(--color-freefire)]/5",
  pubgm:
    "border-[var(--color-pubgm)]/30 text-[var(--color-pubgm)] bg-[var(--color-pubgm)]/5",
};

/**
 * Status badge with game-specific and semantic colour variants.
 * Can show a pulsing dot indicator for "LIVE" states.
 *
 * @example
 * <Badge variant="gold" pulse>LIVE</Badge>
 * <Badge variant="valorant">Valorant</Badge>
 */
export function Badge({
  variant = "default",
  children,
  className,
  pulse,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
        "border rounded-[var(--radius-sm)]",
        "font-[family-name:var(--font-body)]",
        variantStyles[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              variant === "gold"
                ? "bg-[var(--color-gold-500)]"
                : variant === "success"
                  ? "bg-emerald-400"
                  : variant === "danger"
                    ? "bg-red-400"
                    : "bg-current"
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              variant === "gold"
                ? "bg-[var(--color-gold-500)]"
                : variant === "success"
                  ? "bg-emerald-400"
                  : variant === "danger"
                    ? "bg-red-400"
                    : "bg-current"
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
