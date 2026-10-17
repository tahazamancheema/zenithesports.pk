import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Text input with label, error, and hint support.
 * Gold focus ring, dark background, full ARIA support.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] font-[family-name:var(--font-body)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${inputId}-error`
              : hint
                ? `${inputId}-hint`
                : undefined
          }
          className={cn(
            // Base
            "h-10 w-full px-3 text-sm",
            "bg-[var(--color-bg-600)] text-[var(--color-text-primary)]",
            "border border-[var(--color-line-700)]",
            "rounded-[var(--radius-md)]",
            "placeholder:text-[var(--color-text-faint)]",
            "transition-colors duration-200",
            // Focus
            "focus:outline-none focus:border-[var(--color-gold-500)]",
            "focus:shadow-[0_0_0_3px_var(--gold-tint-lg)]",
            // Error
            error && "border-[var(--color-danger)] focus:border-[var(--color-danger)]",
            // Disabled
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-[var(--color-danger)]"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className="text-xs text-[var(--color-text-faint)]"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
