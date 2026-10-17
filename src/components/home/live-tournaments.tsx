"use client";

import { m } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Users, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { variants } from "@/lib/motion";

// Mock data for now
const mockTournaments = [
  {
    id: "zenith-cup-s4",
    title: "Zenith Cup Season 4",
    game: "valorant",
    status: "Registration Open",
    prize: "PKR 1,000,000",
    teams: "128 Slots",
    date: "Starts Nov 15",
    color: "var(--color-valorant)",
  },
  {
    id: "survivor-series",
    title: "Survivor Series 2026",
    game: "freefire",
    status: "Ongoing",
    prize: "PKR 500,000",
    teams: "256 Teams",
    date: "Finals Nov 20",
    color: "var(--color-freefire)",
  },
  {
    id: "pubg-invitational",
    title: "PUBGM Pro Invitational",
    game: "pubgm",
    status: "Completed",
    prize: "PKR 2,000,000",
    teams: "16 Pro Teams",
    date: "Oct 1 - Oct 5",
    color: "var(--color-pubgm)",
  },
];

/**
 * Live Tournaments section for the Home page.
 */
export function LiveTournaments() {
  return (
    <section className="py-24 bg-[var(--color-bg-900)] border-t border-[var(--color-line-800)] relative">
      <div className="container mx-auto px-4 md:px-6">
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={variants.container}
          className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6"
        >
          <div className="max-w-2xl">
            <m.h2 variants={variants.fadeUp} className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold-500)] mb-3">
              Compete & Conquer
            </m.h2>
            <m.h3 variants={variants.fadeUp} className="text-3xl md:text-5xl font-[family-name:var(--font-heading)] font-bold uppercase">
              Featured <span className="text-[var(--color-text-faint)]">Events</span>
            </m.h3>
          </div>
          <m.div variants={variants.fadeUp}>
            <Link href="/tournaments">
              <Button variant="ghost" iconRight={<ArrowRight className="h-4 w-4" />}>
                View Schedule
              </Button>
            </Link>
          </m.div>
        </m.div>

        <m.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={variants.container}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {mockTournaments.map((tournament) => (
            <m.div key={tournament.id} variants={variants.fadeUp}>
              <Card hover accentColor={tournament.color} className="h-full flex flex-col group">
                <CardContent className="flex-1 space-y-4 pt-6">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant={tournament.game as any} className="uppercase tracking-wider">
                      {tournament.game === "pubgm" ? "PUBG Mobile" : tournament.game.replace("-", " ")}
                    </Badge>
                    <Badge variant={
                      tournament.status.includes("Registration") ? "gold" : 
                      tournament.status === "Ongoing" ? "success" : "default"
                    } pulse={tournament.status === "Ongoing"}>
                      {tournament.status}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-2xl font-bold font-[family-name:var(--font-heading)] uppercase mb-2 group-hover:text-[var(--color-gold-400)] transition-colors line-clamp-2">
                      {tournament.title}
                    </h4>
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t border-[var(--color-line-800)]">
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                      <Trophy className="h-4 w-4 text-[var(--color-gold-500)]" />
                      <span className="font-semibold text-[var(--color-text-primary)]">{tournament.prize}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                      <Users className="h-4 w-4" />
                      <span>{tournament.teams}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
                      <Calendar className="h-4 w-4" />
                      <span>{tournament.date}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 pb-6 px-6 mt-4">
                  <Link href={`/tournaments/${tournament.id}`} className="w-full">
                    <Button variant={tournament.status.includes("Registration") ? "primary" : "secondary"} className="w-full">
                      {tournament.status.includes("Registration") ? "Register Now" : "View Details"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
