import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Flame, Target, ArrowRight, Trophy } from 'lucide-react';
import { GAME_LIST, getGame } from '../config/games';
import { useTournaments } from '../hooks/useTournaments';

const ICONS = { Crosshair, Flame, Target };

export default function GamesIndexPage() {
  const { tournaments } = useTournaments();

  const statsBySlug = useMemo(() => {
    const s = {};
    for (const g of GAME_LIST) s[g.slug] = { total: 0, open: 0 };
    tournaments.forEach((t) => {
      const slug = getGame(t.game).slug;
      if (!s[slug]) return;
      s[slug].total += 1;
      if (t.status === 'registrations_open') s[slug].open += 1;
    });
    return s;
  }, [tournaments]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] animate-page-enter overflow-x-hidden">
      <section className="relative pt-40 pb-20 px-6 lg:px-16 border-b border-white/[0.05] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#dbb462]/[0.06] blur-[180px] pointer-events-none rounded-full" />
        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-[2px] bg-[#dbb462]" />
            <span className="font-label text-[15px] tracking-[0.3em] text-[#dbb462] uppercase">Our Divisions</span>
          </div>
          <h1 className="font-display text-7xl md:text-[9rem] leading-[0.82] tracking-tight uppercase mb-6">
            <span className="text-white">CHOOSE YOUR </span>
            <span className="zenith-gradient-text">BATTLEFIELD</span>
          </h1>
          <p className="font-body text-[#d1c5b3] opacity-45 max-w-2xl text-lg leading-relaxed">
            Zenith Esports fields three competitive divisions across Pakistan's biggest titles.
            Each has its own circuit, rules, and community. Pick your game and step onto the grid.
          </p>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-16 pb-32">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-6">
          {GAME_LIST.map((g) => {
            const Icon = ICONS[g.icon] || Trophy;
            const st = statsBySlug[g.slug] || { total: 0, open: 0 };
            return (
              <Link
                key={g.slug}
                to={`/games/${g.slug}`}
                className="group relative bg-[#0e0e0e] border border-white/[0.05] overflow-hidden flex flex-col p-8 min-h-[340px] transition-all duration-500 hover:border-white/[0.12]"
              >
                <div
                  className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-[90px] opacity-40 group-hover:opacity-80 transition-opacity duration-700 pointer-events-none"
                  style={{ backgroundColor: g.accent + '22' }}
                />
                <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ backgroundColor: g.accent, opacity: 0.6 }} />

                <div className="relative z-10 flex items-center justify-between mb-8">
                  <div className="w-14 h-14 flex items-center justify-center border" style={{ borderColor: g.accent + '55', backgroundColor: g.accentSoft }}>
                    <Icon size={26} style={{ color: g.accent }} />
                  </div>
                  {st.open > 0 && (
                    <span className="font-label text-[11px] tracking-[0.2em] uppercase px-3 py-1.5 border" style={{ color: g.accent, borderColor: g.accent + '44', backgroundColor: g.accentSoft }}>
                      {st.open} Open
                    </span>
                  )}
                </div>

                <div className="relative z-10 mt-auto">
                  <h2 className="font-display text-4xl text-white tracking-wide mb-2">{g.name}</h2>
                  <p className="font-body text-base mb-4" style={{ color: g.accent }}>{g.tagline}</p>
                  <p className="font-body text-sm text-[#d1c5b3] opacity-45 leading-relaxed mb-6 line-clamp-3">{g.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-label text-[12px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase">
                      {st.total} {st.total === 1 ? 'Event' : 'Events'}
                    </span>
                    <span className="font-label text-[14px] tracking-[0.2em] uppercase flex items-center gap-2 group-hover:gap-3 transition-all" style={{ color: g.accent }}>
                      Enter <ArrowRight size={15} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
