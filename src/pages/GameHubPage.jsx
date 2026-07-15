import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  Crosshair, Flame, Target, ChevronRight, Trophy, Users, Zap,
  ArrowRight, ShieldCheck, Clock,
} from 'lucide-react';
import { getGameBySlug, GAME_LIST, getGame } from '../config/games';
import { useTournaments } from '../hooks/useTournaments';
import { useSupabaseDB } from '../hooks/useSupabaseDB';
import { useAuth } from '../hooks/useAuth';
import TournamentCard from '../components/TournamentCard';

const ICONS = { Crosshair, Flame, Target };

export default function GameHubPage() {
  const { slug } = useParams();
  const game = getGameBySlug(slug);
  const { user } = useAuth();
  const { tournaments, loading } = useTournaments();
  const { data: allRegistrations } = useSupabaseDB('registrations_public');

  const { regCounts, userRegStatuses } = useMemo(() => {
    const counts = {};
    const statuses = {};
    allRegistrations.forEach((r) => {
      if (r.status === 'approved') counts[r.tournament_id] = (counts[r.tournament_id] || 0) + 1;
      if (user?.id && r.user_id === user.id) statuses[r.tournament_id] = r.status;
    });
    return { regCounts: counts, userRegStatuses: statuses };
  }, [allRegistrations, user?.id]);

  const gameTournaments = useMemo(() => {
    if (!game) return [];
    return tournaments.filter((t) => getGame(t.game).slug === game.slug);
  }, [tournaments, game]);

  if (!game) return <Navigate to="/games" replace />;

  const Icon = ICONS[game.icon] || Trophy;
  const featured =
    gameTournaments.find((t) => t.status === 'registrations_open') ||
    gameTournaments.find((t) => t.status === 'in_progress') ||
    gameTournaments.find((t) => t.status === 'upcoming') ||
    null;

  const openCount = gameTournaments.filter((t) => t.status === 'registrations_open').length;
  const liveCount = gameTournaments.filter((t) => t.status === 'in_progress').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] animate-page-enter overflow-x-hidden">

      {/* ═══ Division Hero ═══ */}
      <section className="relative pt-40 pb-24 px-6 lg:px-16 overflow-hidden border-b border-white/[0.05]">
        {/* Division-tinted glows */}
        <div
          className="absolute top-0 left-1/4 w-[700px] h-[500px] blur-[180px] pointer-events-none rounded-full"
          style={{ backgroundColor: game.accent + '18' }}
        />
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
          backgroundImage: `linear-gradient(${game.accent}55 1px, transparent 1px), linear-gradient(90deg, ${game.accent}55 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
        }} />

        <div className="relative z-10 container mx-auto max-w-7xl">
          {/* Division switcher */}
          <div className="flex flex-wrap items-center gap-2 mb-10">
            {GAME_LIST.map((g) => (
              <Link
                key={g.slug}
                to={`/games/${g.slug}`}
                className={`font-label text-[13px] tracking-[0.2em] uppercase px-4 py-2 border transition-all ${
                  g.slug === game.slug
                    ? 'text-black'
                    : 'text-[#d1c5b3] opacity-60 hover:opacity-100 border-white/10'
                }`}
                style={g.slug === game.slug
                  ? { backgroundColor: g.accent, borderColor: g.accent }
                  : undefined}
              >
                {g.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 flex items-center justify-center border" style={{ borderColor: game.accent + '55', backgroundColor: game.accentSoft }}>
              <Icon size={22} style={{ color: game.accent }} />
            </div>
            <span className="font-label text-[15px] tracking-[0.3em] uppercase" style={{ color: game.accent }}>
              Zenith Division
            </span>
          </div>

          <h1 className="font-display text-7xl md:text-[10rem] leading-[0.82] tracking-tight uppercase mb-6">
            <span className="text-white">{game.name}</span>
          </h1>
          <p className="font-body text-lg md:text-2xl max-w-2xl leading-relaxed mb-4" style={{ color: game.accent }}>
            {game.tagline}
          </p>
          <p className="font-body text-[#d1c5b3] opacity-45 max-w-2xl text-base md:text-lg leading-relaxed">
            {game.description}
          </p>

          {/* Division stat strip */}
          <div className="grid grid-cols-3 gap-[1px] bg-white/[0.05] max-w-xl mt-12">
            {[
              { label: 'Total Events', value: gameTournaments.length },
              { label: 'Open Now', value: openCount },
              { label: 'Live', value: liveCount },
            ].map((s) => (
              <div key={s.label} className="bg-[#0e0e0e] px-6 py-5">
                <p className="font-label text-[11px] tracking-[0.25em] text-[#d1c5b3] opacity-35 uppercase mb-1">{s.label}</p>
                <p className="font-display text-3xl leading-none" style={{ color: game.accent }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Featured Tournament ═══ */}
      {featured && (
        <section className="relative py-16 px-6 lg:px-16 border-b border-white/[0.04]">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-[2px]" style={{ backgroundColor: game.accent }} />
              <span className="font-label text-[13px] tracking-[0.3em] uppercase" style={{ color: game.accent }}>
                {featured.status === 'in_progress' ? 'Happening Now' : 'Featured Event'}
              </span>
            </div>
            <div className="max-w-md">
              <TournamentCard
                tournament={featured}
                registrationCount={regCounts[featured.id] || 0}
                userRegistrationStatus={userRegStatuses[featured.id]}
              />
            </div>
          </div>
        </section>
      )}

      {/* ═══ Roster / rules quick facts ═══ */}
      <section className="py-16 px-6 lg:px-16 border-b border-white/[0.04]">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/[0.05]">
          <InfoCard icon={Users} accent={game.accent} title={`${game.roster.teamWord} Size`}
            value={`${game.roster.min}–${game.roster.max} players`}
            note={`${game.roster.requiredCount} required to compete`} />
          <InfoCard icon={ShieldCheck} accent={game.accent} title="Player Verification"
            value={game.playerId.label} note={game.playerId.help} />
          <InfoCard icon={Zap} accent={game.accent} title="Formats"
            value={game.formats.join(' · ')} note={`Default: ${game.defaultFormat}`} />
        </div>
      </section>

      {/* ═══ All division tournaments ═══ */}
      <section className="py-16 px-6 lg:px-16 pb-32">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-display text-4xl md:text-5xl text-white tracking-wide">All {game.short} Events</h2>
            <Link to="/tournaments" className="font-label text-[14px] tracking-[0.2em] uppercase flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity" style={{ color: game.accent }}>
              Browse All <ArrowRight size={15} />
            </Link>
          </div>

          {loading && gameTournaments.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => <div key={i} className="bg-[#0e0e0e] aspect-[3/4] animate-pulse border border-white/5" />)}
            </div>
          ) : gameTournaments.length === 0 ? (
            <div className="text-center py-28 flex flex-col items-center border border-white/[0.05] bg-[#0e0e0e]">
              <Icon size={64} style={{ color: game.accent, opacity: 0.12 }} className="mb-6" />
              <p className="font-display text-4xl text-white opacity-15 mb-3">No {game.short} Events Yet</p>
              <p className="font-label text-[15px] tracking-[0.2em] uppercase opacity-40" style={{ color: game.accent }}>
                Stay tuned — this division is warming up
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {gameTournaments.map((t) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  registrationCount={regCounts[t.id] || 0}
                  userRegistrationStatus={userRegStatuses[t.id]}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ icon: Icon, accent, title, value, note }) {
  return (
    <div className="bg-[#0e0e0e] p-8">
      <Icon size={20} style={{ color: accent }} className="mb-4 opacity-80" />
      <p className="font-label text-[12px] tracking-[0.25em] text-[#d1c5b3] opacity-40 uppercase mb-2">{title}</p>
      <p className="font-display text-2xl text-white tracking-wide mb-2">{value}</p>
      <p className="font-body text-sm text-[#d1c5b3] opacity-45 leading-relaxed">{note}</p>
    </div>
  );
}
