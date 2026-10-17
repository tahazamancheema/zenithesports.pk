"use client";

import { m } from "framer-motion";
import { Users, Trophy, Target, Shield } from "lucide-react";
import { variants } from "@/lib/motion";

const stats = [
  {
    id: "teams",
    value: "2,500+",
    label: "Registered Teams",
    icon: Users,
  },
  {
    id: "prize",
    value: "PKR 5M+",
    label: "Prize Pool Awarded",
    icon: Trophy,
  },
  {
    id: "tournaments",
    value: "50+",
    label: "Tournaments Hosted",
    icon: Target,
  },
  {
    id: "years",
    value: "4",
    label: "Years of Excellence",
    icon: Shield,
  },
];

/**
 * Statistics row for the Home page.
 * Displays key metrics with icons.
 */
export function StatsRow() {
  return (
    <section className="py-20 bg-[var(--color-bg-900)] border-y border-[var(--color-line-800)] relative z-10">
      <div className="container mx-auto px-4 md:px-6">
        <m.div 
          variants={variants.container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <m.div 
                key={stat.id} 
                variants={variants.fadeUp}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-4 p-4 rounded-full bg-[var(--color-bg-800)] border border-[var(--color-line-700)] shadow-[inset_0_0_20px_var(--gold-tint)]">
                  <Icon className="h-6 w-6 text-[var(--color-gold-500)]" />
                </div>
                <h4 className="text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-[var(--color-text-primary)] mb-2">
                  {stat.value}
                </h4>
                <p className="text-sm md:text-base font-semibold uppercase tracking-wider text-[var(--color-text-muted)] font-[family-name:var(--font-body)]">
                  {stat.label}
                </p>
              </m.div>
            );
          })}
        </m.div>
      </div>
    </section>
  );
}
