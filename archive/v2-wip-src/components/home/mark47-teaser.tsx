"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duration, ease, variants } from "@/lib/motion";

/**
 * Mark47 Production Teaser for the Home page.
 */
export function Mark47Teaser() {
  return (
    <section className="py-24 bg-black relative overflow-hidden flex items-center min-h-[70vh]">
      {/* Background Image / Video Placeholder */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/assets/mark47-bg.jpg')] bg-cover bg-center opacity-40 mix-blend-luminosity grayscale" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
        
        {/* Film grain effect specifically for Mark47 */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-2xl">
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={variants.container}
          >
            <m.div variants={variants.slideInLeft} className="mb-6 flex items-center gap-3">
              <div className="h-px w-12 bg-[var(--color-gold-500)]" />
              <span className="text-sm font-semibold uppercase tracking-widest text-[var(--color-gold-500)]">
                In-House Production
              </span>
            </m.div>

            <m.h2 
              variants={variants.fadeUp}
              className="text-5xl md:text-7xl font-[family-name:var(--font-display)] font-bold text-white mb-6 uppercase tracking-tight leading-none"
            >
              Mark<span className="text-[var(--color-gold-500)]">47</span>
            </m.h2>

            <m.p 
              variants={variants.fadeUp}
              className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed font-[family-name:var(--font-body)]"
            >
              Industry-leading broadcast production, bespoke graphics packages, and comprehensive tournament management. We don't just host tournaments; we create spectacles.
            </m.p>

            <m.div 
              variants={variants.fadeUp}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/mark47">
                <Button size="lg" className="w-full sm:w-auto font-bold uppercase tracking-wider h-14 px-8">
                  Discover Mark47
                </Button>
              </Link>
              <Link href="/mark47/enquire">
                <Button 
                  variant="ghost" 
                  size="lg" 
                  className="w-full sm:w-auto h-14 px-8 text-white border-white/20 hover:bg-white/10"
                  iconLeft={<PlayCircle className="h-5 w-5" />}
                >
                  View Showreel
                </Button>
              </Link>
            </m.div>
          </m.div>
        </div>
      </div>
    </section>
  );
}
