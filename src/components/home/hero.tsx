"use client";

import { useRef } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ChevronRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { duration, ease, variants } from "@/lib/motion";

/**
 * Hero section for the home page.
 * Uses Framer Motion for parallax scrolling and entrance animations.
 */
export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20"
    >
      {/* Background with Parallax */}
      <m.div
        style={{ y, opacity }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-900)]/40 via-[var(--color-bg-900)]/60 to-[var(--color-bg-900)] z-10" />
        
        {/* We'll use a placeholder gradient since we don't have the final hero image yet. 
            Once we extract the high-res assets, we will replace this with the actual image. */}
        <div className="absolute inset-0 bg-[var(--color-bg-800)]">
          <div className="absolute inset-0 opacity-20" 
               style={{
                 backgroundImage: "radial-gradient(circle at 50% 50%, var(--color-gold-700) 0%, transparent 50%)"
               }} 
          />
        </div>
      </m.div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 md:px-6">
        <m.div
          variants={variants.container}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center"
        >
          <m.div variants={variants.fadeUp} className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-gold-600)] bg-[var(--gold-tint-sm)] text-sm font-medium text-[var(--color-gold-400)] uppercase tracking-wider font-[family-name:var(--font-heading)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-gold-500)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-gold-500)]"></span>
              </span>
              Season 4 Registrations Open
            </span>
          </m.div>

          <m.h1
            variants={variants.fadeUp}
            className="text-5xl md:text-7xl lg:text-8xl font-[family-name:var(--font-display)] font-bold tracking-tight mb-8"
          >
            FORGED IN <span className="gold-text-gradient">OBSIDIAN</span>
          </m.h1>

          <m.p
            variants={variants.fadeUp}
            className="text-lg md:text-xl text-[var(--color-text-muted)] mb-10 max-w-2xl mx-auto font-[family-name:var(--font-body)] leading-relaxed"
          >
            Pakistan's premier competitive gaming organization. Compete in elite tournaments, track your rankings, and forge your legacy.
          </m.p>

          <m.div
            variants={variants.fadeUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/tournaments">
              <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg">
                Join a Tournament
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-lg"
                iconRight={<ChevronRight className="h-5 w-5" />}
              >
                Our Story
              </Button>
            </Link>
          </m.div>
        </m.div>
      </div>

      {/* Scroll indicator */}
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: duration.slow }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block"
      >
        <m.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-[var(--color-text-faint)]"
        >
          <ArrowDown className="h-6 w-6" />
        </m.div>
      </m.div>
    </section>
  );
}
