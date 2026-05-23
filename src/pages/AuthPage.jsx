import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, MessageCircle } from 'lucide-react';
import { signInWithEmail, signUpWithEmail } from '../supabase/auth';
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
    if (!form.password) errs.password = 'Password required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
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
      if (mode === 'login') {
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

  return (
    <>
    <div className="min-h-screen flex items-start md:items-center justify-center pt-28 pb-8 px-4 md:p-6 bg-[#0a0a0a] relative overflow-hidden">
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
              {mode === 'login' ? 'ACCESS PORTAL' : 'ACCOUNT CREATION'}
            </h2>
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}); }}
              className="font-teko text-[18px] tracking-[0.2em] text-[#dbb462] uppercase hover:underline"
            >
              {mode === 'login' ? "Register New Account" : 'Return to Login'}
            </button>
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
                  {loading ? 'PROCESSING...' : mode === 'login' ? 'SIGN IN' : 'REGISTER'}
                  {!loading && <ArrowRight size={24} className="translate-x-0 group-hover:translate-x-2 transition-transform" />}
                </div>
              </button>
            </div>
          </form>

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
