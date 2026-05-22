import React, { useState, useMemo } from 'react';
import TournamentCard from '../components/TournamentCard';
import { useTournaments } from '../hooks/useTournaments';
import { useSupabaseDB } from '../hooks/useSupabaseDB';
import { AlertTriangle, RefreshCw, Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const FILTERS = [
  { label: 'ALL',       value: 'all' },
  { label: 'OPEN',      value: 'registrations_open' },
  { label: 'ONGOING',   value: 'in_progress' },
  { label: 'COMPLETED', value: 'completed' },
];

export default function TournamentsPage() {
  const { user } = useAuth();
  
  // 1. Real-time Tournaments
  const { 
    tournaments, 
    loading: tLoading, 
    error: tError, 
    refetch: tRefetch 
  } = useTournaments();

  // 2. Real-time Registrations (to sync slot counts and user registration status)
  const { 
    data: allRegistrations, 
    loading: rLoading,
    refetch: rRefetch
  } = useSupabaseDB('registrations');

  const [filter, setFilter] = useState('all');

  // Compute registration counts and user registration status from real-time data
  const { regCounts, userRegStatuses } = useMemo(() => {
    const counts = {};
    const statuses = {};
    
    allRegistrations.forEach((r) => {
      // Slot counts only include approved teams
      if (r.status === 'approved') {
        counts[r.tournament_id] = (counts[r.tournament_id] || 0) + 1;
      }
      // Track which tournaments the current user has joined
      if (user?.id && r.user_id === user.id) {
        statuses[r.tournament_id] = r.status;
      }
    });
    
    return { regCounts: counts, userRegStatuses: statuses };
  }, [allRegistrations, user?.id]);

  const filtered = tournaments.filter((t) => filter === 'all' || t.status === filter);
  
  const getRegCount = (id) => regCounts[id] || 0;

  // Count by status for filter badges
  const countByStatus = {
    all: tournaments.length,
    registrations_open: tournaments.filter(t => t.status === 'registrations_open').length,
    in_progress: tournaments.filter(t => t.status === 'in_progress').length,
    completed: tournaments.filter(t => t.status === 'completed').length,
  };

  const isLoading = tLoading || rLoading;
  const isError = tError;

  const handleFullRefetch = () => {
    tRefetch();
    rRefetch();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 animate-page-enter overflow-x-hidden">

      {/* ── Hero ── */}
      <section className="relative py-28 md:py-40 px-6 lg:px-16 bg-[#0e0e0e] overflow-hidden border-b border-white/[0.04]">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(219,180,98,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(219,180,98,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0e0e0e]" />

        <div className="relative z-10 container mx-auto max-w-7xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-8 h-[2px] bg-[#dbb462]" />
            <span className="font-teko text-[16px] tracking-[0.25em] text-[#dbb462] uppercase font-medium">Browse & Register</span>
          </div>
          <h1 className="font-bebas text-7xl md:text-[11rem] tracking-tight leading-[0.82] mb-8 uppercase">
            <span className="text-[#f2f2f2]">ALL </span>
            <span className="zenith-gradient-text">TOURNAMENTS</span>
          </h1>
          <p className="font-body text-[#d1c5b3] opacity-40 max-w-lg text-lg leading-relaxed font-medium">
            Browse and join our tournaments. Register your team and compete for the top spots.
          </p>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <div className="border-b border-white/[0.04] bg-[#0a0a0a]">
        <div className="container mx-auto max-w-7xl px-6 lg:px-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.04]">
            <TourneyStatCell label="Total Events" value={countByStatus.all} />
            <TourneyStatCell label="Open Now" value={countByStatus.registrations_open} accent />
            <TourneyStatCell label="In Progress" value={countByStatus.in_progress} />
            <TourneyStatCell label="Completed" value={countByStatus.completed} />
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="sticky top-24 md:top-28 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="container mx-auto max-w-7xl px-6 lg:px-16">
          <div className="flex items-center justify-between py-4 gap-6 overflow-x-auto no-scrollbar">
            <div className="flex gap-[1px] bg-white/[0.04]">
              {FILTERS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`
                    font-teko text-[15px] tracking-[0.2em] px-6 md:px-8 py-3 transition-all duration-300 uppercase whitespace-nowrap relative
                    ${filter === value
                      ? 'bg-[#dbb462] text-[#402d00]'
                      : 'bg-[#0e0e0e] text-[#d1c5b3] opacity-60 hover:opacity-100 hover:bg-[#111]'
                    }
                  `}
                >
                  {label}
                  {countByStatus[value] > 0 && (
                    <span className={`ml-2 text-[12px] ${filter === value ? 'text-[#402d00]/60' : 'text-[#dbb462]'}`}>
                      {countByStatus[value]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <span className="font-teko text-[14px] tracking-[0.2em] text-[#d1c5b3] opacity-30 uppercase hidden md:block shrink-0">
              {filtered.length} {filtered.length === 1 ? 'TOURNAMENT' : 'TOURNAMENTS'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <section className="container mx-auto max-w-7xl px-6 lg:px-16 py-16 pb-32">
        {(isLoading && tournaments.length === 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#0e0e0e] aspect-[3/4] animate-pulse border border-white/5" />
            ))}
          </div>
        ) : (isError && tournaments.length === 0) ? (
          <div className="flex flex-col items-center justify-center py-40 text-center">
            <AlertTriangle className="text-red-500 mb-6" size={48} />
            <p className="font-bebas text-5xl text-white mb-4">FAILED TO SYNC</p>
            <p className="font-body text-[#d1c5b3] opacity-40 mb-12 max-w-sm">{tError}</p>
            <button onClick={handleFullRefetch} className="btn-obsidian-ghost px-12 py-4 font-bebas text-xl tracking-widest">
              <RefreshCw size={18} className="mr-3" /> RETRY
            </button>
          </div>
        ) : (filtered.length === 0 && !tLoading) ? (
          <div className="text-center py-40 flex flex-col items-center">
            <Trophy className="text-[#dbb462] opacity-[0.06] mb-8" size={80} />
            <p className="font-bebas text-6xl text-white opacity-10 mb-3 uppercase">NO RECORDS</p>
            <p className="font-teko text-[16px] tracking-[0.2em] text-[#dbb462] opacity-40 uppercase">
              {filter === 'all' ? 'STAY TUNED FOR UPDATES' : `NO ${filter.toUpperCase()} EVENTS`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                registrationCount={getRegCount(t.id)}
                userRegistrationStatus={userRegStatuses[t.id]}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TourneyStatCell({ label, value, accent }) {
  return (
    <div className="px-6 lg:px-10 py-5 group relative overflow-hidden">
      <p className="font-teko text-[11px] tracking-[0.25em] text-[#d1c5b3] opacity-35 uppercase mb-1">{label}</p>
      <p className={`font-bebas text-3xl leading-none ${accent ? 'zenith-gradient-text' : 'text-[#f2f2f2]'}`}>
        {value}
      </p>
    </div>
  );
}
