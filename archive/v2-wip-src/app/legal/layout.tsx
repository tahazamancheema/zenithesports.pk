import type { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/breadcrumb";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-bg-950)]">
      {/* Shared Header for all legal pages */}
      <section className="pt-24 pb-8 md:pt-32 md:pb-12 border-b border-[var(--color-line-800)] relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Breadcrumb 
            items={[{ label: "Legal" }]} 
            className="mb-8"
          />
          <h1 className="text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold mb-4 text-white uppercase tracking-tight">
            Legal & <span className="text-[var(--color-gold-500)]">Policies</span>
          </h1>
          <p className="text-sm md:text-base text-[var(--color-text-muted)] font-[family-name:var(--font-body)]">
            Please read these documents carefully before using Zenith Esports services.
          </p>
        </div>
      </section>

      <section className="py-12 md:py-20 flex-1">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Sidebar Navigation */}
            <aside className="w-full lg:w-64 shrink-0">
              <nav className="sticky top-28 flex flex-col gap-2">
                <Link href="/legal/terms" className="px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[var(--color-bg-900)] text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors">
                  Terms of Service
                </Link>
                <Link href="/legal/privacy" className="px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[var(--color-bg-900)] text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/legal/refunds" className="px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[var(--color-bg-900)] text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors">
                  Refund Policy
                </Link>
                <Link href="/legal/rules" className="px-4 py-2.5 rounded-md text-sm font-medium hover:bg-[var(--color-bg-900)] text-[var(--color-text-muted)] hover:text-[var(--color-gold-400)] transition-colors">
                  Tournament Rules
                </Link>
              </nav>
            </aside>

            {/* Content Area */}
            <main className="flex-1 bg-[var(--color-bg-900)] border border-[var(--color-line-800)] rounded-[var(--radius-xl)] p-8 md:p-12 prose prose-invert prose-gold max-w-4xl">
              {children}
            </main>
            
          </div>
        </div>
      </section>
    </div>
  );
}
