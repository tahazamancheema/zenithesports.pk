"use client";

import { useState, type ReactNode } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Allow multiple items open at once */
  multiple?: boolean;
  className?: string;
}

/**
 * Accordion with smooth expand/collapse animation.
 *
 * @example
 * <Accordion items={[
 *   { id: "1", title: "What is Mark47?", content: <p>Mark47 is...</p> },
 * ]} />
 */
export function Accordion({
  items,
  multiple = false,
  className,
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(multiple ? prev : []);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("divide-y divide-[var(--color-line-800)]", className)}>
      {items.map((item) => {
        const isOpen = openItems.has(item.id);

        return (
          <div key={item.id}>
            <button
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`accordion-${item.id}`}
              className={cn(
                "flex w-full items-center justify-between py-4 text-left",
                "text-sm font-medium text-[var(--color-text-primary)]",
                "hover:text-[var(--color-gold-400)] transition-colors"
              )}
            >
              {item.title}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-[var(--color-text-faint)] transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <m.div
                  id={`accordion-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    duration: duration.base,
                    ease: ease.snappy,
                  }}
                  className="overflow-hidden"
                >
                  <div className="pb-4 text-sm text-[var(--color-text-muted)]">
                    {item.content}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
