import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, KeyRound, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { updatePassword } from '../supabase/auth';
import { useAuth } from '../hooks/useAuth';
import StaticBackground from '../components/ui/StaticBackground';

/**
 * ResetPasswordPage — landing page for Supabase recovery links (/auth/reset).
 * The recovery token in the URL establishes a session (detectSessionInUrl),
 * after which the user can set a new password.
 */
export default function ResetPasswordPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (password.length < 6) return toast.error('Password must be at least 6 characters.');
    if (password !== confirm) return toast.error('Passwords do not match.');

    setSaving(true);
    try {
      await updatePassword(password);
      toast.success('Password updated! You are signed in.');
      navigate('/tournaments');
    } catch (err) {
      toast.error(err?.message || 'Could not update password. Request a new reset link.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-[2px] bg-[#dbb462] animate-pulse" />
        <span className="font-display text-3xl text-[#dbb462] tracking-widest">Verifying Link</span>
        <div className="w-12 h-[2px] bg-[#dbb462] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-28 px-6 flex items-center justify-center animate-page-enter">
        <div className="max-w-md w-full bg-[#131313] border border-white/5 p-12 text-center space-y-6">
          <KeyRound size={36} className="mx-auto text-[#dbb462] opacity-40" />
          <h1 className="font-display text-4xl text-white tracking-wider">Link Expired</h1>
          <p className="font-body text-sm text-white/40 leading-relaxed">
            This password reset link is invalid or has expired. Request a fresh one from the login page.
          </p>
          <Link
            to="/auth"
            className="inline-block btn-obsidian-ghost px-10 py-3 font-display text-lg tracking-widest"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center pt-28 pb-8 px-4 bg-[#0a0a0a] relative overflow-hidden">
      <StaticBackground variant="mesh" />

      <div className="relative w-full max-w-md bg-[#131313] border border-white/5 shadow-2xl p-12 animate-page-enter">
        <div className="absolute top-0 left-0 right-0 h-[2px] zenith-gradient" />

        <div className="mb-10">
          <h1 className="font-display font-bold text-5xl tracking-[0.05em] text-white mb-2">New Password</h1>
          <p className="font-label text-[14px] tracking-[0.15em] text-[#d1c5b3] opacity-50 uppercase">
            Set a new password for {user.email}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-body text-[11px] font-bold tracking-wider text-white/60 uppercase block">New Password</label>
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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full bg-[#1a1a1a] border border-white/5 px-12 py-4 font-body text-white text-sm focus:border-[#dbb462]/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-body text-[11px] font-bold tracking-wider text-white/60 uppercase block">Confirm Password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your new password"
              className="w-full bg-[#1a1a1a] border border-white/5 px-6 py-4 font-body text-white text-sm focus:border-[#dbb462]/50 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="group relative w-full bg-[#dbb462] text-[#402d00] font-display text-2xl py-4 tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {saving ? 'UPDATING…' : 'UPDATE PASSWORD'}
              {!saving && <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
