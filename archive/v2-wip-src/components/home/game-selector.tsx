"use client";

import { useState } from "react";
import { m } from "framer-motion";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { siteConfig, type GameSlug } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const gameDetails: Record<GameSlug, { description: string; stat: string }> = {
  valorant: {
    description: "Tactical 5v5 character-based shooter. Precision gunplay meets unique agent abilities.",
    stat: "150+ Teams Active",
  },
  freefire: {
    description: "Fast-paced battle royale. Survive, adapt, and outlast 49 other players.",
    stat: "500+ Players Registered",
  },
  pubgm: {
    description: "The ultimate battle royale experience. Drop in, gear up, and claim the chicken dinner.",
    stat: "PKR 2M+ Prize Pool Awarded",
  },
};

/**
 * Game Selector section for the Home page.
 * Allows users to hover/click on games to see details and navigate to tournaments.
 */
export function GameSelector() {
  const [activeGame, setActiveGame] = useState<GameSlug>("valorant");

  return (
    <section className="py-24 bg-[var(--color-bg-950)] relative overflow-hidden">
      {/* Background accent matching active game */}
      <div 
        className="absolute top-0 right-0 w-[800px] h-[800px] rounded-full blur-[120px] opacity-10 transition-colors duration-700 pointer-events-none translate-x-1/3 -translate-y-1/3"
        style={{ backgroundColor: siteConfig.games.find(g => g.slug === activeGame)?.accent }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold-500)] mb-3">
              Supported Titles
            </h2>
            <h3 className="text-3xl md:text-5xl font-[family-name:var(--font-heading)] font-bold uppercase">
              Choose Your <span className="text-[var(--color-text-faint)]">Battleground</span>
            </h3>
          </div>
          <Link href="/tournaments">
            <Button variant="ghost">
              View All Tournaments
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 min-h-[400px]">
          {/* Game List */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {siteConfig.games.map((game) => {
              const isActive = activeGame === game.slug;
              return (
                <button
                  key={game.slug}
                  onClick={() => setActiveGame(game.slug)}
                  onMouseEnter={() => setActiveGame(game.slug)}
                  className={cn(
                    "group relative flex items-center justify-between p-6 rounded-[var(--radius-lg)] text-left transition-all duration-300",
                    "border border-[var(--color-line-800)]",
                    isActive
                      ? "bg-[var(--color-bg-800)] shadow-xl"
                      : "bg-transparent hover:bg-[var(--color-bg-900)]"
                  )}
                >
                  <div className="flex items-center gap-6 z-10">
                    {/* Abstract Game Icon Placeholder */}
                    <div 
                      className={cn(
                        "w-1 h-12 rounded-full transition-colors duration-300",
                        isActive ? "bg-current" : "bg-[var(--color-line-600)] group-hover:bg-[var(--color-text-faint)]"
                      )}
                      style={{ color: isActive ? game.accent : undefined }}
                    />
                    <div>
                      <h4 className={cn(
                        "text-2xl font-[family-name:var(--font-heading)] font-bold uppercase transition-colors duration-300",
                        isActive ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]"
                      )}>
                        {game.name}
                      </h4>
                      <p className="text-sm font-[family-name:var(--font-mono)] text-[var(--color-text-faint)] mt-1">
                        {gameDetails[game.slug].stat}
                      </p>
                    </div>
                  </div>

                  <ChevronRight 
                    className={cn(
                      "h-6 w-6 transition-all duration-300 z-10",
                      isActive ? "text-[var(--color-text-primary)] translate-x-0 opacity-100" : "text-[var(--color-text-faint)] -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-50"
                    )}
                  />
                  
                  {isActive && (
                    <m.div
                      layoutId="game-active-bg"
                      className="absolute inset-0 rounded-[var(--radius-lg)] border border-[var(--color-line-700)] bg-[var(--color-bg-800)]"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      style={{ zIndex: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Game Display */}
          <div className="lg:col-span-7 relative">
            {siteConfig.games.map((game) => (
              <div
                key={`display-${game.slug}`}
                className={cn(
                  "absolute inset-0 transition-opacity duration-500 flex flex-col justify-end p-8 rounded-[var(--radius-xl)] overflow-hidden border border-[var(--color-line-800)]",
                  activeGame === game.slug ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                )}
              >
                {/* Background Image Placeholder */}
                <div className="absolute inset-0 bg-[var(--color-bg-800)]">
                   <div 
                     className="absolute inset-0 opacity-20 transition-opacity duration-700" 
                     style={{
                       backgroundImage: `radial-gradient(circle at 70% 30%, ${game.accent} 0%, transparent 60%)`
                     }} 
                   />
                </div>
                
                {/* Gradient Overlay for Text Legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-950)] via-[var(--color-bg-900)]/80 to-transparent" />

                <div className="relative z-10 max-w-xl">
                  <h3 className="text-4xl font-[family-name:var(--font-display)] font-bold mb-4" style={{ color: game.accent }}>
                    {game.name}
                  </h3>
                  <p className="text-lg text-[var(--color-text-muted)] mb-8 leading-relaxed">
                    {gameDetails[game.slug].description}
                  </p>
                  <Link href={`/tournaments?game=${game.slug}`}>
                    <Button 
                      className="w-full sm:w-auto"
                      style={{
                        backgroundColor: game.accent,
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                        border: "none",
                        boxShadow: `0 0 20px ${game.accent}40`
                      }}
                    >
                      View {game.name} Tournaments
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
