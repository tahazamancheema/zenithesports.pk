import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/config';
import {
  ChevronRight, Shield, Tv, GitBranch, Banknote, ArrowRight,
  Trophy, Youtube, Instagram, MessageCircle, Zap, Target, Flame,
  ChevronDown, Users, Star, TrendingUp,
} from 'lucide-react';
import LiveStatus from '../components/LiveStatus';
import AnnouncementsStrip from '../components/AnnouncementsStrip';
import DivisionsSection from '../components/DivisionsSection';
import TournamentCard from '../components/TournamentCard';
import { useTournaments } from '../hooks/useTournaments';
import { useSupabaseDB } from '../hooks/useSupabaseDB';
import { usePlatformStats } from '../hooks/usePlatformStats';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/ui/StatusBadge';

export default function LandingPage() {
  const { currentTournament, openRegistrations } = useTournaments();
  const { user } = useAuth();
  const platformStats = usePlatformStats();
  const { data: allRegistrations } = useSupabaseDB('registrations_public');

  const { regCounts, userRegStatuses } = React.useMemo(() => {
    const counts = {};
    const statuses = {};
    allRegistrations.forEach((r) => {
      if (r.status === 'approved') counts[r.tournament_id] = (counts[r.tournament_id] || 0) + 1;
      if (user?.id && r.user_id === user.id) statuses[r.tournament_id] = r.status;
    });
    return { regCounts: counts, userRegStatuses: statuses };
  }, [allRegistrations, user?.id]);

  // Direct query for the current user's own registration on the featured
  // tournament (own-row RLS policy on the base table).
  const [myRegStatus, setMyRegStatus] = useState(null);
  useEffect(() => {
    if (!user?.id || !currentTournament?.id) { setMyRegStatus(null); return; }
    supabase
      .from('registrations')
      .select('status')
      .eq('user_id', user.id)
      .eq('tournament_id', currentTournament.id)
      .maybeSingle()
      .then(({ data }) => setMyRegStatus(data?.status ?? null));
  }, [user?.id, currentTournament?.id]);

  const maxTeams    = currentTournament?.max_teams;
  const isUnlimited = !maxTeams || maxTeams === 0;
  const approvedCount = regCounts[currentTournament?.id] || 0;
  const fillPct     = isUnlimited ? 0 : Math.min((approvedCount / maxTeams) * 100, 100);
  const isOpen      = currentTournament?.status === 'registrations_open';
  const isLive      = currentTournament?.status === 'in_progress';

  const prizeFormatted = currentTournament?.prize_pool
    ? `PKR ${Number(currentTournament.prize_pool).toLocaleString('en-PK')}`
    : null;

  return (
    <div className="animate-page-enter bg-[#0a0a0a] overflow-x-hidden">

      {/* ═══════════════════════════════════════════
          HERO — Cinematic Full-Bleed
          ═══════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex flex-col justify-between overflow-hidden">

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/image-3.webp"
            className="w-full h-full object-cover object-center scale-[1.04]"
            style={{ filter: 'saturate(0.55) contrast(1.1) brightness(0.7)', opacity: 0.45 }}
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/75 to-[#0a0a0a]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/95 via-[#0a0a0a]/50 to-transparent" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.018] pointer-events-none z-[1]" style={{
          backgroundImage: 'linear-gradient(rgba(219,180,98,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(219,180,98,0.6) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        {/* Atmospheric glows */}
        <div className="absolute top-0 left-1/4 w-[700px] h-[500px] bg-[#dbb462]/[0.08] blur-[200px] pointer-events-none z-[1] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#c49a3a]/[0.05] blur-[150px] pointer-events-none z-[1] rounded-full" />

        {/* Corner frame accents */}
        <div className="absolute inset-0 z-[2] pointer-events-none">
          <div className="absolute top-32 left-6 lg:left-16 w-12 h-12 border-t-2 border-l-2 border-[#dbb462]/20" />
          <div className="absolute top-32 left-6 lg:left-16 w-3 h-3 bg-[#dbb462]/30" style={{ marginTop: '-1.5px', marginLeft: '-1.5px' }} />
          <div className="absolute bottom-[25%] right-6 lg:right-16 w-12 h-12 border-b-2 border-r-2 border-[#dbb462]/12" />
          {/* Vertical accent line */}
          <div className="absolute left-6 lg:left-16 top-40 bottom-[28%] w-[1px] bg-gradient-to-b from-[#dbb462]/20 via-[#dbb462]/5 to-transparent hidden lg:block" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center pt-36 lg:pt-44 pb-12">
          <div className="container mx-auto max-w-7xl px-6 lg:px-16">

            {/* Top badge row */}
            <div className="flex items-center justify-between mb-10 lg:mb-16">
              <div className="flex items-center gap-3">
                <div className="w-8 h-[1.5px] bg-[#dbb462]" />
                <div className="flex items-center gap-2 px-3 py-1.5 border border-[#dbb462]/20 bg-[#dbb462]/[0.06]">
                  <span className="relative w-1.5 h-1.5 rounded-full bg-[#dbb462] shrink-0">
                    <span className="absolute inset-0 rounded-full bg-[#dbb462] animate-ping opacity-50" />
                  </span>
                  <span className="font-teko text-[#dbb462] text-[12px] tracking-[0.32em] uppercase">Pakistan · PUBG Mobile · Est. 2021</span>
                </div>
              </div>
              <div className="hidden lg:flex flex-col items-end gap-1">
                <ChevronDown size={14} className="text-[#dbb462]/30 animate-bounce" />
                <span className="font-teko text-[9px] tracking-[0.4em] text-[#d1c5b3]/20 uppercase">SCROLL</span>
              </div>
            </div>

            {/* Headline — more structured */}
            <div className="mb-12 lg:mb-14">
              <div className="flex items-baseline gap-3 mb-1">
                <span className="font-teko text-[12px] tracking-[0.4em] text-[#dbb462]/40 uppercase">01 / DEFINE YOUR GAME</span>
              </div>
              <h1 className="font-bebas uppercase select-none tracking-tight">
                <span className="block text-[clamp(5rem,16vw,12rem)] zenith-gradient-text leading-[0.82]"
                  style={{ textShadow: '0 0 160px rgba(219,180,98,0.2)' }}>
                  FORGE YOUR
                </span>
                <span className="block text-[clamp(5rem,16vw,12rem)] text-[#f2f2f2] leading-[0.82]">
                  LEGACY<span className="text-[#dbb462]">.</span>
                </span>
              </h1>
              <div className="mt-5 flex items-center gap-4">
                <div className="w-16 h-[1px] bg-[#dbb462]/30" />
                <span className="font-teko text-[13px] tracking-[0.22em] text-[#d1c5b3]/40 uppercase">Pakistan's Premier Competitive Circuit</span>
              </div>
            </div>

            {/* Body + CTAs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-end">
              <div>
                <p className="font-rajdhani text-[#d1c5b3] text-[19px] leading-relaxed opacity-55 font-medium max-w-lg mb-10">
                  Every squad verified. Every match tracked. Every champion earned. Pakistan's premier esports organization across PUBG Mobile, Free Fire, and Valorant.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to={user ? '/tournaments' : '/auth'}
                    className="btn-obsidian-primary font-bebas text-[20px] px-10 py-5 tracking-[0.18em] inline-flex items-center gap-3 uppercase"
                  >
                    {user ? 'ENTER THE ARENA' : 'CLAIM YOUR SPOT'}
                    <ArrowRight size={20} strokeWidth={2.5} />
                  </Link>
                  <Link
                    to="/games"
                    className="btn-obsidian-ghost font-bebas text-[20px] px-9 py-5 tracking-[0.15em] uppercase"
                  >
                    OUR DIVISIONS
                  </Link>
                </div>
              </div>

              {/* Right: trust signals as a more editorial list */}
              <div className="hidden lg:flex flex-col gap-0 border-l border-white/[0.04] pl-10">
                {[
                  { icon: Shield, label: 'Player Verification',  desc: 'Every Character ID manually checked' },
                  { icon: Target, label: 'Bracket System',       desc: 'Tournament-grade group logic' },
                  { icon: Flame,  label: 'Prize Distribution',   desc: 'Fast, verified payouts' },
                  { icon: Star,   label: 'Fair Play Enforced',   desc: 'Zero tolerance for cheating' },
                ].map(({ icon: Icon, label, desc }, i) => (
                  <div key={label} className="flex items-start gap-4 py-4 border-b border-white/[0.04] group hover:bg-[#dbb462]/[0.02] transition-colors px-2">
                    <div className="w-7 h-7 bg-[#dbb462]/8 border border-[#dbb462]/15 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[#dbb462]/30 transition-colors">
                      <Icon size={13} className="text-[#dbb462]" />
                    </div>
                    <div>
                      <p className="font-teko text-[14px] tracking-[0.15em] text-[#f2f2f2] uppercase leading-none mb-0.5">{label}</p>
                      <p className="font-teko text-[11px] tracking-[0.12em] text-[#d1c5b3] opacity-35 uppercase">{desc}</p>
                    </div>
                    <span className="ml-auto font-teko text-[10px] tracking-widest text-[#dbb462]/20 self-center">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats HUD Strip */}
        <div className="relative z-10 border-t border-[#dbb462]/12 bg-[#080808]/80 backdrop-blur-xl">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#dbb462]/35 to-transparent" />
          <div className="container mx-auto max-w-7xl px-6 lg:px-16">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#dbb462]/8">
              <HeroStat value={platformStats.activePlayers} label="Players Reached"    sub="Across all platforms"   delay={0}   />
              <HeroStat value={platformStats.prizePools}    label="Prize Money Paid"   sub="Distributed to winners" delay={60}  />
              <HeroStat value={platformStats.tournamentsRun} label="Tournaments Run"   sub="Since 2021"             delay={120} />
              <HeroStat value="PAKISTAN" label="Region of Operation" sub="Nationwide circuit"   accent delay={180} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Divisions ── */}
      <DivisionsSection />

      {/* ── Command Center Announcements ── */}
      <AnnouncementsStrip />

      {/* ── Live Broadcast ── */}
      <LiveStatus />

      {/* ═══════════════════════════════════════════
          FEATURED / ONGOING TOURNAMENT
          ═══════════════════════════════════════════ */}
      {currentTournament && (
        <section className="relative bg-[#080808] overflow-hidden border-t border-white/[0.04]">

          {/* Atmospheric poster wash */}
          {currentTournament.poster_url && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <img
                src={currentTournament.poster_url}
                alt=""
                className="w-full h-full object-cover scale-[1.1]"
                style={{ filter: 'brightness(0.06) saturate(0.15) blur(22px)' }}
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/90 to-[#080808]/30 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#080808] via-transparent to-[#080808] pointer-events-none" />
          <div className="absolute top-1/2 -translate-y-1/2 left-1/4 w-[600px] h-[600px] bg-[#dbb462]/[0.04] blur-[150px] pointer-events-none rounded-full" />

          {/* Top label bar */}
          <div className="relative z-10 border-b border-white/[0.04] bg-[#080808]/70 backdrop-blur-sm">
            <div className="container mx-auto max-w-7xl px-6 lg:px-16 flex items-center justify-between py-3 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-6 h-[1.5px] bg-[#dbb462]" />
                {isLive && (
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <span className="font-teko text-[11px] tracking-[0.3em] text-emerald-400 uppercase">Live Now</span>
                  </div>
                )}
                <span className="font-teko text-[13px] tracking-[0.28em] text-[#dbb462] uppercase">
                  {isLive ? 'Ongoing Tournament' : 'Featured Tournament'}
                </span>
              </div>
              <Link
                to={`/tournaments/${currentTournament.id}`}
                className="hidden sm:flex items-center gap-1.5 font-teko text-[12px] tracking-[0.2em] text-[#d1c5b3] opacity-30 hover:opacity-70 uppercase transition-opacity"
              >
                Full Details <ChevronRight size={12} />
              </Link>
            </div>
          </div>

          {/* Main split-screen layout */}
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-[580px] lg:min-h-[680px]">

            {/* LEFT — Info panel */}
            <div className="flex flex-col justify-center px-6 lg:px-16 py-14 lg:py-20 gap-7">

              {/* Status */}
              <StatusBadge status={currentTournament.status} />

              {/* Title */}
              <h2
                className="font-bebas uppercase zenith-gradient-text leading-[0.82] tracking-tight"
                style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)', textShadow: '0 0 80px rgba(219,180,98,0.18)' }}
              >
                {currentTournament.title}
              </h2>

              {/* Description */}
              {currentTournament.description && (
                <p className="font-rajdhani text-[#d1c5b3] text-[17px] opacity-40 leading-relaxed max-w-lg font-medium">
                  {currentTournament.description}
                </p>
              )}

              {/* HUD metrics row */}
              <div className="flex flex-wrap gap-[1px] bg-white/[0.05]">
                <HUDStat label="Prize Pool" value={prizeFormatted || 'TBA'} gold />
                <HUDStat label="Slots" value={isUnlimited ? '∞ Open' : `${maxTeams} Teams`} />
                <HUDStat label="Format" value={currentTournament.format || 'Squad'} />
                <HUDStat label="Region" value={currentTournament.region || 'Pakistan'} />
              </div>

              {/* Capacity fill (non-unlimited only) */}
              {!isUnlimited && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-teko text-[12px] tracking-[0.22em] text-[#dbb462] uppercase">
                      {approvedCount} / {maxTeams} Teams Registered
                    </span>
                    <span className="font-teko text-[12px] tracking-[0.2em] text-[#d1c5b3] opacity-30 uppercase">
                      {Math.round(fillPct)}% Full
                    </span>
                  </div>
                  <div className="h-[2px] bg-white/[0.06] relative overflow-hidden">
                    <div
                      className="absolute left-0 inset-y-0 zenith-gradient transition-all duration-1000 ease-out"
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Deadline chip (open tournaments) */}
              {isOpen && currentTournament.registration_deadline && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-[1px] bg-[#dbb462]/40" />
                  <span className="font-teko text-[12px] tracking-[0.22em] text-[#d1c5b3] opacity-35 uppercase">Closes</span>
                  <span className="font-teko text-[13px] tracking-[0.18em] text-[#dbb462] uppercase">
                    {new Date(currentTournament.registration_deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}

              {/* CTA row */}
              <div className="flex flex-wrap gap-4 pt-1">
                {(myRegStatus && myRegStatus !== 'rejected') ? (
                  <div className={`px-8 py-4 font-bebas text-[19px] tracking-widest uppercase border text-center ${
                    myRegStatus === 'approved'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : myRegStatus === 'reapplied'
                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                  }`}>
                    {myRegStatus === 'approved' ? '✓ APPROVED'
                     : myRegStatus === 'reapplied' ? 'RE-APPLIED'
                     : '✓ SUBMITTED'}
                  </div>
                ) : isOpen ? (
                  <Link
                    to={user ? `/register/${currentTournament.id}` : '/auth'}
                    className="btn-obsidian-primary font-bebas text-[19px] px-10 py-4 tracking-[0.2em] uppercase inline-flex items-center gap-3"
                  >
                    REGISTER TEAM <ArrowRight size={18} strokeWidth={2.5} />
                  </Link>
                ) : (
                  <div className="px-8 py-4 bg-white/[0.03] border border-white/[0.05] text-[#d1c5b3]/20 font-bebas text-[19px] tracking-widest uppercase">
                    REGISTRATION CLOSED
                  </div>
                )}
                <Link
                  to={`/tournaments/${currentTournament.id}`}
                  className="btn-obsidian-ghost font-bebas text-[19px] px-8 py-4 tracking-widest uppercase inline-flex items-center gap-2"
                >
                  VIEW DETAILS <ChevronRight size={18} />
                </Link>
              </div>
            </div>

            {/* RIGHT — Poster, edge-to-edge, desktop only */}
            <div className="relative hidden lg:block overflow-hidden">
              {/* Left-edge blend into info panel */}
              <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#080808] to-transparent z-10 pointer-events-none" />
              {/* Top/bottom blends */}
              <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#080808] to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#080808] to-transparent z-10 pointer-events-none" />

              {currentTournament.poster_url ? (
                <img
                  src={currentTournament.poster_url}
                  alt={currentTournament.title}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <div className="absolute inset-0 bg-[#0d0d0d] flex items-center justify-center">
                  <img src="/logo.png" className="w-1/3 opacity-[0.06]" alt="" />
                </div>
              )}

              {/* Decorative tournament ordinal */}
              <div className="absolute bottom-10 right-10 z-20 select-none pointer-events-none">
                <span className="font-bebas text-[120px] leading-none text-white/[0.035]">01</span>
              </div>
            </div>

            {/* Mobile poster strip (below info on small screens) */}
            <div className="lg:hidden relative h-[260px] overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#080808] to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#080808] to-transparent z-10 pointer-events-none" />
              {currentTournament.poster_url ? (
                <img
                  src={currentTournament.poster_url}
                  alt={currentTournament.title}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full bg-[#0d0d0d]" />
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          OPEN REGISTRATIONS
          ═══════════════════════════════════════════ */}
      {openRegistrations.length > 0 && (
        <section className="relative bg-[#0a0a0a] border-t border-white/[0.04] overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#dbb462]/[0.03] blur-[150px] pointer-events-none rounded-full" />

          <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-20 lg:py-28 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-8 h-[2px] bg-[#dbb462]" />
                  <span className="font-teko text-[16px] tracking-[0.25em] text-[#dbb462] uppercase font-medium">Now Accepting Teams</span>
                </div>
                <h2 className="font-bebas text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.85] uppercase">
                  <span className="text-[#f2f2f2]">OPEN </span>
                  <span className="zenith-gradient-text">REGISTRATIONS</span>
                </h2>
                <p className="font-teko text-[14px] tracking-[0.2em] text-[#d1c5b3] opacity-30 uppercase mt-3">
                  {openRegistrations.length} {openRegistrations.length === 1 ? 'TOURNAMENT' : 'TOURNAMENTS'} ACCEPTING ENTRIES
                </p>
              </div>
              <Link
                to="/tournaments"
                className="btn-obsidian-ghost font-bebas text-[20px] px-8 py-4 tracking-[0.15em] uppercase shrink-0 inline-flex items-center gap-2"
              >
                ALL TOURNAMENTS <ChevronRight size={20} />
              </Link>
            </div>

            {/* Tournament Cards — using the full TournamentCard component */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {openRegistrations.map((t) => (
                <TournamentCard
                  key={t.id}
                  tournament={t}
                  registrationCount={regCounts[t.id] || 0}
                  userRegistrationStatus={userRegStatuses[t.id]}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          WHY COMPETE — Feature Pillars
          ═══════════════════════════════════════════ */}
      <section className="relative bg-[#0a0a0a] border-t border-white/[0.04] overflow-hidden">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-[400px] h-[400px] bg-[#dbb462]/[0.04] blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[300px] h-[300px] bg-[#dbb462]/[0.03] blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(219,180,98,1) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />

        <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-24 lg:py-40 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16 lg:mb-24">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-8 h-[2px] bg-[#dbb462]" />
                <span className="font-teko text-[16px] tracking-[0.25em] text-[#dbb462] uppercase font-medium">Why Compete With Us</span>
              </div>
              <h2 className="font-bebas text-6xl md:text-8xl lg:text-[9rem] tracking-tight leading-[0.82] uppercase">
                <span className="text-[#f2f2f2]">PROFESSIONAL</span><br />
                <span className="zenith-gradient-text">TOURNAMENT QUALITY</span>
              </h2>
            </div>
            <div className="flex items-end lg:justify-end">
              <p className="font-rajdhani text-[#d1c5b3] opacity-40 leading-relaxed text-lg max-w-md font-medium">
                We focus on technical excellence and competitive fairness. Every tournament is run with strict rules to ensure the best experience for every team.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-white/[0.04]">
            {[
              { icon: Shield,    num: '01', title: 'STRICT INTEGRITY',   desc: 'No shortcuts. We manually verify every player and character ID to ensure a fair battlefield for everyone.' },
              { icon: Tv,        num: '02', title: 'HIGH-END BROADCAST',  desc: 'Watch your matches with professional production. We use high-fidelity streams to showcase your gameplay.' },
              { icon: GitBranch, num: '03', title: 'TECHNICAL BRACKETS',  desc: 'No manual bias. Our system handles group distribution and brackets automatically using tournament-grade logic.' },
              { icon: Banknote,  num: '04', title: 'FAST SETTLEMENTS',    desc: 'We value your time. Prize distributions are handled quickly once results are verified and finalized.' },
            ].map(({ icon: Icon, num, title, desc }) => (
              <div
                key={num}
                className="bg-[#0e0e0e] p-8 lg:p-10 group hover:bg-[#111] transition-all duration-500 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#dbb462] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                <span className="absolute top-4 right-6 font-bebas text-[80px] text-white/[0.03] leading-none select-none group-hover:text-[#dbb462]/[0.06] transition-colors duration-500">{num}</span>
                <div className="relative z-10">
                  <Icon size={28} className="text-[#dbb462] mb-6 opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                  <h4 className="font-bebas text-3xl tracking-tight text-[#f2f2f2] mb-4 group-hover:text-[#dbb462] transition-colors uppercase">{title}</h4>
                  <p className="font-rajdhani text-[15px] text-[#d1c5b3] opacity-40 group-hover:opacity-70 transition-opacity leading-relaxed font-medium">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COMMUNITY — Social Channels
          ═══════════════════════════════════════════ */}
      <section className="relative bg-[#0a0a0a] border-t border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[#dbb462]/[0.04] blur-[120px] pointer-events-none rounded-full" />
        </div>

        <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-20 lg:py-28 relative z-10">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-8 h-[2px] bg-[#dbb462]" />
              <span className="font-teko text-[16px] tracking-[0.25em] text-[#dbb462] uppercase font-medium">Stay Connected</span>
              <div className="w-8 h-[2px] bg-[#dbb462]" />
            </div>
            <h2 className="font-bebas text-5xl md:text-7xl tracking-tight leading-[0.85] uppercase">
              <span className="text-[#f2f2f2]">JOIN THE </span>
              <span className="zenith-gradient-text">COMMUNITY</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-white/[0.04]">
            {[
              {
                icon: Youtube,
                platform: 'YouTube',
                handle: '@zenithesports.pakistan',
                desc: 'Watch live tournaments, match highlights and professional PUBG Mobile content.',
                href: 'https://youtube.com/@zenithesports.pakistan',
                color: 'text-red-400',
                bgHover: 'hover:bg-red-500/[0.03]',
              },
              {
                icon: Instagram,
                platform: 'Instagram',
                handle: '@zenithesports.pk',
                desc: 'Follow for tournament announcements, team spotlights and behind-the-scenes content.',
                href: 'https://instagram.com/zenithesports.pk',
                color: 'text-pink-400',
                bgHover: 'hover:bg-pink-500/[0.03]',
              },
              {
                icon: MessageCircle,
                platform: 'WhatsApp',
                handle: '+92 339 0715753',
                desc: 'Direct support for registrations, disputes, and all tournament related queries.',
                href: 'https://wa.me/923390715753',
                color: 'text-emerald-400',
                bgHover: 'hover:bg-emerald-500/[0.03]',
              },
            ].map(({ icon: Icon, platform, handle, desc, href, color, bgHover }) => (
              <a
                key={platform}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={`bg-[#0e0e0e] p-8 lg:p-10 group ${bgHover} transition-all duration-500 relative overflow-hidden flex flex-col`}
              >
                <div className={`absolute top-0 left-0 w-full h-[2px] ${color.replace('text-', 'bg-')} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
                <Icon size={32} className={`${color} mb-6 opacity-50 group-hover:opacity-100 transition-opacity`} strokeWidth={1.5} />
                <p className="font-teko text-[13px] tracking-[0.25em] text-[#d1c5b3] opacity-40 uppercase mb-1">{platform}</p>
                <p className={`font-bebas text-2xl ${color} mb-4`}>{handle}</p>
                <p className="font-rajdhani text-[#d1c5b3] text-sm opacity-40 group-hover:opacity-70 transition-opacity leading-relaxed flex-1 font-medium">{desc}</p>
                <div className={`mt-6 flex items-center gap-2 ${color} opacity-0 group-hover:opacity-80 transition-all duration-300 translate-y-2 group-hover:translate-y-0 font-teko text-[13px] tracking-widest uppercase`}>
                  Follow <ChevronRight size={14} />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          CTA — Final Push
          ═══════════════════════════════════════════ */}
      <section className="relative bg-[#0e0e0e] border-t border-white/[0.04] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#dbb462]/[0.05] via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[200px] bg-[#dbb462]/[0.04] blur-[80px] pointer-events-none" />

        <div className="container mx-auto max-w-7xl px-6 lg:px-16 py-20 lg:py-28 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Zap size={20} className="text-[#dbb462]" />
                <span className="font-teko text-[16px] tracking-[0.25em] text-[#dbb462] uppercase">Time to Deploy</span>
              </div>
              <h3 className="font-bebas text-5xl md:text-7xl tracking-tight uppercase leading-[0.85] mb-4">
                READY TO <span className="zenith-gradient-text">COMPETE?</span>
              </h3>
              <p className="font-rajdhani text-[#d1c5b3] opacity-40 text-lg max-w-lg font-medium">
                Register your squad, gear up, and join Pakistan's most competitive PUBG Mobile circuit today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 shrink-0">
              <Link
                to={user ? '/tournaments' : '/auth'}
                className="btn-obsidian-primary font-bebas text-[22px] px-12 py-6 tracking-[0.2em] inline-flex items-center gap-4 uppercase"
              >
                {user ? 'VIEW TOURNAMENTS' : 'GET STARTED'} <ArrowRight size={22} strokeWidth={2.5} />
              </Link>
              {!user && (
                <Link
                  to="/tournaments"
                  className="btn-obsidian-ghost font-bebas text-[22px] px-10 py-6 tracking-[0.15em] uppercase"
                >
                  BROWSE FIRST
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ── Sub-components ── */

function HeroStat({ value, label, sub, accent, delay = 0 }) {
  return (
    <div
      className="px-6 lg:px-10 py-6 lg:py-8 group relative overflow-hidden animate-stat-enter opacity-0"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className={`absolute top-0 left-0 right-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left ${accent ? 'bg-emerald-400' : 'zenith-gradient'}`} />
      <div className={`absolute -top-6 -left-6 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-full ${accent ? 'bg-emerald-500/10' : 'bg-[#dbb462]/08'}`} />
      <p className="font-teko text-[11px] md:text-[12px] tracking-[0.25em] text-[#d1c5b3] opacity-40 uppercase mb-1 group-hover:opacity-70 transition-opacity">{label}</p>
      <p className={`font-bebas text-[2rem] md:text-[2.5rem] leading-none tracking-tight mb-1 ${accent ? 'text-emerald-400' : 'zenith-gradient-text'}`}>
        {value}
      </p>
      <p className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-25 uppercase group-hover:opacity-50 transition-opacity">{sub}</p>
    </div>
  );
}

function MetricBox({ label, value, gold }) {
  return (
    <div className="bg-[#0e0e0e] p-5 group hover:bg-[#141414] transition-all duration-300">
      <p className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 mb-2 uppercase">{label}</p>
      <p className={`font-bebas text-2xl leading-none tracking-tight ${gold ? 'text-[#dbb462]' : 'text-[#f2f2f2]'}`}>
        {value}
      </p>
    </div>
  );
}

function HUDStat({ label, value, gold }) {
  return (
    <div className="bg-[#0c0c0c] px-5 py-4 flex-1 min-w-[90px] group hover:bg-[#141414] transition-colors duration-200 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-[#dbb462] scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
      <p className="font-teko text-[10px] tracking-[0.28em] text-[#d1c5b3] opacity-30 uppercase mb-1.5">{label}</p>
      <p className={`font-bebas text-[21px] leading-none tracking-tight ${gold ? 'text-[#dbb462]' : 'text-[#f2f2f2]'}`}>
        {value}
      </p>
    </div>
  );
}
