"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> {
  label?: string;
}

/**
 * Toggle switch with gold active state.
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className, id, ...props }, ref) => {
    const switchId =
      id || (label ? `sw-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <label
        htmlFor={switchId}
        className={cn("inline-flex items-center gap-2.5 cursor-pointer", className)}
      >
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            role="switch"
            id={switchId}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              "h-6 w-11 rounded-full",
              "bg-[var(--color-bg-600)] border border-[var(--color-line-600)]",
              "transition-colors duration-200",
              "peer-checked:bg-[var(--color-gold-500)] peer-checked:border-[var(--color-gold-500)]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-gold-500)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--color-bg-900)]"
            )}
          />
          <div
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full",
              "bg-[var(--color-text-faint)]",
              "transition-all duration-200",
              "peer-checked:translate-x-5 peer-checked:bg-[var(--color-bg-950)]"
            )}
          />
        </div>
        {label && (
          <span className="text-sm text-[var(--color-text-primary)] select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";
