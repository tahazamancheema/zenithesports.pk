"use client";

import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMotion } from "@/components/providers/motion-provider";
import { ease, duration } from "@/lib/motion";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  /** Side to open from */
  side?: "left" | "right" | "bottom";
}

const slideVariants = {
  left: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
  },
  bottom: {
    initial: { y: "100%" },
    animate: { y: 0 },
    exit: { y: "100%" },
  },
};

const sideStyles = {
  left: "fixed inset-y-0 left-0 w-80 max-w-[85vw]",
  right: "fixed inset-y-0 right-0 w-80 max-w-[85vw]",
  bottom: "fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-xl",
};

/**
 * Drawer (mobile-native slide-in panel).
 * Supports left, right, and bottom slide directions.
 *
 * @example
 * <Drawer open={isOpen} onClose={close} side="bottom" title="Menu">
 *   <nav>...</nav>
 * </Drawer>
 */
export function Drawer({
  open,
  onClose,
  children,
  title,
  className,
  side = "right",
}: DrawerProps) {
  const { prefersReducedMotion } = useMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => contentRef.current?.focus());
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const variants = slideVariants[side];

  return (
    <AnimatePresence initial={!prefersReducedMotion}>
      {open && (
        <div className="fixed inset-0 z-50" onKeyDown={handleKeyDown}>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <m.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Drawer"}
            tabIndex={-1}
            initial={variants.initial}
            animate={variants.animate}
            exit={variants.exit}
            transition={{
              duration: duration.slow,
              ease: ease.settle,
            }}
            className={cn(
              sideStyles[side],
              "z-10 bg-[var(--color-bg-800)]",
              "border-[var(--color-line-700)]",
              side === "left" && "border-r",
              side === "right" && "border-l",
              side === "bottom" && "border-t",
              "outline-none flex flex-col",
              className
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-line-800)]">
                <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-700)] transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
