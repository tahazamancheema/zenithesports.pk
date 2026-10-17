import type { Metadata } from "next";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Partners & Sponsors",
  description: "The visionary brands that power Zenith Esports and the competitive gaming ecosystem in Pakistan.",
};

const partners = [
  {
    id: "p1",
    name: "TechGear",
    tier: "Title Sponsor",
    desc: "Official peripheral and hardware partner powering our pro rosters and LAN events.",
  },
  {
    id: "p2",
    name: "EnergyX",
    tier: "Beverage Partner",
    desc: "Fueling our players and keeping the energy high during grueling tournament brackets.",
  },
  {
    id: "p3",
    name: "HyperNet",
    tier: "Connectivity Partner",
    desc: "Providing the ultra-low latency fiber infrastructure critical for competitive integrity.",
  },
  {
    id: "p4",
    name: "ApparelCo",
    tier: "Apparel Partner",
    desc: "Designing and manufacturing the official Zenith Esports jerseys and merchandise line.",
  },
];

export default function PartnersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Page Header */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-20 bg-[var(--color-bg-950)] border-b border-[var(--color-line-800)] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-950)] to-[var(--color-bg-900)]" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <Breadcrumb 
            items={[{ label: "Partners" }]} 
            className="mb-8"
          />
          <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-display)] font-bold mb-6 text-white uppercase tracking-tight">
            Our <span className="text-[var(--color-gold-500)]">Partners</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl font-[family-name:var(--font-body)] leading-relaxed">
            The visionary brands that empower us to push the boundaries of competitive gaming and esports production in Pakistan.
          </p>
        </div>
      </section>

      {/* Partners Grid */}
      <section className="py-20 bg-[var(--color-bg-900)]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {partners.map((partner) => (
              <Card key={partner.id} className="bg-[var(--color-bg-800)] border-[var(--color-line-700)] overflow-hidden flex flex-col sm:flex-row items-center sm:items-stretch text-center sm:text-left">
                {/* Logo Placeholder */}
                <div className="w-full sm:w-1/3 aspect-square sm:aspect-auto bg-[var(--color-bg-950)] flex items-center justify-center p-8 border-b sm:border-b-0 sm:border-r border-[var(--color-line-800)]">
                  <span className="text-3xl font-[family-name:var(--font-display)] font-bold text-[var(--color-text-faint)]">
                    {partner.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                
                <CardContent className="p-6 sm:p-8 flex-1 flex flex-col justify-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-gold-500)] mb-2">
                    {partner.tier}
                  </span>
                  <h3 className="text-2xl font-bold font-[family-name:var(--font-heading)] uppercase text-[var(--color-text-primary)] mb-3">
                    {partner.name}
                  </h3>
                  <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                    {partner.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership CTA */}
      <section className="py-24 bg-[var(--color-bg-950)] border-t border-[var(--color-line-800)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-bg-950)]" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-display)] font-bold uppercase mb-6">
            Join the <span className="text-[var(--color-gold-500)]">Legacy</span>
          </h2>
          <p className="text-lg text-[var(--color-text-muted)] mb-10 leading-relaxed">
            Align your brand with the most passionate and rapidly growing demographic in Pakistan. We offer bespoke integration across our tournaments, rosters, and Mark47 broadcasts.
          </p>
          <a href="mailto:partnerships@zenithesports.pk">
            <Button size="lg" iconLeft={<Mail className="h-4 w-4" />}>
              Contact Partnerships
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
