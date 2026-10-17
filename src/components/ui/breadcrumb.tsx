import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb navigation.
 *
 * @example
 * <Breadcrumb items={[
 *   { label: "Tournaments", href: "/tournaments" },
 *   { label: "Zenith Cup Season 4" },
 * ]} />
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1.5 text-sm", className)}>
      <Link
        href="/"
        className="text-[var(--color-text-faint)] hover:text-[var(--color-gold-400)] transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-[var(--color-text-faint)]" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-[var(--color-text-faint)] hover:text-[var(--color-gold-400)] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[var(--color-text-primary)] font-medium">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
