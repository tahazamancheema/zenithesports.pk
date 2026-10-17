"use client";

import { useEffect, useState, type ReactNode } from "react";
import { m, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export type ToastType = "success" | "error" | "info";

export interface ToastProps {
  id: string;
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
  action?: ReactNode;
}

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
  error: <AlertCircle className="h-5 w-5 text-[var(--color-danger)]" />,
  info: <Info className="h-5 w-5 text-[var(--color-info)]" />,
};

const borderColors = {
  success: "border-emerald-500/30",
  error: "border-[var(--color-danger)]/30",
  info: "border-[var(--color-info)]/30",
};

/**
 * Individual Toast component.
 * Managed by a global store in a real app, but this is the UI primitive.
 */
export function Toast({
  id,
  type = "info",
  title,
  description,
  duration: durationMs = 5000,
  onClose,
  action,
}: ToastProps) {
  useEffect(() => {
    if (durationMs === Infinity) return;
    const timer = setTimeout(() => onClose(id), durationMs);
    return () => clearTimeout(timer);
  }, [id, durationMs, onClose]);

  return (
    <m.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: duration.fast } }}
      transition={{ duration: duration.slow, ease: ease.bounce }}
      className={cn(
        "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-[var(--radius-md)] p-4 shadow-lg",
        "bg-[var(--color-bg-800)] border",
        borderColors[type]
      )}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">
          {title}
        </p>
        {description && (
          <p className="text-sm text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 ml-4">{action}</div>}
      <button
        onClick={() => onClose(id)}
        className="shrink-0 rounded-[var(--radius-sm)] p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-700)] transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </button>
    </m.div>
  );
}

// Simple toast manager state for the provider
interface ToastState extends Omit<ToastProps, "onClose"> {}

let toastCount = 0;
let addToastFn: (toast: Omit<ToastState, "id">) => void = () => {};

export function toast(props: Omit<ToastState, "id">) {
  addToastFn(props);
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    addToastFn = (props) => {
      const id = `toast-${toastCount++}`;
      setToasts((prev) => [...prev, { ...props, id }]);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-4 sm:right-4 sm:w-auto"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}
