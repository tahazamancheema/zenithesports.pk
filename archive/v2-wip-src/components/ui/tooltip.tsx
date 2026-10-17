"use client";

import { useState, type ReactNode } from "react";
import { m, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface TooltipProps {
  content: string;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
}

/**
 * Tooltip that appears on hover.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <m.div
            initial={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4 }}
            transition={{ duration: duration.fast }}
            role="tooltip"
            className={cn(
              "absolute z-50 px-2.5 py-1 text-xs font-medium whitespace-nowrap",
              "bg-[var(--color-bg-700)] text-[var(--color-text-primary)]",
              "border border-[var(--color-line-700)] rounded-[var(--radius-sm)]",
              "shadow-lg pointer-events-none",
              side === "top" && "bottom-full left-1/2 -translate-x-1/2 mb-2",
              side === "bottom" && "top-full left-1/2 -translate-x-1/2 mt-2",
              className
            )}
          >
            {content}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
