import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
}

/**
 * Checkbox with gold check indicator.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const checkboxId =
      id || (label ? `cb-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div className="flex flex-col gap-1">
        <label
          htmlFor={checkboxId}
          className={cn("inline-flex items-center gap-2.5 cursor-pointer group", className)}
        >
          <div className="relative">
            <input
              ref={ref}
              type="checkbox"
              id={checkboxId}
              className="peer sr-only"
              aria-invalid={!!error}
              {...props}
            />
            <div
              className={cn(
                "h-5 w-5 rounded-[var(--radius-sm)]",
                "border border-[var(--color-line-600)]",
                "bg-[var(--color-bg-600)]",
                "transition-all duration-200",
                "peer-checked:bg-[var(--color-gold-500)] peer-checked:border-[var(--color-gold-500)]",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-gold-500)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg-900)]",
                "group-hover:border-[var(--color-gold-600)]",
                error && "border-[var(--color-danger)]"
              )}
            >
              <Check className="h-full w-full p-0.5 text-[var(--color-bg-950)] opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </div>
          {label && (
            <span className="text-sm text-[var(--color-text-primary)] select-none">
              {label}
            </span>
          )}
        </label>
        {error && (
          <p role="alert" className="text-xs text-[var(--color-danger)] ml-7">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";
