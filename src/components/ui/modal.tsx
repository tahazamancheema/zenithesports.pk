"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from "react";
import { m, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMotion } from "@/components/providers/motion-provider";
import { ease, duration } from "@/lib/motion";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  /** Max width of the modal content */
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

/**
 * Modal dialog with focus trap, backdrop click dismiss, Escape dismiss.
 * Uses Framer Motion for enter/exit animation.
 * Respects prefers-reduced-motion.
 *
 * @example
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
 *   <p>Are you sure?</p>
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  children,
  title,
  description,
  className,
  size = "md",
}: ModalProps) {
  const { prefersReducedMotion } = useMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";

      // Focus the modal content
      requestAnimationFrame(() => {
        contentRef.current?.focus();
      });
    } else {
      document.body.style.overflow = "";
      previousFocus.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    // Focus trap
    if (e.key === "Tab" && contentRef.current) {
      const focusable = contentRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  };

  return (
    <AnimatePresence initial={!prefersReducedMotion}>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Content */}
          <m.div
            ref={contentRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            aria-describedby={description ? "modal-description" : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{
              duration: duration.slow,
              ease: ease.settle,
            }}
            className={cn(
              "relative z-10 w-full",
              sizeStyles[size],
              "bg-[var(--color-bg-800)]",
              "border border-[var(--color-line-700)]",
              "rounded-[var(--radius-lg)]",
              "shadow-2xl",
              "outline-none",
              className
            )}
          >
            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-line-800)]">
                <h2 className="text-lg font-semibold font-[family-name:var(--font-heading)]">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-700)] transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Description */}
            {description && (
              <p
                id="modal-description"
                className="px-6 pt-3 text-sm text-[var(--color-text-muted)]"
              >
                {description}
              </p>
            )}

            {/* Body */}
            <div className="px-6 py-4">{children}</div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
