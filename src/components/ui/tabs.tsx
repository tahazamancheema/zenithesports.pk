"use client";

import { useState, type ReactNode } from "react";
import { m } from "framer-motion";
import { cn } from "@/lib/utils";
import { duration, ease } from "@/lib/motion";

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
  /** Called when tab changes */
  onTabChange?: (tabId: string) => void;
}

/**
 * Tabs with gold active indicator animation.
 *
 * @example
 * <Tabs items={[
 *   { id: "teams", label: "My Teams", content: <TeamsTab /> },
 *   { id: "regs", label: "Registrations", content: <RegsTab /> },
 * ]} />
 */
export function Tabs({
  items,
  defaultTab,
  className,
  onTabChange,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id || "");

  const activeContent = items.find((t) => t.id === activeTab)?.content;

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Tab list */}
      <div
        role="tablist"
        className="flex border-b border-[var(--color-line-800)] overflow-x-auto"
      >
        {items.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            onClick={() => {
              setActiveTab(tab.id);
              onTabChange?.(tab.id);
            }}
            className={cn(
              "relative flex items-center gap-2 px-4 py-3 text-sm font-medium",
              "whitespace-nowrap transition-colors duration-200",
              activeTab === tab.id
                ? "text-[var(--color-gold-400)]"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && (
              <m.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-gold-500)]"
                transition={{
                  duration: duration.base,
                  ease: ease.snappy,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={activeTab}
        className="pt-4"
      >
        {activeContent}
      </div>
    </div>
  );
}
