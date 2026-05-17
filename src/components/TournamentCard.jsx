import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, ChevronRight, Users, Zap, Shield, Clock, Wifi } from 'lucide-react';
import { useTournamentCountdown } from '../hooks/useTournamentCountdown';
import StatusBadge from './ui/StatusBadge';

// ── Status-driven design tokens ──────────────────────────────────
const STATUS_COLORS = {
  registrations_open:   { accent: '#f9d07a', glow: '#f9d07a18', bar: 'from-[#dbb462] to-[#f9d07a]' },
  in_progress:          { accent: '#34d399', glow: '#34d39918', bar: 'from-emerald-500 to-green-400' },
  upcoming:             { accent: '#60a5fa', glow: '#60a5fa12', bar: 'from-blue-500 to-blue-400' },
  registrations_closed: { accent: '#fb923c', glow: '#fb923c12', bar: 'from-orange-500 to-orange-400' },
  completed:            { accent: '#6b7280', glow: '#6b728010', bar: 'from-gray-600 to-gray-500' },
};

// ── Animated count-up ─────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  const prev = useRef(0);
  useEffect(() => {
    prev.current = 0;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(eased * target));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

// ── Sub-components ────────────────────────────────────────────────
function TimeBox({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-bebas text-[1.6rem] leading-none text-[#f9d07a] tabular-nums tracking-wide">
        {String(value).padStart(2, '0')}
      </span>
      <span className="font-teko text-[9px] tracking-[0.2em] text-[#d1c5b3] opacity-35 uppercase mt-0.5">{label}</span>
    </div>
  );
}

function TimeSep() {
  return <span className="font-bebas text-xl text-[#f9d07a]/30 mb-3 select-none">:</span>;
}

// ── Main Component ────────────────────────────────────────────────
export default function TournamentCard({ tournament, registrationCount = 0, userRegistrationStatus = null }) {
  const {
    id, title, start_date, registration_open_date, registration_deadline,
    status, max_teams, prize_pool, game = 'PUBG Mobile', poster_url,
    format = 'Squad', team_size = 4, entry_fee = 0, region = 'Pakistan',
  } = tournament;

  const { phase, days, hours, mins, secs } = useTournamentCountdown(registration_open_date, registration_deadline);

  const slotsPercent  = max_teams ? Math.min((registrationCount / max_teams) * 100, 100) : null;
  const isFilling     = slotsPercent !== null && slotsPercent >= 75;
  const isFull        = slotsPercent !== null && slotsPercent >= 100;
  const isOpen        = status === 'registrations_open' && phase === 'closing' && !isFull;
  const isFree        = !entry_fee || Number(entry_fee) === 0;
  const animatedCount = useCountUp(registrationCount);

  const sc = STATUS_COLORS[status] || STATUS_COLORS.upcoming;

  const startFormatted = start_date
    ? new Date(start_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  const prizeFormatted = prize_pool
    ? `PKR ${Number(prize_pool).toLocaleString('en-PK')}`
    : null;

  // Bar color shifts gold → orange → red as capacity fills
  const barStyle = slotsPercent !== null
    ? slotsPercent >= 100
      ? { background: 'linear-gradient(90deg, #ef4444, #dc2626)' }
      : slotsPercent >= 75
      ? { background: 'linear-gradient(90deg, #f97316, #fb923c)' }
      : { background: 'linear-gradient(90deg, #dbb462, #f9d07a)' }
    : { background: 'linear-gradient(90deg, #dbb462, #f9d07a)' };

  return (
    <div
      className="group relative bg-[#0e0e0e] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-500 overflow-hidden flex flex-col h-full"
    >
      {/* Status-colored left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] z-10 transition-opacity duration-500"
        style={{ backgroundColor: sc.accent, opacity: 0.5 }}
      />

      {/* Ambient glow blob (top-right) */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none blur-[80px]"
        style={{ backgroundColor: sc.accent + '14' }}
      />

      {/* ── Poster ─────────────────────────────────────────────── */}
      <Link to={`/tournaments/${id}`} className="relative overflow-hidden block" style={{ aspectRatio: '16/9' }}>
        {poster_url ? (
          <img
            src={poster_url}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-[3000ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `radial-gradient(ellipse at 60% 40%, ${sc.accent}0a 0%, #0a0a0a 70%)` }}
          >
            <Trophy className="opacity-[0.05]" size={72} style={{ color: sc.accent }} />
          </div>
        )}

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/20 to-transparent" />
        {/* Hover status tint */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ background: `linear-gradient(to bottom right, ${sc.accent}08, transparent 60%)` }}
        />

        {/* TOP-LEFT: Status badge */}
        <div className="absolute top-3 left-4 z-20">
          <StatusBadge status={status} />
        </div>

        {/* TOP-RIGHT: Entry fee + format */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
          <span className={`font-teko text-[11px] tracking-[0.15em] uppercase leading-none px-2.5 py-1 border ${
            isFree
              ? 'bg-emerald-950/70 border-emerald-500/30 text-emerald-400'
              : 'bg-[#1a1500]/80 border-[#dbb462]/30 text-[#f9d07a]'
          } backdrop-blur-sm`}>
            {isFree ? 'FREE' : `PKR ${Number(entry_fee).toLocaleString('en-PK')}`}
          </span>
          {format && (
            <span className="font-teko text-[10px] tracking-[0.15em] text-[#d1c5b3] opacity-70 uppercase leading-none px-2 py-0.5 bg-black/50 border border-white/10 backdrop-blur-sm">
              {format}{Number(team_size) > 1 ? ` · ${team_size}v${team_size}` : ''}
            </span>
          )}
        </div>

        {/* BOTTOM: Prize pool + fill alert */}
        <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-3.5 flex items-end justify-between">
          {prizeFormatted ? (
            <div>
              <p className="font-teko text-[9px] tracking-[0.25em] text-white/30 uppercase mb-0.5">PRIZE POOL</p>
              <span className="font-bebas text-[1.6rem] text-[#f9d07a] leading-none" style={{ textShadow: '0 2px 12px #f9d07a30' }}>
                {prizeFormatted}
              </span>
            </div>
          ) : <div />}

          {isFull && (
            <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/30 px-2.5 py-1 backdrop-blur-sm">
              <Shield size={9} className="text-red-400" />
              <span className="font-teko text-[10px] tracking-widest text-red-400 uppercase leading-none">FULL</span>
            </div>
          )}
          {!isFull && isFilling && (
            <div className="flex items-center gap-1.5 bg-orange-950/80 border border-orange-500/30 px-2.5 py-1 backdrop-blur-sm">
              <Zap size={9} className="text-orange-400" />
              <span className="font-teko text-[10px] tracking-widest text-orange-400 uppercase leading-none">FILLING FAST</span>
            </div>
          )}
        </div>
      </Link>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col px-5 pt-4 pb-5 relative">

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="font-teko text-[11px] tracking-[0.2em] uppercase"
            style={{ color: sc.accent, opacity: 0.85 }}
          >
            {game}
          </span>
          <div className="w-1 h-1 bg-white/15 rounded-full" />
          <span className="font-teko text-[11px] tracking-[0.15em] text-[#d1c5b3] opacity-35 uppercase">{region || 'Pakistan'}</span>
        </div>

        {/* Title */}
        <Link to={`/tournaments/${id}`}>
          <h3 className="font-bebas text-[2rem] text-[#f0f0f0] group-hover:text-white transition-colors leading-none line-clamp-1 uppercase mb-4 tracking-wide">
            {title}
          </h3>
        </Link>

        {/* ── Countdown / live indicator ────────────────────────── */}
        <div className="mb-5 min-h-[3.5rem] flex items-center">
          {status === 'in_progress' && (
            <div className="flex items-center gap-3 bg-emerald-500/[0.06] border border-emerald-500/20 px-4 py-2.5 w-full">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
              </span>
              <span className="font-bebas text-xl tracking-widest text-emerald-400">TOURNAMENT IN PROGRESS</span>
            </div>
          )}

          {status === 'registrations_open' && phase === 'closing' && (
            <div className="w-full">
              <p className="font-teko text-[10px] tracking-[0.25em] text-[#d1c5b3] opacity-35 uppercase mb-2">
                REGISTRATION CLOSES IN
              </p>
              <div className="flex items-center gap-1.5">
                {days > 0 && <><TimeBox value={days} label="Days" /><TimeSep /></>}
                <TimeBox value={hours} label="Hrs" />
                <TimeSep />
                <TimeBox value={mins} label="Min" />
                <TimeSep />
                <TimeBox value={secs} label="Sec" />
              </div>
            </div>
          )}

          {status === 'registrations_open' && phase === 'opening' && (
            <div className="w-full">
              <p className="font-teko text-[10px] tracking-[0.25em] text-[#d1c5b3] opacity-35 uppercase mb-2">
                OPENS IN
              </p>
              <div className="flex items-center gap-1.5">
                {days > 0 && <><TimeBox value={days} label="Days" /><TimeSep /></>}
                <TimeBox value={hours} label="Hrs" />
                <TimeSep />
                <TimeBox value={mins} label="Min" />
              </div>
            </div>
          )}

          {status === 'upcoming' && startFormatted && (
            <div className="flex items-center gap-3 w-full">
              <Clock size={13} className="text-blue-400 opacity-60 shrink-0" />
              <div>
                <p className="font-teko text-[10px] tracking-[0.2em] text-[#d1c5b3] opacity-35 uppercase">STARTS</p>
                <p className="font-teko text-[15px] tracking-[0.1em] text-blue-300 opacity-80 uppercase">{startFormatted}</p>
              </div>
            </div>
          )}

          {(status === 'registrations_closed' || status === 'completed') && (
            <div className="flex items-center gap-3 w-full">
              {startFormatted && (
                <>
                  <Clock size={13} className="text-[#d1c5b3] opacity-25 shrink-0" />
                  <span className="font-teko text-[14px] tracking-[0.1em] text-[#d1c5b3] opacity-40 uppercase">{startFormatted}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Slot capacity ─────────────────────────────────────── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-[#d1c5b3] opacity-30 shrink-0" />
              <span className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase">Squads</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-bebas text-xl leading-none text-white">{animatedCount}</span>
              <span className="font-teko text-[12px] tracking-widest text-white/20 uppercase">
                /{max_teams ?? '∞'}
              </span>
            </div>
          </div>

          {/* Bar track */}
          <div className="h-[3px] bg-white/[0.05] relative overflow-visible">
            {/* Fill */}
            <div
              className="absolute left-0 inset-y-0 transition-all duration-1000 ease-out"
              style={{ width: slotsPercent != null ? `${slotsPercent}%` : '0%', ...barStyle }}
            />
            {/* Animated leading edge when filling fast */}
            {slotsPercent !== null && slotsPercent > 0 && slotsPercent < 100 && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-[3px] h-[7px] rounded-full transition-all duration-1000 ${isFilling ? 'animate-pulse' : ''}`}
                style={{
                  left: `${Math.min(slotsPercent, 99)}%`,
                  backgroundColor: isFilling ? '#f97316' : '#ffffff60',
                  boxShadow: isFilling ? '0 0 6px #f97316' : 'none',
                }}
              />
            )}
          </div>

          {slotsPercent !== null && (
            <p className="font-teko text-[10px] tracking-[0.15em] text-right mt-1.5 uppercase"
               style={{ color: sc.accent, opacity: 0.35 }}>
              {Math.round(slotsPercent)}% filled
            </p>
          )}
        </div>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <div className="mt-auto flex gap-2">
          {isOpen && (!userRegistrationStatus || userRegistrationStatus === 'rejected') ? (
            <Link
              to={`/register/${id}`}
              className="flex-1 py-3.5 font-bebas text-[1.1rem] tracking-[0.15em] uppercase text-center relative overflow-hidden transition-all duration-300 group/cta"
              style={{
                backgroundColor: `${sc.accent}12`,
                border: `1px solid ${sc.accent}35`,
                color: sc.accent,
              }}
            >
              <span className="relative z-10">REGISTER SQUAD</span>
              <div
                className="absolute inset-0 opacity-0 group-hover/cta:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: `${sc.accent}18` }}
              />
            </Link>
          ) : userRegistrationStatus ? (
            <div className={`flex-1 font-teko text-[15px] py-3.5 tracking-[0.15em] uppercase text-center flex items-center justify-center border ${
              userRegistrationStatus === 'approved'
                ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-400'
                : userRegistrationStatus === 'reapplied'
                ? 'bg-blue-500/8 border-blue-500/20 text-blue-400'
                : 'bg-yellow-500/8 border-yellow-500/20 text-yellow-500'
            }`}>
              {userRegistrationStatus === 'approved'  ? '✓ SQUAD APPROVED'  :
               userRegistrationStatus === 'reapplied' ? '↺ RE-APPLIED'      :
               '⏳ PENDING REVIEW'}
            </div>
          ) : (
            <Link
              to={`/tournaments/${id}`}
              className="flex-1 py-3.5 font-teko text-[14px] tracking-[0.15em] uppercase text-center text-[#d1c5b3] opacity-40 hover:opacity-70 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
            >
              VIEW DETAILS
            </Link>
          )}

          <Link
            to={`/tournaments/${id}`}
            className="w-11 flex items-center justify-center border border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.02] transition-all duration-300"
          >
            <ChevronRight size={17} className="text-[#d1c5b3] opacity-30 group-hover:opacity-70 transition-opacity" />
          </Link>
        </div>

        {/* Closed contact strip */}
        {phase === 'closed' && status !== 'in_progress' && status !== 'completed' && (
          <a
            href="https://chat.whatsapp.com/GdcuGDXDTF833A6Y96INRQ"
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-2.5 border border-white/[0.05] px-4 py-2.5 hover:border-white/[0.1] hover:bg-white/[0.02] transition-all duration-300 group/wa"
          >
            <Wifi size={12} className="text-[#25D366] opacity-60 group-hover/wa:opacity-100 shrink-0" />
            <span className="font-teko text-[11px] tracking-[0.15em] text-[#d1c5b3] opacity-40 group-hover/wa:opacity-70 uppercase transition-opacity">
              Join WhatsApp for updates
            </span>
          </a>
        )}
      </div>
    </div>
  );
}
