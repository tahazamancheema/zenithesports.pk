import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { signOut } from '../../supabase/auth';
import toast from 'react-hot-toast';
import { useTournaments } from '../../hooks/useTournaments';

const NAV_LINKS = [
  { label: 'HOME', to: '/' },
  { label: 'TOURNAMENTS', to: '/tournaments' },
  { label: 'DAILY SCRIMS', to: '/scrims' },
  { label: 'ABOUT US', to: '/about' },
  { label: 'MY PROFILE', to: '/profile' },
];

export default function Navbar() {
  const { user, userDoc, isAdmin } = useAuth();
  const { openRegistrations } = useTournaments();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const firstOpen = openRegistrations[0];
  const deadline = firstOpen?.registration_deadline
    ? new Date(firstOpen.registration_deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })
    : null;

  return (
    <header className="fixed top-0 w-full z-50">

      {/* ── Announcement Bar ── */}
      <div className="h-8 bg-[#060606] border-b border-white/[0.04] flex items-center overflow-hidden">
        <div className="container mx-auto px-4 lg:px-12 flex items-center justify-between gap-4">
          {firstOpen ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f9d07a] animate-pulse shrink-0" />
              <span className="font-teko text-[12px] md:text-[13px] tracking-[0.18em] uppercase truncate">
                <span className="text-[#f9d07a]">REGISTRATIONS OPEN</span>
                <span className="text-[#d1c5b3] opacity-40 mx-2">—</span>
                <span className="text-[#f2f2f2]">{firstOpen.title}</span>
                {deadline && (
                  <>
                    <span className="text-[#d1c5b3] opacity-30 hidden sm:inline"> · CLOSES </span>
                    <span className="text-[#dbb462] hidden sm:inline"> {deadline}</span>
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="w-1 h-1 rounded-full bg-[#dbb462]/25 shrink-0" />
              <span className="font-teko text-[12px] tracking-[0.22em] text-[#d1c5b3] opacity-25 uppercase">
                WELCOME TO ZENITH ESPORTS
              </span>
            </div>
          )}
          <span className="font-teko text-[10px] tracking-[0.2em] text-[#d1c5b3] opacity-15 uppercase hidden lg:block shrink-0">
            PAKISTAN · PUBG MOBILE
          </span>
        </div>
      </div>

      {/* ── Main Navigation ── */}
      <div
        className={`transition-all duration-500 border-b relative ${
          scrolled
            ? 'h-16 bg-[#0a0a0a]/96 backdrop-blur-xl border-[rgba(219,180,98,0.1)] shadow-[0_4px_40px_rgba(0,0,0,0.6)]'
            : 'h-20 bg-transparent border-white/[0.04]'
        }`}
      >
        {/* Gradient underline on scroll */}
        <div className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#dbb462]/30 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />

        <div className="container mx-auto h-full px-6 lg:px-12 flex justify-between items-center">

          {/* Brand */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-4 group">
              <img
                src="/logo.png"
                alt="Zenith"
                className="h-10 md:h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="font-rajdhani font-bold text-xl md:text-2xl tracking-normal leading-none uppercase mt-1">
                <span className="text-[#f2f2f2] group-hover:text-white transition-colors">ZENITH</span>
                <span className="ml-1 text-[#dbb462]">ESPORTS</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className={`relative font-agency font-bold text-[18px] tracking-[0.05em] px-4 py-1 uppercase transition-all duration-300 group/nav
                    ${isActive(to) ? 'text-[#dbb462]' : 'text-[#d1c5b3] opacity-50 hover:opacity-100 hover:text-white'}`}
                >
                  {label}
                  <div className={`absolute bottom-0 left-4 right-4 h-[1.5px] bg-[#dbb462] transition-all duration-500 origin-left ${isActive(to) ? 'scale-x-100' : 'scale-x-0 group-hover/nav:scale-x-100'}`} />
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="ml-3 flex items-center gap-1.5 bg-white/5 border border-white/10 px-4 py-1 font-agency font-bold text-[18px] tracking-[0.05em] text-[#dbb462] hover:bg-white/10 transition-all uppercase"
                >
                  <ShieldCheck size={16} className="mb-0.5" />
                  ADMIN
                </Link>
              )}
            </nav>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              {user ? (
                <div className="flex items-center gap-4">
                  <p className="font-agency font-bold text-[18px] text-white tracking-[0.05em] uppercase truncate max-w-[150px]">
                    {displayName}
                  </p>
                  <button
                    onClick={handleSignOut}
                    className="w-10 h-10 bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-[#d1c5b3] hover:text-[#ffb4ab] hover:border-[#ffb4ab]/50 transition-all"
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="btn-obsidian-primary font-agency font-bold text-[18px] px-8 py-2 tracking-[0.05em] uppercase"
                >
                  LOGIN
                </Link>
              )}
            </div>

            <button
              className="lg:hidden text-[#f2f2f2] hover:text-[#dbb462] transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className={`lg:hidden fixed inset-x-0 ${scrolled ? 'top-24' : 'top-28'} bg-[#0a0a0a]/98 backdrop-blur-xl border-b border-[#dbb462]/15 animate-in slide-in-from-top-10 duration-500 z-50 max-h-[calc(100dvh-7rem)] overflow-y-auto`}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#dbb462]/30 to-transparent" />
          <nav className="flex flex-col p-10 gap-8">
            {NAV_LINKS.map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`font-agency font-bold text-4xl tracking-[0.1em] uppercase ${isActive(to) ? 'text-[#dbb462]' : 'text-[#d1c5b3] opacity-40'}`}
              >
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileOpen(false)}
                className="font-agency font-bold text-3xl tracking-[0.1em] text-[#dbb462] py-4 border-t border-white/5 flex items-center gap-3 uppercase"
              >
                <ShieldCheck size={24} /> ADMIN DASHBOARD
              </Link>
            )}
            <div className="pt-8 border-t border-white/5">
              {!user ? (
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full text-center zenith-gradient text-[#402d00] font-agency font-bold text-3xl py-4 tracking-[0.1em] uppercase"
                >
                  LOGIN / REGISTER
                </Link>
              ) : (
                <button
                  onClick={handleSignOut}
                  className="w-full text-center border border-[#ffb4ab]/30 text-[#ffb4ab] font-agency font-bold text-3xl py-4 tracking-[0.1em] uppercase"
                >
                  SIGN OUT
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
