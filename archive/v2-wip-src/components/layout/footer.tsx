import Link from "next/link";
import { siteConfig } from "@/config/site";
import { footerNav as nav } from "@/config/navigation";
import { Mail, ArrowUpRight } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-line-800)] bg-[var(--color-bg-950)] pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <Link href="/" className="mb-4 inline-block">
              <div className="h-12 w-12 bg-black rounded-sm flex items-center justify-center">
                {/* Temp logo */}
                <span className="font-[family-name:var(--font-display)] font-bold text-xl text-white">ZE</span>
              </div>
            </Link>
            <h2 className="text-xl font-[family-name:var(--font-heading)] font-bold uppercase tracking-wide mb-2">
              {siteConfig.name}
            </h2>
            <p className="text-[var(--color-text-muted)] text-sm mb-6 max-w-sm leading-relaxed">
              {siteConfig.tagline}
            </p>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-faint)]">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${siteConfig.email.contact}`} className="hover:text-[var(--color-gold-400)] transition-colors">
                {siteConfig.email.contact}
              </a>
            </div>
          </div>

          {/* Navigation Columns */}
          {nav.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 uppercase tracking-wider text-sm">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors inline-flex items-center gap-1 group"
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                    >
                      {link.label}
                      {link.external && (
                        <ArrowUpRight className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--color-line-800)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--color-text-faint)] text-center md:text-left">
            &copy; {currentYear} {siteConfig.name}. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-sm text-[var(--color-text-faint)]">
            <Link href="/legal/terms" className="hover:text-[var(--color-text-primary)] transition-colors">Terms</Link>
            <span>&middot;</span>
            <Link href="/legal/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
