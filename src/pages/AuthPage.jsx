import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, MessageCircle } from 'lucide-react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, sendPasswordReset } from '../supabase/auth';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import StaticBackground from '../components/ui/StaticBackground';
import WhatsAppModal from '../components/ui/WhatsAppModal';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', displayName: '' });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showWAModal, setShowWAModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/tournaments');
  }, [user, navigate]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  }

  function validate() {
    const errs = {};
    if (!form.email) errs.email = 'Email address required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Please enter a valid email';
    if (mode !== 'forgot') {
      if (!form.password) errs.password = 'Password required';
      else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    }
    if (mode === 'register') {
      if (!form.displayName.trim()) errs.displayName = 'Full name required';
      if (form.password !== form.confirmPassword)
        errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      if (mode === 'forgot') {
        await sendPasswordReset(form.email.trim());
        toast.success('Reset link sent! Check your email inbox (and spam folder).');
        setMode('login');
      } else if (mode === 'login') {
        await signInWithEmail(form.email.trim(), form.password);
        toast.success(`Welcome back, ${form.email.split('@')[0]}!`);
        navigate('/tournaments');
      } else {
        const { session } = await signUpWithEmail(form.email.trim(), form.password, form.displayName);
        if (session) {
          toast.success('Account created! Welcome to Zenith Esports.');
          setShowWAModal(true);
        } else {
          toast.success('Account created! Please check your email to verify.');
          setMode('login');
        }
      }
    } catch (err) {
      toast.error(err?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    if (googleLoading) return;
    setGoogleLoading(true);
    try {
      // Redirects to Google; the session completes back on /auth.
      await signInWithGoogle();
    } catch (err) {
      toast.error(err?.message || 'Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  }

  return (
    <>
    <div className="min-h-screen flex items-start md:items-center justify-center pt-28 pb-8 px-4 md:px-6 md:pb-6 bg-[#0a0a0a] relative overflow-hidden">
      <StaticBackground variant="mesh" />

      {/* Decorative Brand Text */}
      <div className="absolute top-10 left-10 hidden lg:block select-none pointer-events-none">
        <span className="font-bebas text-[10vh] text-white/[0.02] uppercase leading-none block">BEYOND ZENITH</span>
        <span className="font-bebas text-[10vh] text-[#dbb462]/[0.02] uppercase leading-none block">BEYOND COMPETITION</span>
      </div>

      <div className="relative w-full max-w-[1000px] flex flex-col md:flex-row bg-[#111] border border-white/5 shadow-2xl animate-page-enter">

        {/* Left Side: Welcoming Visual */}
        <div className="w-full md:w-1/2 p-12 bg-gradient-to-br from-[#161616] to-[#0a0a0a] flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative group">
          <div className="absolute inset-0 bg-[#dbb462]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />

          <Link to="/" className="relative z-10 hidden md:flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Zenith" className="h-10 w-auto" />
          </Link>

          <div className="relative z-10 space-y-6 my-12">
            <h1 className="font-bebas font-bold text-6xl lg:text-8xl leading-none uppercase tracking-[0.05em]">
              <span className="zenith-gradient-text pr-2">WELCOME</span>
              {mode === 'login' && (
                <>
                  <br />
                  <span className="text-[#dbb462]">BACK</span>
                </>
              )}
            </h1>
            <p className="font-body text-[#d1c5b3] text-lg opacity-40 leading-relaxed max-w-sm">
              The professional circuit for PUBG Mobile. Access your account to manage squad deployments and tournament entries.
            </p>
          </div>



          {/* Large subtle logo watermark on left side */}
          <img src="/logo.png" className="absolute -bottom-20 -left-20 h-80 w-auto opacity-[0.03] grayscale pointer-events-none" />
        </div>

        {/* Right Side: Simple Access Form */}
        <div className="w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-center bg-[#131313]">
          <div className="mb-12">
            <h2 className="font-bebas font-bold text-5xl tracking-[0.05em] text-white mb-2 uppercase">
              {mode === 'login' ? 'ACCESS PORTAL' : mode === 'register' ? 'ACCOUNT CREATION' : 'RESET PASSWORD'}
            </h2>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}
              className="font-teko text-[18px] tracking-[0.2em] text-[#dbb462] uppercase hover:underline"
            >
              {mode === 'login' ? "Register New Account" : 'Return to Login'}
            </button>
            {mode === 'forgot' && (
              <p className="font-body text-sm text-white/40 mt-3 max-w-xs">
                Enter your registered email and we'll send you a link to set a new password.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <label className="font-body text-[11px] font-bold tracking-wider text-white/60 uppercase block">Full Name</label>
                <div className="relative flex items-center">
                  <User className="absolute left-4 text-[#dbb462]/40" size={18} />
                  <input
                    type="text"
                    required
                    value={form.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-[#1a1a1a] border border-white/5 px-12 py-4 font-body text-white text-sm focus:border-[#dbb462]/50 focus:outline-none transition-colors"
                  />
                </div>
                {errors.displayName && <p className="text-red-500 text-[12px] uppercase font-teko tracking-widest">{errors.displayName}</p>}
              </div>
            )}

            <div className="space-y-2">
              <label className="font-body text-[11px] font-bold tracking-wider text-white/60 uppercase block">Email Address</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-4 text-[#dbb462]/40" size={18} />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="name@email.com"
                  className="w-full bg-[#1a1a1a] border border-white/5 px-12 py-4 font-body text-white text-sm focus:border-[#dbb462]/50 focus:outline-none transition-colors"
                />
              </div>
              {errors.email && <p className="text-red-500 text-[12px] uppercase font-teko tracking-widest">{errors.email}</p>}
            </div>

            {mode !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-body text-[11px] font-bold tracking-wider text-white/60 uppercase block">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="font-body text-[10px] font-bold tracking-widest text-[#dbb462]/60 hover:text-[#dbb462] transition-colors"
                >
                  {showPass ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-4 text-[#dbb462]/40" size={18} />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Entry password"
                  className="w-full bg-[#1a1a1a] border border-white/5 px-12 py-4 font-body text-white text-sm focus:border-[#dbb462]/50 focus:outline-none transition-colors"
                />
              </div>
              {errors.password && <p className="text-red-500 text-[12px] uppercase font-teko tracking-widest">{errors.password}</p>}
            </div>
            )}

            {mode === 'register' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500">
                <label className="font-body text-[11px] font-bold tracking-wider text-white/60 uppercase block">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full bg-[#1a1a1a] border border-white/5 px-6 py-4 font-body text-white text-sm focus:border-[#dbb462]/50 focus:outline-none transition-colors"
                />
                {errors.confirmPassword && <p className="text-red-500 text-[12px] uppercase font-teko tracking-widest">{errors.confirmPassword}</p>}
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full bg-[#dbb462] text-[#402d00] font-bebas text-3xl py-5 tracking-widest hover:brightness-110 active:scale-[0.98] transition-all overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? 'PROCESSING...' : mode === 'login' ? 'SIGN IN' : mode === 'register' ? 'REGISTER' : 'SEND RESET LINK'}
                  {!loading && <ArrowRight size={24} className="translate-x-0 group-hover:translate-x-2 transition-transform" />}
                </div>
              </button>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setErrors({}); }}
                  className="w-full mt-4 font-teko text-[14px] tracking-[0.25em] text-[#d1c5b3]/50 hover:text-[#dbb462] uppercase transition-colors"
                >
                  Forgot Password?
                </button>
              )}
            </div>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-[1px] bg-white/10" />
            <span className="font-label text-[12px] tracking-[0.3em] text-white/30 uppercase">or</span>
            <div className="flex-1 h-[1px] bg-white/10" />
          </div>

          {/* ── Google OAuth ── */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="btn-obsidian-ghost w-full py-4 font-display text-xl tracking-widest uppercase flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-wait"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a11.99 11.99 0 0 0 0 10.76l3.98-3.09z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
            </svg>
            {googleLoading ? 'REDIRECTING…' : 'CONTINUE WITH GOOGLE'}
          </button>

          <p className="mt-12 font-body text-[10px] text-white/40 text-center tracking-wider uppercase leading-relaxed max-w-xs mx-auto">
            By continuing, you agree to the Zenith Esports Protocol and Fair Play Governance.
          </p>
        </div>
      </div>
    </div>
    <WhatsAppModal isOpen={showWAModal} onClose={() => { setShowWAModal(false); navigate('/tournaments'); }} />
    </>
  );
}
