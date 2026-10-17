"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, AnimatePresence } from "framer-motion";
import { Menu, User, X } from "lucide-react";
import { mainNav } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
import { duration, ease } from "@/lib/motion";

/**
 * Main application navigation bar.
 * Sticky header with background blur, active state tracking, and mobile menu.
 */
export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-40 transition-all duration-300",
          isScrolled
            ? "bg-[var(--color-bg-900)]/80 backdrop-blur-md border-b border-[var(--color-line-800)] py-3 shadow-lg"
            : "bg-transparent py-5"
        )}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="relative flex items-center gap-2 group z-50"
              aria-label={siteConfig.name}
            >
              <div className="h-10 w-10 overflow-hidden rounded-sm bg-black flex items-center justify-center">
                {/* We'll replace this with the actual logo image later */}
                <span className="font-[family-name:var(--font-display)] font-bold text-lg text-white">
                  ZE
                </span>
              </div>
              <span className="font-[family-name:var(--font-heading)] font-bold tracking-wide uppercase hidden sm:block group-hover:text-[var(--color-gold-400)] transition-colors">
                Zenith Esports
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {mainNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium transition-colors rounded-[var(--radius-md)]",
                      "hover:text-[var(--color-gold-400)] hover:bg-[var(--gold-tint-sm)] flex items-center gap-2",
                      isActive
                        ? "text-[var(--color-gold-500)] font-semibold"
                        : "text-[var(--color-text-muted)]"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                    {isActive && (
                      <m.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 inset-x-4 h-0.5 bg-[var(--color-gold-500)]"
                        transition={{ duration: duration.base, ease: ease.snappy }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-4">
              {/* Dummy auth state for now */}
              <Link href="/dashboard" tabIndex={-1}>
                <Button variant="ghost" size="sm" iconLeft={<User className="h-4 w-4" />}>
                  Dashboard
                </Button>
              </Link>
              <Link href="/tournaments" tabIndex={-1}>
                <Button variant="primary" size="sm">
                  Join a Tournament
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden relative z-50 p-2 text-[var(--color-text-primary)] hover:text-[var(--color-gold-400)] transition-colors"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.fast }}
            className="fixed inset-0 z-30 bg-[var(--color-bg-950)]/95 backdrop-blur-xl lg:hidden flex flex-col pt-24 pb-8 px-6"
          >
            <nav className="flex flex-col gap-4 mb-auto">
              {mainNav.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <m.div
                    key={item.href}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: duration.base, ease: ease.snappy }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-4 text-2xl font-[family-name:var(--font-heading)] font-semibold uppercase tracking-wide py-3 border-b border-[var(--color-line-800)]",
                        isActive ? "text-[var(--color-gold-500)]" : "text-[var(--color-text-primary)]"
                      )}
                    >
                      {Icon && <Icon className="h-6 w-6" />}
                      {item.label}
                    </Link>
                  </m.div>
                );
              })}
            </nav>

            <m.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: duration.base }}
              className="flex flex-col gap-4 mt-8"
            >
              <Link href="/dashboard" className="w-full">
                <Button variant="secondary" size="lg" className="w-full justify-center">
                  Dashboard
                </Button>
              </Link>
              <Link href="/tournaments" className="w-full">
                <Button variant="primary" size="lg" className="w-full justify-center">
                  Join a Tournament
                </Button>
              </Link>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}
