"use client";

import { useState, useEffect } from "react";
import { X, ArrowRight } from "lucide-react";
import { m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { duration } from "@/lib/motion";

export interface AnnouncementBarProps {
  id: string;
  message: string;
  href?: string;
  ctaText?: string;
  type?: "default" | "gold" | "danger" | "valorant" | "freefire" | "pubgm";
}

const typeStyles = {
  default: "bg-[var(--color-bg-800)] text-[var(--color-text-primary)] border-b border-[var(--color-line-800)]",
  gold: "gold-gradient text-[var(--color-bg-950)] font-medium",
  danger: "bg-[var(--color-danger)] text-white font-medium",
  valorant: "bg-[var(--color-valorant)] text-white font-medium",
  freefire: "bg-[var(--color-freefire)] text-white font-medium",
  pubgm: "bg-[var(--color-pubgm)] text-white font-medium",
};

/**
 * Dismissable announcement bar at the very top of the page.
 * Uses localStorage to remember if a user has dismissed a specific announcement.
 */
export function AnnouncementBar({
  id,
  message,
  href,
  ctaText = "Learn More",
  type = "default",
}: AnnouncementBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if this specific announcement was dismissed
    const isDismissed = localStorage.getItem(`dismissed-announcement-${id}`);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(`dismissed-announcement-${id}`, "true");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: duration.base }}
          className={cn("relative overflow-hidden z-50", typeStyles[type])}
        >
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center justify-center text-sm text-center">
              <span>{message}</span>
              {href && (
                <Link
                  href={href}
                  className="inline-flex items-center gap-1 ml-2 underline decoration-current/30 hover:decoration-current underline-offset-2 transition-all"
                >
                  {ctaText}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 p-1 rounded-sm hover:bg-black/10 transition-colors"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
