import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
  /** Layout direction */
  direction?: "horizontal" | "vertical";
}

/**
 * Radio button group with gold selected state.
 */
export function RadioGroup({
  name,
  label,
  options,
  value,
  onChange,
  error,
  className,
  direction = "vertical",
}: RadioGroupProps) {
  return (
    <fieldset className={cn("flex flex-col gap-2", className)}>
      {label && (
        <legend className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
          {label}
        </legend>
      )}
      <div
        className={cn(
          "flex gap-3",
          direction === "vertical" ? "flex-col" : "flex-row flex-wrap"
        )}
      >
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              "inline-flex items-center gap-2.5 cursor-pointer group",
              opt.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className="relative">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange?.(opt.value)}
                disabled={opt.disabled}
                className="peer sr-only"
              />
              <div
                className={cn(
                  "h-5 w-5 rounded-full",
                  "border-2 border-[var(--color-line-600)]",
                  "transition-all duration-200",
                  "peer-checked:border-[var(--color-gold-500)]",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-gold-500)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg-900)]",
                  "group-hover:border-[var(--color-gold-600)]"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "h-2.5 w-2.5 rounded-full",
                    "bg-[var(--color-gold-500)]",
                    "scale-0 transition-transform duration-200",
                    "peer-checked:scale-100"
                  )}
                />
              </div>
            </div>
            <span className="text-sm text-[var(--color-text-primary)] select-none">
              {opt.label}
            </span>
          </label>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </fieldset>
  );
}
