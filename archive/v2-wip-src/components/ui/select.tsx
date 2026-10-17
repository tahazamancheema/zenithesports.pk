import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Select dropdown with label, error, and hint support.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const selectId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            className={cn(
              "h-10 w-full appearance-none px-3 pr-9 text-sm",
              "bg-[var(--color-bg-600)] text-[var(--color-text-primary)]",
              "border border-[var(--color-line-700)]",
              "rounded-[var(--radius-md)]",
              "transition-colors duration-200",
              "focus:outline-none focus:border-[var(--color-gold-500)]",
              "focus:shadow-[0_0_0_3px_var(--gold-tint-lg)]",
              error && "border-[var(--color-danger)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-faint)] pointer-events-none" />
        </div>
        {error && (
          <p role="alert" className="text-xs text-[var(--color-danger)]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-[var(--color-text-faint)]">{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
