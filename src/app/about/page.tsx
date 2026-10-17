import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, Shield, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Zenith Esports, our history, mission, and the team driving Pakistan's premier competitive gaming organization.",
};

const timeline = [
  {
    year: "2020",
    title: "The Genesis",
    description: "Founded by a group of passionate gamers with a vision to professionalize esports in Pakistan.",
  },
  {
    year: "2022",
    title: "Zenith Cup Inauguration",
    description: "Launched our flagship tournament series, drawing over 500 teams nationwide.",
  },
  {
    year: "2024",
    title: "Mark47 Production",
    description: "Established our in-house broadcast division, setting new standards for esports production quality.",
  },
  {
    year: "2026",
    title: "A New Era",
    description: "Rebranded and expanded into multiple titles, cementing our position as the premier esports organization.",
  },
];

const values = [
  {
    title: "Competitive Integrity",
    description: "We uphold the highest standards of fairness and sportsmanship in all our events.",
    icon: Shield,
  },
  {
    title: "Community First",
    description: "Built for gamers, by gamers. The community is at the heart of everything we do.",
    icon: Users,
  },
  {
    title: "Relentless Excellence",
    description: "We constantly push boundaries in production, competition, and player experience.",
    icon: Trophy,
  },
  {
    title: "Innovation",
    description: "Always adapting, always improving. We embrace new technologies and formats.",
    icon: Target,
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-20 bg-[var(--color-bg-950)] border-b border-[var(--color-line-800)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/assets/about-bg.jpg')] bg-cover bg-center opacity-10 grayscale mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-950)] to-transparent" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Breadcrumb 
            items={[{ label: "About Us" }]} 
            className="mb-8"
          />
          <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold mb-6 text-white uppercase tracking-tight">
            Forged in <span className="text-[var(--color-gold-500)]">Obsidian</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl font-[family-name:var(--font-body)] leading-relaxed">
            We are Zenith Esports. More than just a tournament organizer, we are the architects of Pakistan's competitive gaming future.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-[var(--color-bg-900)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
            <div>
              <h2 className="text-3xl font-[family-name:var(--font-heading)] font-bold uppercase mb-6 text-[var(--color-gold-500)]">
                Our Mission
              </h2>
              <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
                To elevate the esports ecosystem in Pakistan by providing world-class competitive platforms, nurturing local talent, and delivering unparalleled broadcast experiences. We aim to bridge the gap between amateur passion and professional excellence.
              </p>
            </div>
            <div>
              <h2 className="text-3xl font-[family-name:var(--font-heading)] font-bold uppercase mb-6 text-[var(--color-gold-500)]">
                Our Vision
              </h2>
              <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
                To be the undisputed pinnacle of esports in South Asia, where every aspiring gamer dreams of competing, and where the world looks to witness the next generation of esports legends being born.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-[var(--color-bg-950)] border-y border-[var(--color-line-800)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold-500)] mb-3">
              What Drives Us
            </h2>
            <h3 className="text-3xl md:text-5xl font-[family-name:var(--font-heading)] font-bold uppercase">
              Core <span className="text-[var(--color-text-faint)]">Values</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <Card key={value.title} className="bg-[var(--color-bg-900)] border-[var(--color-line-800)] hover:border-[var(--color-gold-600)] transition-colors group">
                  <CardContent className="pt-8 text-center flex flex-col items-center">
                    <div className="mb-6 p-4 rounded-full bg-[var(--color-bg-800)] group-hover:bg-[var(--gold-tint-sm)] transition-colors">
                      <Icon className="h-8 w-8 text-[var(--color-gold-500)]" />
                    </div>
                    <h4 className="text-xl font-bold font-[family-name:var(--font-heading)] uppercase mb-4 text-[var(--color-text-primary)]">
                      {value.title}
                    </h4>
                    <p className="text-[var(--color-text-muted)] text-sm">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-[var(--color-bg-900)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-heading)] font-bold uppercase mb-16 text-center">
              The <span className="text-[var(--color-gold-500)]">Journey</span>
            </h2>
            
            <div className="relative border-l-2 border-[var(--color-line-700)] ml-4 md:ml-0 md:left-1/2 md:-translate-x-[1px] space-y-12">
              {timeline.map((item, index) => (
                <div key={item.year} className="relative flex flex-col md:flex-row items-center md:justify-between w-full">
                  <div className={`md:w-[calc(50%-2rem)] w-full pl-8 md:pl-0 ${index % 2 === 0 ? 'md:text-right' : 'md:text-left md:ml-auto'}`}>
                    <span className="block text-xl font-[family-name:var(--font-display)] font-bold text-[var(--color-gold-500)] mb-2">
                      {item.year}
                    </span>
                    <h4 className="text-xl font-bold font-[family-name:var(--font-heading)] uppercase mb-3 text-[var(--color-text-primary)]">
                      {item.title}
                    </h4>
                    <p className="text-[var(--color-text-muted)]">
                      {item.description}
                    </p>
                  </div>
                  
                  {/* Timeline Dot */}
                  <div className="absolute left-0 md:left-1/2 -translate-x-[5px] md:-translate-x-1/2 top-1 h-3 w-3 rounded-full bg-[var(--color-gold-500)] ring-4 ring-[var(--color-bg-900)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
