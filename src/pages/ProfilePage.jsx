import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSupabaseDB } from '../hooks/useSupabaseDB';
import { useTournaments } from '../hooks/useTournaments';
import { supabase } from '../supabase/config';
import GhostInput from '../components/ui/GhostInput';
import StatusBadge from '../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { Save, User, Shield, Users, Phone, Trophy, Clock, CheckCircle2, XCircle, ChevronRight, AlertTriangle, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getGame } from '../config/games';

export default function ProfilePage() {
  const { user, userDoc, loading, refreshProfile } = useAuth();
  const { tournaments } = useTournaments();

  // My registrations — scoped to this user only
  const { data: myRegistrations, loading: regsLoading, update: updateMyReg } = useSupabaseDB(
    'registrations',
    { field: 'created_at', direction: 'desc' },
    user ? [['user_id', 'eq', user.id]] : null
  );

  const [withdrawingId, setWithdrawingId] = useState(null);
  async function handleWithdraw(reg) {
    if (!confirm(`Withdraw "${reg.team_name}" from this tournament? You can re-register later while registration is open.`)) return;
    setWithdrawingId(reg.id);
    try {
      await updateMyReg(reg.id, { status: 'withdrawn' });
      toast.success('Registration withdrawn.');
    } catch (err) {
      toast.error(`Could not withdraw: ${err.message}`);
    } finally {
      setWithdrawingId(null);
    }
  }

  const [form, setForm] = useState({
    displayName: '',
    whatsapp_number: '',
    captain_discord: '',
    team_name: '',
    player_1_id: '', player_1_ign: '',
    player_2_id: '', player_2_ign: '',
    player_3_id: '', player_3_ign: '',
    player_4_id: '', player_4_ign: '',
    player_5_id: '', player_5_ign: '',
    player_6_id: '', player_6_ign: '',
  });

  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile'); // 'profile' | 'registrations'

  useEffect(() => {
    if (userDoc) {
      const pids = userDoc.player_ids || [];
      const pigns = userDoc.player_igns || [];
      setForm({
        displayName: userDoc.display_name || '',
        whatsapp_number: userDoc.whatsapp_number || '',
        captain_discord: userDoc.captain_discord || '',
        team_name: userDoc.team_name || '',
        player_1_id: pids[0] || '', player_1_ign: pigns[0] || '',
        player_2_id: pids[1] || '', player_2_ign: pigns[1] || '',
        player_3_id: pids[2] || '', player_3_ign: pigns[2] || '',
        player_4_id: pids[3] || '', player_4_ign: pigns[3] || '',
        player_5_id: pids[4] || '', player_5_ign: pigns[4] || '',
        player_6_id: pids[5] || '', player_6_ign: pigns[5] || '',
      });
    }
  }, [userDoc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-28 px-6 md:px-12 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-16 h-[2px] zenith-gradient" />
          <span className="font-bebas text-3xl text-[#dbb462] tracking-widest">LOADING PROFILE</span>
          <div className="w-16 h-[2px] zenith-gradient" />
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // WhatsApp validation
    const waClean = form.whatsapp_number.trim().replace(/[^0-9]/g, '');
    if (form.whatsapp_number.trim() && waClean.length !== 11) {
      return toast.error('WhatsApp number must be exactly 11 digits (e.g. 03XXXXXXXXX)');
    }

    setSaving(true);
    try {
      let responseError = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        const { error } = await supabase
          .from('users')
          .update({
            display_name: form.displayName,
            whatsapp_number: waClean || null,
            captain_discord: form.captain_discord,
            team_name: form.team_name,
            player_ids: [
              form.player_1_id, form.player_2_id, form.player_3_id,
              form.player_4_id, form.player_5_id, form.player_6_id,
            ].map(id => id?.trim()).filter(Boolean),
            player_igns: [
              form.player_1_ign, form.player_2_ign, form.player_3_ign,
              form.player_4_ign, form.player_5_ign, form.player_6_ign,
            ],
          })
          .eq('id', user.id);

        responseError = error;
        if (!error || !error.message?.includes('Lock')) break;
        await new Promise(r => setTimeout(r, 300));
      }

      if (responseError) throw responseError;
      toast.success('Profile updated! Your data will auto-fill during registrations.');
      await refreshProfile(user.id);
    } catch (err) {
      toast.error('Failed to save profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-24 animate-page-enter relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#dbb462]/[0.04] blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">

        {/* Header */}
        <div className="mb-10 border-b border-[rgba(78,70,56,0.15)] pb-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
          <div>
            <span className="font-teko text-[#dbb462] text-[16px] tracking-[0.25em] block mb-3 uppercase">
              Player Command Center
            </span>
            <h1 className="font-bebas text-5xl md:text-7xl tracking-tight uppercase leading-[0.85]">
              <span className="text-[#f2f2f2]">PLAYER</span>{' '}
              <span className="zenith-gradient-text">PROFILE</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 bg-[#111] border border-white/5 p-4 hover:border-[#dbb462]/20 transition-all">
            <div className="w-12 h-12 bg-[#0e0e0e] border border-[#dbb462]/30 flex items-center justify-center">
              <User size={20} className="text-[#dbb462]" />
            </div>
            <div>
              <p className="font-bebas text-2xl text-white">{userDoc?.display_name || 'PLAYER'}</p>
              <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-40 uppercase">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Section Toggle */}
        <div className="flex gap-[1px] bg-white/[0.04] mb-10 max-w-sm">
          {[
            { id: 'profile',       label: 'PROFILE', icon: User },
            { id: 'registrations', label: 'MY HISTORY', icon: Trophy },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-teko text-[14px] tracking-widest transition-all duration-300 uppercase ${
                activeSection === id
                  ? 'bg-[#dbb462] text-[#402d00]'
                  : 'bg-[#0e0e0e] text-[#d1c5b3] opacity-60 hover:opacity-100'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── Profile Section ── */}
        {activeSection === 'profile' && (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* Left Column - Personal Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#111] border border-white/5 hover:border-[rgba(78,70,56,0.3)] transition-colors p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#dbb462]/40 to-transparent" />
                <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                  <Shield size={16} className="text-[#dbb462]" />
                  <h2 className="font-bebas text-3xl text-white">PLAYER INFO</h2>
                </div>
                <div className="space-y-6">
                  <GhostInput
                    id="displayName"
                    label="Full Name"
                    value={form.displayName}
                    onChange={(e) => handleChange('displayName', e.target.value)}
                    placeholder="Muhammad Ali"
                  />
                  <div className="relative">
                    <Phone size={14} className="absolute right-0 top-1 text-[#d1c5b3] opacity-30" />
                    <GhostInput
                      id="whatsapp"
                      label="WhatsApp (11 digits)"
                      value={form.whatsapp_number}
                      onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                      placeholder="03XXXXXXXXX"
                    />
                  </div>
                  <GhostInput
                    id="discord"
                    label="Captain's Discord"
                    value={form.captain_discord}
                    onChange={(e) => handleChange('captain_discord', e.target.value)}
                    placeholder="Discord Username"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Team Roster */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#111] border border-white/5 hover:border-[rgba(78,70,56,0.3)] transition-colors p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#dbb462]/40 to-transparent" />
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#dbb462]/[0.03] blur-[80px] pointer-events-none" />

                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-[#dbb462]" />
                    <h2 className="font-bebas text-3xl text-white uppercase">SAVED SQUAD</h2>
                  </div>
                  <span className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-40 uppercase">CHARACTER IDs</span>
                </div>

                <div className="space-y-8 relative z-10">
                  <GhostInput
                    id="teamName"
                    label="Team Name"
                    value={form.team_name}
                    onChange={(e) => handleChange('team_name', e.target.value)}
                    placeholder="e.g. 100 Thieves"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <div key={num} className="relative group bg-[#0e0e0e] p-4 border border-white/5 hover:border-[#dbb462]/20 transition-colors space-y-4">
                        <span className="absolute -left-3 -top-3 w-6 h-6 flex items-center justify-center zenith-gradient font-bebas text-sm text-[#131313]">
                          {num}
                        </span>
                        <GhostInput
                          id={`player_${num}_ign`}
                          label={num <= 4 ? `Player ${num} IGN *` : `Substitute ${num} IGN`}
                          value={form[`player_${num}_ign`]}
                          onChange={(e) => handleChange(`player_${num}_ign`, e.target.value)}
                          placeholder="In-Game Name"
                        />
                        <GhostInput
                          id={`player_${num}_id`}
                          label={num <= 4 ? `Player ${num} ID *` : `Substitute ${num} ID`}
                          value={form[`player_${num}_id`]}
                          onChange={(e) => handleChange(`player_${num}_id`, e.target.value)}
                          placeholder="5XXXXXXXXXX"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-obsidian-primary w-full md:w-auto px-16 py-5 font-bebas text-3xl tracking-widest uppercase disabled:opacity-50 disabled:cursor-wait"
                >
                  {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── My Registrations Section ── */}
        {activeSection === 'registrations' && (
          <div className="animate-page-enter space-y-6">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-8 h-[2px] bg-[#dbb462]" />
              <h2 className="font-bebas text-4xl text-[#f2f2f2] uppercase">Tournament History</h2>
            </div>

            {regsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-[#111] border border-white/5 h-28 animate-pulse" />
                ))}
              </div>
            ) : myRegistrations.length === 0 ? (
              <div className="text-center py-24 bg-[#0e0e0e] border border-white/5">
                <Trophy className="text-[#dbb462] opacity-10 mx-auto mb-6" size={64} />
                <p className="font-bebas text-4xl text-white/20 mb-2 uppercase">No Registrations Yet</p>
                <p className="font-teko text-[14px] tracking-[0.2em] text-[#d1c5b3] opacity-30 uppercase mb-8">
                  Register for a tournament to see your history here
                </p>
                <Link
                  to="/tournaments"
                  className="btn-obsidian-primary font-bebas text-[20px] px-10 py-4 tracking-widest uppercase inline-flex items-center gap-3"
                >
                  Browse Tournaments <ChevronRight size={18} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myRegistrations.map(reg => {
                  const tournament = tournaments.find(t => t.id === reg.tournament_id);
                  const division = getGame(tournament?.game);
                  const regDate = reg.created_at
                    ? new Date(reg.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '—';
                  const canWithdraw = ['pending', 'reapplied', 'approved'].includes(reg.status);

                  return (
                    <div
                      key={reg.id}
                      className="bg-[#111] border border-white/5 hover:border-[rgba(78,70,56,0.3)] transition-all duration-300 p-6 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#dbb462] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {reg.logo_url ? (
                            <img src={reg.logo_url} alt="" className="w-10 h-10 object-cover border border-[#dbb462]/20 flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 zenith-gradient flex items-center justify-center font-bebas text-lg text-[#131313] flex-shrink-0">
                              {reg.team_name?.[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bebas text-xl text-white leading-none uppercase truncate">{reg.team_name}</p>
                              <span className="font-teko text-[10px] tracking-[0.15em] uppercase px-1.5 py-0.5 border leading-none shrink-0" style={{ color: division.accent, borderColor: division.accent + '44', backgroundColor: division.accentSoft }}>
                                {division.short}
                              </span>
                            </div>
                            <p className="font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-50 uppercase mt-1">
                              {tournament?.title || reg.tournament_id}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={reg.status} />
                      </div>

                      {reg.status === 'rejected' && reg.rejection_reason && (
                        <div className="bg-red-500/10 border border-red-500/20 p-3 mb-4 flex items-start gap-2">
                          <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="font-teko text-[12px] tracking-widest text-red-400 uppercase leading-relaxed">
                            {reg.rejection_reason}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3">
                        <span className="font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-40 uppercase">
                          Registered {regDate}
                        </span>
                        <div className="flex items-center gap-3">
                          {canWithdraw && (
                            <button
                              onClick={() => handleWithdraw(reg)}
                              disabled={withdrawingId === reg.id}
                              className="font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-50 hover:opacity-100 hover:text-red-400 uppercase transition-all flex items-center gap-1 disabled:opacity-30"
                              title="Withdraw this registration"
                            >
                              <LogOut size={12} /> {withdrawingId === reg.id ? '...' : 'Withdraw'}
                            </button>
                          )}
                          {tournament && (
                            <Link
                              to={`/tournaments/${tournament.id}`}
                              className="font-teko text-[12px] tracking-widest text-[#dbb462] opacity-60 hover:opacity-100 uppercase transition-opacity flex items-center gap-1"
                            >
                              View <ChevronRight size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
