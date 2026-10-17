import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { AnnouncementBar } from "./announcement-bar";

export interface ShellProps {
  children: ReactNode;
  hideFooter?: boolean;
  hideNavbar?: boolean;
}

/**
 * Main application shell.
 * Wraps pages with Navbar, Footer, and standard padding.
 */
export function Shell({ children, hideFooter, hideNavbar }: ShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Top Announcement (hardcoded for now, can be fetched from DB later) */}
      <AnnouncementBar
        id="launch-season"
        message="Registrations for Zenith Cup Season 4 are now open!"
        href="/tournaments/zenith-cup-s4"
        type="gold"
      />

      {!hideNavbar && <Navbar />}

      {/* Main content wrapper */}
      <main className="flex-1 w-full pt-[var(--navbar-height,80px)]">
        {children}
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
}
