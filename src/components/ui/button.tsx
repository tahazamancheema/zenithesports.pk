import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "gold-gradient text-[var(--color-bg-950)] font-semibold",
    "hover:brightness-110 active:scale-[0.97]",
    "shadow-[0_0_0_1px_var(--color-gold-600)]",
  ].join(" "),
  secondary: [
    "bg-[var(--color-bg-700)] text-[var(--color-text-primary)]",
    "border border-[var(--color-line-600)]",
    "hover:bg-[var(--color-bg-600)] hover:border-[var(--color-gold-600)]",
    "active:scale-[0.97]",
  ].join(" "),
  ghost: [
    "bg-transparent text-[var(--color-gold-400)]",
    "border border-[var(--color-gold-600)]",
    "hover:bg-[var(--gold-tint)] hover:shadow-[var(--gold-glow)]",
    "active:scale-[0.97]",
  ].join(" "),
  danger: [
    "bg-[var(--color-danger)] text-white font-semibold",
    "hover:brightness-110 active:scale-[0.97]",
  ].join(" "),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2.5",
};

/**
 * Primary button component.
 *
 * Variants: primary (gold gradient), secondary (dark), ghost (gold outline), danger (red).
 * Sizes: sm, md, lg.
 * Supports loading state, left/right icon slots.
 *
 * @example
 * <Button variant="primary" size="lg" loading={isSubmitting}>
 *   Register Now
 * </Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      iconLeft,
      iconRight,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base
          "inline-flex items-center justify-center font-medium",
          "rounded-[var(--radius-md)] transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-900)]",
          "select-none cursor-pointer",
          // Variant
          variantStyles[variant],
          // Size
          sizeStyles[size],
          // Disabled
          isDisabled && "opacity-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          iconLeft
        )}
        {children}
        {!loading && iconRight}
      </button>
    );
  }
);

Button.displayName = "Button";
