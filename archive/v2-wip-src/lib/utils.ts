import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS class names with clsx + tailwind-merge.
 * Handles conditional classes and deduplicates Tailwind utilities.
 *
 * @example
 * cn("bg-bg-800 p-4", isActive && "bg-gold-500", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as PKR currency.
 * Uses South Asian numbering (1,00,000 format).
 *
 * @example
 * formatCurrency(100000) // "PKR 1,00,000"
 * formatCurrency(0)      // "Free"
 */
export function formatCurrency(amount: number): string {
  if (amount === 0) return "Free";
  return `PKR ${amount.toLocaleString("en-PK")}`;
}

/**
 * Format a date for display.
 *
 * @example
 * formatDate(new Date()) // "Sep 17, 2026"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a date and time for display.
 *
 * @example
 * formatDateTime(new Date()) // "Sep 17, 2026 · 11:30 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${formatDate(d)} · ${d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

/**
 * Generate a team code in the format ZE-YYYY-NNNN.
 *
 * @example
 * generateTeamCode(42) // "ZE-2026-0042"
 */
export function generateTeamCode(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  return `ZE-${year}-${sequenceNumber.toString().padStart(4, "0")}`;
}

/**
 * Truncate a string to a maximum length, adding ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 1)}…`;
}

/**
 * Sleep for a given number of milliseconds.
 * Useful for debouncing or adding artificial delays in dev.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a debounced version of a function.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Get the game accent colour CSS variable name.
 */
export function getGameColor(
  game: "valorant" | "freefire" | "pubgm"
): string {
  const map = {
    valorant: "var(--color-valorant)",
    freefire: "var(--color-freefire)",
    pubgm: "var(--color-pubgm)",
  } as const;
  return map[game];
}

/**
 * Get the game display name.
 */
export function getGameName(
  slug: "valorant" | "freefire" | "pubgm"
): string {
  const map = {
    valorant: "Valorant",
    freefire: "Free Fire",
    pubgm: "PUBG Mobile",
  } as const;
  return map[slug];
}
