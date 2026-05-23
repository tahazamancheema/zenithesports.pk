import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../supabase/auth';
import toast from 'react-hot-toast';
import { useTournaments } from '../../hooks/useTournaments';

const NAV_LINKS = [
  { label: 'HOME',         to: '/' },
  { label: 'TOURNAMENTS',  to: '/tournaments' },
  { label: 'DAILY SCRIMS', to: '/scrims' },
  { label: 'ABOUT US',     to: '/about' },
  { label: 'MY PROFILE',   to: '/profile' },
];

const TICKER_STATIC = [
  { text: 'WELCOME TO ZENITH ESPORTS', gold: false },
  { text: 'FORGED IN OBSIDIAN',        gold: false },
  { text: 'PUBG MOBILE · PAKISTAN',    gold: false },
  { text: 'EST. 2021',                 gold: false },
  { text: 'FAIR PLAY CERTIFIED',       gold: false },
  { text: 'ALL MATCHES MONITORED',     gold: false },
  { text: 'SQUAD · DUO · SOLO',        gold: false },
  { text: 'COMPETITIVE CIRCUIT',       gold: false },
];

export default function Navbar() {
  const { user, userDoc, isAdmin } = useAuth();
  const { openRegistrations, currentTournament } = useTournaments();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    toast.loading('Signing out...', { id: 'logout' });
    await signOut();
    toast.success('Signed out successfully.', { id: 'logout' });
    window.location.href = '/';
  }

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const displayName =
    userDoc?.username ||
    user?.user_metadata?.displayName ||
    user?.email?.split('@')[0] ||
    'PLAYER';

  const isLive = currentTournament?.status === 'in_progress';

  const firstOpen = openRegistrations[0];
  const deadline = firstOpen?.registration_deadline
    ? new Date(firstOpen.registration_deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
    : null;

  const dynamicItems = [
    ...(isLive ? [
      { text: 'NOW LIVE', gold: true, pulse: true },
      { text: currentTournament.title.toUpperCase(), gold: false },
    ] : []),
    ...(firstOpen && !isLive ? [
      { text: 'REGISTRATIONS OPEN', gold: true, pulse: true },
      { text: firstOpen.title.toUpperCase(), gold: false },
      ...(deadline ? [{ text: `CLOSES ${deadline}`, gold: true }] : []),
    ] : []),
  ];

  const tickerItems = [...dynamicItems, ...TICKER_STATIC];

  return (
    <header className="fixed top-0 w-full z-50">

      {/* ── Announcement Ticker ── */}
      <div className="h-8 bg-[#050505] border-b border-[#dbb462]/[0.08] flex items-center overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center shrink-0" style={{ width: 'max-content' }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center shrink-0">
              {tickerItems.map((item, i) => (
                <React.Fragment key={i}>
                  <span className={`flex items-center gap-2 font-teko text-[11px] tracking-[0.28em] uppercase whitespace-nowrap px-5 ${
                    item.gold ? 'text-[#f9d07a]' : 'text-[#d1c5b3] opacity-25'
                  }`}>
                    {item.pulse && (
                      <span className="relative flex w-1.5 h-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f9d07a] opacity-60" />
                        <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[#f9d07a]" />
                      </span>
                    )}
                    {item.text}
                  </span>
                  <span className="text-[#dbb462]/12 select-none text-base">·</span>
                </React.Fragment>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <div
        className={`transition-all duration-500 border-b relative ${
          scrolled
            ? 'h-16 bg-[#080808]/98 backdrop-blur-xl border-[#dbb462]/[0.12] shadow-[0_8px_40px_rgba(0,0,0,0.7)]'
            : 'h-20 bg-[#080808]/80 backdrop-blur-md border-white/[0.04]'
        }`}
      >
        <div className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#dbb462]/20 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />

        <div className="container mx-auto h-full px-5 lg:px-12 flex justify-between items-center">

          {/* Brand */}
          <div className="flex items-center gap-6 lg:gap-10">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="Zenith"
                  className={`w-auto object-contain transition-all duration-500 group-hover:scale-105 ${scrolled ? 'h-9 md:h-10' : 'h-10 md:h-12'}`}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-[#dbb462]/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              </div>
              <div className="leading-none uppercase">
                <div className={`font-bebas tracking-[0.05em] transition-all duration-300 ${scrolled ? 'text-xl md:text-2xl' : 'text-2xl md:text-[1.7rem]'}`}>
                  <span className="text-[#f2f2f2] group-hover:text-white transition-colors">ZENITH</span>
                  <span className="ml-1 text-[#dbb462]">ESPORTS</span>
                </div>
                <div className="font-teko text-[8px] tracking-[0.38em] text-[#d1c5b3] opacity-20 mt-0.5 hidden md:block">PAKISTAN · PUBG MOBILE</div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map(({ label, to }) => {
                const active = isActive(to);
                const badge = label === 'TOURNAMENTS' && openRegistrations.length > 0 ? openRegistrations.length : null;
                return (
                  <Link
                    key={label}
                    to={to}
                    className={`relative font-teko text-[14px] tracking-[0.18em] px-3.5 py-1.5 uppercase transition-all duration-300 group/nav flex items-center gap-1.5
                      ${active ? 'text-[#dbb462]' : 'text-[#d1c5b3] opacity-45 hover:opacity-100 hover:text-white'}`}
                  >
                    {label}
                    {badge && (
                      <span className={`text-[9px] font-teko tracking-widest px-1.5 py-0.5 leading-none ${
                        active ? 'bg-[#dbb462] text-[#402d00]' : 'bg-[#dbb462]/15 text-[#dbb462]'
                      }`}>
                        {badge}
                      </span>
                    )}
                    <span className={`absolute bottom-0 left-3.5 right-3.5 h-[1.5px] bg-[#dbb462] transition-transform duration-400 origin-left ${
                      active ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'
                    }`} />
                  </Link>
                );
              })}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="ml-2 flex items-center gap-1.5 border border-[#dbb462]/20 bg-[#dbb462]/[0.05] hover:bg-[#dbb462]/12 px-3.5 py-1.5 font-teko text-[13px] tracking-[0.2em] text-[#dbb462] transition-all uppercase"
                >
                  <ShieldCheck size={13} />ADMIN
                </Link>
              )}
            </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2 border-r border-white/[0.06] pr-3">
                    <div className="w-6 h-6 bg-[#dbb462]/10 border border-[#dbb462]/20 flex items-center justify-center shrink-0">
                      <span className="font-teko text-[11px] text-[#dbb462] leading-none">{displayName[0]?.toUpperCase()}</span>
                    </div>
                    <p className="font-teko text-[13px] text-white tracking-[0.1em] uppercase truncate max-w-[120px]">{displayName}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-8 h-8 bg-[#111] border border-white/[0.08] flex items-center justify-center text-[#d1c5b3] hover:text-[#ffb4ab] hover:border-[#ffb4ab]/30 transition-all"
                    title="Sign Out"
                  >
                    <LogOut size={13} />
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="btn-obsidian-primary font-teko text-[14px] px-7 py-2 tracking-[0.22em] uppercase"
                >
                  LOGIN
                </Link>
              )}
            </div>

            <button
              className="lg:hidden w-9 h-9 flex items-center justify-center border border-white/[0.08] text-[#f2f2f2] hover:text-[#dbb462] hover:border-[#dbb462]/25 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div
          className={`lg:hidden fixed inset-x-0 ${scrolled ? 'top-24' : 'top-28'} bg-[#060606]/99 backdrop-blur-xl border-b border-[#dbb462]/10 z-50 max-h-[calc(100dvh-7rem)] overflow-y-auto`}
          style={{ animation: 'fadeIn 0.18s ease-out both' }}
        >
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#dbb462]/20 to-transparent" />

          <nav className="flex flex-col">
            {NAV_LINKS.map(({ label, to }) => {
              const active = isActive(to);
              const badge = label === 'TOURNAMENTS' && openRegistrations.length > 0 ? openRegistrations.length : null;
              return (
                <Link
                  key={label}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-7 py-4 border-b border-white/[0.04] font-teko text-[20px] tracking-[0.12em] uppercase transition-colors ${
                    active ? 'text-[#dbb462] bg-[#dbb462]/[0.04]' : 'text-[#d1c5b3] opacity-45'
                  }`}
                >
                  <span>{label}</span>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span className="bg-[#dbb462] text-[#402d00] font-teko text-[10px] tracking-widest px-2 py-0.5 leading-none">
                        {badge} OPEN
                      </span>
                    )}
                    <ChevronRight size={15} className={active ? 'text-[#dbb462]' : 'text-white/15'} />
                  </div>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-7 py-4 border-b border-white/[0.04] font-teko text-[20px] tracking-[0.12em] text-[#dbb462] uppercase"
              >
                <span className="flex items-center gap-3"><ShieldCheck size={18} /> ADMIN DASHBOARD</span>
                <ChevronRight size={15} />
              </Link>
            )}

            <div className="px-7 py-5">
              {!user ? (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center zenith-gradient text-[#402d00] font-teko text-[18px] py-4 tracking-[0.2em] uppercase"
                >
                  LOGIN / REGISTER
                </Link>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#dbb462]/10 border border-[#dbb462]/20 flex items-center justify-center">
                      <span className="font-teko text-[13px] text-[#dbb462]">{displayName[0]?.toUpperCase()}</span>
                    </div>
                    <span className="font-teko text-[15px] text-white tracking-[0.1em] uppercase">{displayName}</span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 border border-[#ffb4ab]/20 text-[#ffb4ab] font-teko text-[13px] tracking-widest px-4 py-2 uppercase"
                  >
                    <LogOut size={13} /> SIGN OUT
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
