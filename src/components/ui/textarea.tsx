import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Textarea with label, error, and hint support.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const textareaId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] font-[family-name:var(--font-body)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${textareaId}-error`
              : hint
                ? `${textareaId}-hint`
                : undefined
          }
          className={cn(
            "min-h-[100px] w-full px-3 py-2 text-sm resize-y",
            "bg-[var(--color-bg-600)] text-[var(--color-text-primary)]",
            "border border-[var(--color-line-700)]",
            "rounded-[var(--radius-md)]",
            "placeholder:text-[var(--color-text-faint)]",
            "transition-colors duration-200",
            "focus:outline-none focus:border-[var(--color-gold-500)]",
            "focus:shadow-[0_0_0_3px_var(--gold-tint-lg)]",
            error &&
              "border-[var(--color-danger)] focus:border-[var(--color-danger)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
          {...props}
        />
        {error && (
          <p
            id={`${textareaId}-error`}
            role="alert"
            className="text-xs text-[var(--color-danger)]"
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${textareaId}-hint`}
            className="text-xs text-[var(--color-text-faint)]"
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
