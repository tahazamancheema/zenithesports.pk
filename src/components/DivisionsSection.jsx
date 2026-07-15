import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Crosshair, Flame, Target, ArrowRight, Trophy, Radio } from 'lucide-react';
import { GAME_LIST, getGame } from '../config/games';
import { useTournaments } from '../hooks/useTournaments';

const ICONS = { Crosshair, Flame, Target };

/**
 * DivisionsSection — landing-page block presenting all three Zenith
 * divisions, each surfacing its current/upcoming featured tournament.
 */
export default function DivisionsSection() {
  const { tournaments } = useTournaments();

  const featuredBySlug = useMemo(() => {
    const map = {};
    for (const g of GAME_LIST) {
      const forGame = tournaments.filter((t) => getGame(t.game).slug === g.slug);
      map[g.slug] = {
        featured:
          forGame.find((t) => t.status === 'registrations_open') ||
          forGame.find((t) => t.status === 'in_progress') ||
          forGame.find((t) => t.status === 'upcoming') ||
          null,
        total: forGame.length,
      };
    }
    return map;
  }, [tournaments]);

  return (
    <section className="relative bg-[#0a0a0a] border-t border-white/[0.04] overflow-hidden">
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(219,180,98,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(219,180,98,0.5) 1px, transparent 1px)',
        backgroundSize: '70px 70px',
      }} />

      <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-24 relative z-10">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-8 h-[2px] bg-[#dbb462]" />
              <span className="font-label text-[14px] tracking-[0.3em] text-[#dbb462] uppercase">Three Divisions · One Standard</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl text-white tracking-tight uppercase leading-[0.85]">
              Compete In Your <span className="zenith-gradient-text">Arena</span>
            </h2>
          </div>
          <Link to="/games" className="font-label text-[15px] tracking-[0.2em] text-[#dbb462] uppercase flex items-center gap-2 hover:gap-3 transition-all shrink-0">
            Explore All Divisions <ArrowRight size={16} />
          </Link>
        </div>

        {/* Division cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {GAME_LIST.map((g) => {
            const Icon = ICONS[g.icon] || Trophy;
            const { featured, total } = featuredBySlug[g.slug];
            const isLive = featured?.status === 'in_progress';
            const isOpen = featured?.status === 'registrations_open';

            return (
              <div
                key={g.slug}
                className="group relative bg-[#0e0e0e] border border-white/[0.05] hover:border-white/[0.12] transition-all duration-500 flex flex-col overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[3px] z-10" style={{ backgroundColor: g.accent, opacity: 0.55 }} />
                <div
                  className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] opacity-30 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"
                  style={{ backgroundColor: g.accent + '22' }}
                />

                {/* Division head */}
                <div className="relative z-10 p-7 border-b border-white/[0.05]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 flex items-center justify-center border" style={{ borderColor: g.accent + '55', backgroundColor: g.accentSoft }}>
                      <Icon size={22} style={{ color: g.accent }} />
                    </div>
                    <span className="font-label text-[11px] tracking-[0.22em] text-[#d1c5b3] opacity-30 uppercase">
                      {total} {total === 1 ? 'Event' : 'Events'}
                    </span>
                  </div>
                  <h3 className="font-display text-3xl text-white tracking-wide mb-1">{g.name}</h3>
                  <p className="font-body text-sm" style={{ color: g.accent }}>{g.tagline}</p>
                </div>

                {/* Featured event */}
                <div className="relative z-10 p-7 flex-1 flex flex-col">
                  {featured ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        {isLive ? (
                          <span className="flex items-center gap-1.5 font-label text-[11px] tracking-[0.2em] uppercase text-emerald-400">
                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>
                            Live Now
                          </span>
                        ) : isOpen ? (
                          <span className="font-label text-[11px] tracking-[0.2em] uppercase" style={{ color: g.accent }}>● Registrations Open</span>
                        ) : (
                          <span className="font-label text-[11px] tracking-[0.2em] uppercase text-blue-400">◷ Upcoming</span>
                        )}
                      </div>
                      <Link to={`/tournaments/${featured.id}`} className="font-display text-2xl text-white leading-tight tracking-wide mb-2 hover:text-[#dbb462] transition-colors line-clamp-2">
                        {featured.title}
                      </Link>
                      {featured.prize_pool && (
                        <p className="font-body text-sm text-[#d1c5b3] opacity-50 mb-6">
                          Prize Pool · <span style={{ color: g.accent }}>PKR {Number(featured.prize_pool).toLocaleString('en-PK')}</span>
                        </p>
                      )}
                      <div className="mt-auto flex gap-2">
                        {isOpen && (
                          <Link
                            to={`/register/${featured.id}`}
                            className="flex-1 text-center font-display text-lg tracking-widest uppercase py-3 transition-all"
                            style={{ backgroundColor: g.accentSoft, border: `1px solid ${g.accent}44`, color: g.accent }}
                          >
                            Register
                          </Link>
                        )}
                        <Link
                          to={`/games/${g.slug}`}
                          className="flex-1 text-center font-label text-[14px] tracking-[0.15em] uppercase py-3 border border-white/[0.06] text-[#d1c5b3] opacity-60 hover:opacity-100 transition-all"
                        >
                          Division Hub
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                        <Radio size={28} style={{ color: g.accent, opacity: 0.2 }} className="mb-3" />
                        <p className="font-display text-xl text-white opacity-20 mb-1">No Active Events</p>
                        <p className="font-body text-sm text-[#d1c5b3] opacity-35">New {g.short} events coming soon</p>
                      </div>
                      <Link
                        to={`/games/${g.slug}`}
                        className="mt-auto text-center font-label text-[14px] tracking-[0.15em] uppercase py-3 border border-white/[0.06] text-[#d1c5b3] opacity-60 hover:opacity-100 transition-all"
                      >
                        Visit Division Hub
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
