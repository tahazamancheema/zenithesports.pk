import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Users, CheckCircle2, XCircle, Split,
  Plus, Edit2, Trash2, BarChart3,
  Eye, X, ToggleLeft, ToggleRight, Clock, Calendar,
  FileText, Map, ListOrdered, Search, RefreshCw, Trophy, TrendingUp,
  Megaphone, Shield, User,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../supabase/config';
import { useSupabaseDB } from '../hooks/useSupabaseDB';
import { useTournaments } from '../hooks/useTournaments';
import { partitionTeamsIntoGroups, assignGroupsToSupabase } from '../utils/groupPartitioner';
import { exportRegistrationsToXLSX } from '../utils/xlsxExport';
import { computeTournamentStatus } from '../utils/tournamentStatus';
import GradientButton from '../components/ui/GradientButton';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import GhostInput from '../components/ui/GhostInput';
import { uploadFile, getSignedProofUrl } from '../utils/storage';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const {
    data: registrations,
    add: addReg,
    update: updateReg,
    remove: removeReg,
  } = useSupabaseDB('registrations', { field: 'created_at', direction: 'desc' });

  const { tournaments, add: addTournament, update: updateTournament, remove: removeTournament } = useTournaments();

  const {
    data: announcements,
    add: addAnnouncement,
    update: updateAnnouncement,
    remove: removeAnnouncement,
  } = useSupabaseDB('announcements', { field: 'created_at', direction: 'desc' });

  const [activeTab, setActiveTab] = useState('overview');
  // Tournament create/edit modal
  const [tournamentModal, setTournamentModal] = useState({ open: false, data: null });
  // Per-tournament registration panel
  const [regsModal, setRegsModal] = useState(null); // tournament object
  // Per-tournament groups panel
  const [groupsModal, setGroupsModal] = useState(null); // tournament object
  // Inline registration edit modal
  const [registrationModal, setRegistrationModal] = useState({ open: false, data: null, tournamentId: null });
  // Rejection reason modal
  const [rejectModal, setRejectModal] = useState({ open: false, reg: null, reason: 'Incorrect Player ID / Incomplete Screenshots' });
  // Tournament search
  const [tournamentSearch, setTournamentSearch] = useState('');

  // Auth guard
  React.useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate('/');
    }
  }, [user, isAdmin, authLoading, navigate]);

  // ── Registration actions ──
  async function handleApprove(reg) {
    await updateReg(reg.id, { status: 'approved' });
    toast.success(`${reg.team_name} approved!`);
  }
  async function handleReject(reg) {
    setRejectModal({ open: true, reg, reason: 'Incorrect Player ID / Incomplete Screenshots' });
  }
  async function confirmReject() {
    const { reg, reason } = rejectModal;
    if (!reason.trim()) return toast.error('Rejection reason is required');
    await updateReg(reg.id, {
      status: 'rejected',
      rejection_reason: reason.trim(),
      group_id: null,
    });
    toast.success(`${reg.team_name} rejected`);
    setRejectModal({ open: false, reg: null, reason: '' });
  }
  async function handleDelete(reg) {
    if (!confirm(`Delete ${reg.team_name}? This cannot be undone.`)) return;
    try {
      await removeReg(reg.id);
      toast.success('Registration deleted');
    } catch (e) {
      toast.error(`Failed to delete: ${e.message}`);
      console.error('Delete error:', e);
    }
  }

  // ── XLSX Export (tournament-scoped) ──
  function handleExport(tournament, type = 'all') {
    let filtered = registrations.filter((r) => r.tournament_id === tournament.id);
    
    if (type === 'verified' || type === 'approved') {
      filtered = filtered.filter(r => r.status === 'approved');
    } else if (type === 'rejected') {
      filtered = filtered.filter(r => r.status === 'rejected');
    }

    if (filtered.length === 0) {
      return toast.error(`No ${type} records found to export.`);
    }

    // Strip out all characters that are unsafe for Windows filenames
    const safeTitle = tournament.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    exportRegistrationsToXLSX(filtered, `zenith_${safeTitle}_${type}`);
    toast.success(`XLSX exported: ${filtered.length} ${type} records`);
  }

  if (authLoading) return <LoadingScreen />;
  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#131313] pt-28">
      <div className="flex animate-page-enter">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 bg-[#131313] border-r border-[rgba(78,70,56,0.15)] min-h-[calc(100vh-7rem)] shrink-0">
          <div className="p-8">
            <h2 className="font-bebas text-2xl font-bold text-[#dbb462] tracking-widest">ZENITH DASHBOARD</h2>
            <p className="font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-60 mt-1">ADMIN OVERVIEW</p>
          </div>

          <nav className="flex-1 space-y-1">
            {[
              { id: 'overview',      icon: TrendingUp, label: 'Overview' },
              { id: 'tournaments',   icon: BarChart3,  label: 'Tournaments' },
              { id: 'announcements', icon: Megaphone,  label: 'Announcements' },
              { id: 'users',         icon: Users,      label: 'Users' },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  w-full flex items-center gap-4 px-8 py-4
                  font-teko text-[14px] tracking-widest text-left
                  transition-all duration-200 ease-out
                  ${activeTab === id
                    ? 'text-[#f9d07a] bg-[#1f1f1f] border-l-4 border-[#f9d07a]'
                    : 'text-[#d1c5b3] opacity-70 hover:opacity-100 hover:bg-[#2a2a2a]'
                  }
                `}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </nav>

          <div className="px-6 pb-8">
            <GradientButton
              className="w-full"
              onClick={() => setTournamentModal({ open: true, data: null })}
              icon={Plus}
            >
              CREATE TOURNAMENT
            </GradientButton>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-auto">

          {/* ── Mobile Tab Bar ── */}
          <div className="md:hidden sticky top-28 z-20 bg-[#0f0f0f] border-b border-[rgba(78,70,56,0.2)]">
            <div className="flex overflow-x-auto no-scrollbar">
              {[
                { id: 'overview',      icon: TrendingUp, label: 'Overview' },
                { id: 'tournaments',   icon: BarChart3,  label: 'Tournaments' },
                { id: 'announcements', icon: Megaphone,  label: 'News' },
                { id: 'users',         icon: Users,      label: 'Users' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 min-w-max flex items-center justify-center gap-2 px-4 py-3 font-teko text-[13px] tracking-widest uppercase transition-all border-b-2 ${
                    activeTab === id
                      ? 'text-[#f9d07a] border-[#f9d07a] bg-[#1a1a1a]'
                      : 'text-[#d1c5b3] opacity-50 border-transparent'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
              <button
                onClick={() => setTournamentModal({ open: true, data: null })}
                className="px-4 py-3 font-teko text-[13px] tracking-widest uppercase flex items-center gap-1.5 bg-[#dbb462] text-[#402d00] shrink-0"
              >
                <Plus size={14} />
                NEW
              </button>
            </div>
          </div>

          <div className="p-4 md:p-8 lg:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="font-bebas text-4xl md:text-6xl font-black italic tracking-wider uppercase">
                ZENITH ADMIN
              </h1>
              <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-70 mt-2">
                REAL-TIME MANAGEMENT & GRID LOGISTICS
              </p>
            </div>
          </div>

          {/* ── Quick Stats Strip ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[rgba(78,70,56,0.15)] mb-10">
            <QuickStatCard icon={Trophy}       label="TOURNAMENTS"        value={tournaments.length} />
            <QuickStatCard icon={Users}        label="TOTAL REGISTRATIONS" value={registrations.length} />
            <QuickStatCard icon={Clock}        label="PENDING APPROVAL"   value={registrations.filter(r => r.status === 'pending').length}  highlight />
            <QuickStatCard icon={CheckCircle2} label="APPROVED TEAMS"     value={registrations.filter(r => r.status === 'approved').length} />
          </div>

          {activeTab === 'overview' && (
            <AnalyticsTab tournaments={tournaments} registrations={registrations} />
          )}

          {activeTab === 'tournaments' && (
            <div className="space-y-4">
              {/* Tournament Search */}
              <div className="flex items-center gap-3 bg-[#1b1b1b] border border-[rgba(78,70,56,0.2)] px-4 py-3 max-w-sm">
                <Search size={14} className="text-[#d1c5b3] opacity-50 shrink-0" />
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={tournamentSearch}
                  onChange={e => setTournamentSearch(e.target.value)}
                  className="bg-transparent text-sm font-teko tracking-widest text-[#d1c5b3] placeholder:opacity-50 focus:outline-none w-full"
                />
                {tournamentSearch && (
                  <button onClick={() => setTournamentSearch('')} className="text-[#d1c5b3] opacity-40 hover:opacity-100">
                    <X size={12} />
                  </button>
                )}
              </div>
            <TournamentsTab
              tournaments={tournaments.filter(t => !tournamentSearch || t.title.toLowerCase().includes(tournamentSearch.toLowerCase()))}
              registrations={registrations}
              onEdit={(t) => setTournamentModal({ open: true, data: t })}
              onDelete={async (t) => {
                if (!confirm(`CAUTION: This will delete the tournament "${t.title}" and ALL associated registrations. Proceed?`)) return;
                
                const toastId = toast.loading('Initiating tactical deletion...');
                try {
                  const { error: regErr } = await supabase
                    .from('registrations')
                    .delete()
                    .eq('tournament_id', t.id);
                  
                  if (regErr) throw regErr;
                  
                  await removeTournament(t.id);
                  toast.success('Tournament and all data purged successfully.', { id: toastId });
                } catch (err) {
                  console.error('Purge Failed:', err);
                  toast.error(`Purge Failed: ${err.message}`, { id: toastId });
                }
              }}
              onViewRegs={(t) => setRegsModal(t)}
              onViewGroups={(t) => setGroupsModal(t)}
              onExport={handleExport}
            />
            </div>
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsTab
              announcements={announcements}
              onAdd={addAnnouncement}
              onUpdate={updateAnnouncement}
              onRemove={removeAnnouncement}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab currentUserId={user?.id} />
          )}
          </div>{/* end padding wrapper */}
        </main>
      </div>

      {/* ── Tournament Create/Edit Modal ── */}
      <TournamentModal
        isOpen={tournamentModal.open}
        onClose={() => setTournamentModal({ open: false, data: null })}
        tournament={tournamentModal.data}
        onSave={async (data, file) => {
          try {
            let posterUrl = data.poster_url;
            if (file) {
              toast.loading('Uploading poster...', { id: 'upload-poster' });
              posterUrl = await uploadFile('ze-posters', file, `poster_${Date.now()}`);
              toast.success('Poster uploaded!', { id: 'upload-poster' });
            }
            // Compute and store status
            const withStatus = { ...data, poster_url: posterUrl };
            withStatus.status = computeTournamentStatus(withStatus);
            if (!withStatus.start_date) withStatus.start_date = null;
            if (!withStatus.end_date) withStatus.end_date = null;
            if (!withStatus.registration_deadline) withStatus.registration_deadline = null;
            if (!withStatus.registration_open_date) withStatus.registration_open_date = null;

            if (tournamentModal.data) {
              await updateTournament(tournamentModal.data.id, withStatus);
              toast.success('Tournament updated!');
            } else {
              await addTournament(withStatus);
              toast.success('Tournament created!');
            }
            setTournamentModal({ open: false, data: null });
          } catch (err) {
            toast.error(`Failed: ${err.message}`, { id: 'upload-poster', duration: 8000 });
            throw err;
          }
        }}
      />

      {/* ── Registrations Panel Modal ── */}
      {regsModal && (
        <TournamentRegsModal
          tournament={regsModal}
          registrations={registrations.filter((r) => r.tournament_id === regsModal.id)}
          onClose={() => setRegsModal(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onDelete={handleDelete}
          onExport={(type) => handleExport(regsModal, type)}
          onEdit={(reg) => {
            setRegistrationModal({ open: true, data: reg, tournamentId: regsModal.id });
          }}
          onAdd={() => {
            setRegistrationModal({ open: true, data: null, tournamentId: regsModal.id });
          }}
        />
      )}

      {/* ── Groups Panel Modal ── */}
      {groupsModal && (
        <TournamentGroupsModal
          tournament={groupsModal}
          registrations={registrations.filter(
            (r) => r.tournament_id === groupsModal.id && r.status === 'approved'
          )}
          allRegistrations={registrations.filter((r) => r.tournament_id === groupsModal.id)}
          updateReg={updateReg}
          onClose={() => setGroupsModal(null)}
        />
      )}

      {/* ── Registration Add/Edit Modal ── */}
      <RegistrationModal
        isOpen={registrationModal.open}
        onClose={() => setRegistrationModal({ open: false, data: null, tournamentId: null })}
        registration={registrationModal.data}
        tournament={tournaments.find((t) => t.id === registrationModal.tournamentId) || null}
        onSave={async (data, file) => {
          try {
            let logoUrl = data.logo_url;
            if (file) {
              toast.loading('Uploading logo...', { id: 'upload-logo' });
              logoUrl = await uploadFile('ze-logos', file, `logo_${Date.now()}`);
              toast.success('Logo uploaded!', { id: 'upload-logo' });
            }
            const finalData = { ...data, logo_url: logoUrl, group_id: data.group_id || null };
            if (registrationModal.data) {
              await updateReg(registrationModal.data.id, finalData);
              toast.success('Registration updated!');
            } else {
              // Manually added teams are owned by the admin account (user_id is NOT NULL)
              await addReg({ ...finalData, user_id: user.id, status: finalData.status || 'pending' });
              toast.success('Registration added!');
            }
            setRegistrationModal({ open: false, data: null, tournamentId: null });
          } catch (err) {
            toast.error(`Failed: ${err.message}`, { id: 'upload-logo' });
            throw err;
          }
        }}
      />

      {/* ── Rejection Reason Modal ── */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131313] border border-red-500/20 w-full max-w-md mx-4 p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500/60 to-transparent" />
            <h3 className="font-bebas text-2xl text-red-400 mb-1 uppercase tracking-widest">Reject Registration</h3>
            <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-60 mb-6 uppercase">
              {rejectModal.reg?.team_name}
            </p>
            <label className="font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-70 uppercase block mb-2">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={rejectModal.reason}
              onChange={e => setRejectModal(m => ({ ...m, reason: e.target.value }))}
              rows={3}
              autoFocus
              className="w-full bg-[#0e0e0e] border border-red-500/20 p-3 text-sm text-[#e2e2e2] focus:outline-none focus:border-red-400/50 transition-colors resize-none mb-6 font-mono"
              placeholder="e.g. Incorrect Player ID / Incomplete Screenshots"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRejectModal({ open: false, reg: null, reason: '' })}
                className="flex-1 border border-white/10 py-3 font-teko text-[13px] tracking-widest text-[#d1c5b3] hover:bg-white/5 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 py-3 font-teko text-[13px] tracking-widest hover:bg-red-500/20 transition-colors"
              >
                CONFIRM REJECT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Analytics Tab
// ─────────────────────────────────────────────────────────────
function AnalyticsTab({ tournaments, registrations }) {
  const totalPrize = tournaments.reduce((sum, t) => sum + (Number(t.prize_pool) || 0), 0);
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const rejectedCount = registrations.filter(r => r.status === 'rejected').length;
  const approvalRate = registrations.length > 0
    ? Math.round((approvedCount / registrations.length) * 100)
    : 0;

  const byTournament = tournaments.map(t => {
    const regs = registrations.filter(r => r.tournament_id === t.id);
    return {
      ...t,
      total: regs.length,
      approved: regs.filter(r => r.status === 'approved').length,
      pending: regs.filter(r => r.status === 'pending').length,
      rejected: regs.filter(r => r.status === 'rejected').length,
    };
  }).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-8 animate-page-enter">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-[1px] bg-[rgba(78,70,56,0.15)]">
        <AnalyticCard label="Total Prize Value" value={`PKR ${Number(totalPrize).toLocaleString('en-PK')}`} gold />
        <AnalyticCard label="Approval Rate" value={`${approvalRate}%`} />
        <AnalyticCard label="Avg Teams / Tournament" value={tournaments.length ? Math.round(registrations.length / tournaments.length) : 0} />
        <AnalyticCard label="Approved Teams" value={approvedCount} gold />
        <AnalyticCard label="Pending Review" value={pendingCount} highlight />
        <AnalyticCard label="Rejected" value={rejectedCount} />
      </div>

      {/* Per-Tournament Breakdown */}
      <div>
        <h3 className="font-bebas text-2xl text-[#f9d07a] tracking-widest mb-4 uppercase">Registration Breakdown</h3>
        <div className="space-y-3">
          {byTournament.length === 0 ? (
            <div className="text-center py-10 bg-[#1b1b1b]">
              <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-40">NO DATA YET</p>
            </div>
          ) : (
            byTournament.map(t => {
              const maxBar = Math.max(...byTournament.map(x => x.total), 1);
              return (
                <div key={t.id} className="bg-[#1b1b1b] border border-[rgba(78,70,56,0.15)] p-5 hover:border-[rgba(78,70,56,0.3)] transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <p className="font-bebas text-lg leading-tight text-white">{t.title}</p>
                      <span className={`font-teko text-[11px] tracking-widest px-2 py-0.5 uppercase border ${
                        t.status === 'registrations_open' ? 'border-emerald-500/30 text-emerald-400' :
                        t.status === 'in_progress' ? 'border-blue-500/30 text-blue-400' :
                        'border-[rgba(78,70,56,0.3)] text-[#d1c5b3]'
                      }`}>{t.status?.replace('_', ' ')}</span>
                    </div>
                    <span className="font-bebas text-2xl text-[#f9d07a]">{t.total}</span>
                  </div>
                  {/* Visual bar */}
                  <div className="w-full bg-[#0e0e0e] h-2 mb-3 overflow-hidden">
                    <div className="h-full zenith-gradient transition-all duration-1000" style={{ width: `${(t.total / maxBar) * 100}%` }} />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="font-bebas text-xl text-emerald-400">{t.approved}</p>
                      <p className="font-teko text-[10px] tracking-widest text-[#d1c5b3] opacity-40 uppercase">Approved</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bebas text-xl text-yellow-500">{t.pending}</p>
                      <p className="font-teko text-[10px] tracking-widest text-[#d1c5b3] opacity-40 uppercase">Pending</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bebas text-xl text-red-400">{t.rejected}</p>
                      <p className="font-teko text-[10px] tracking-widest text-[#d1c5b3] opacity-40 uppercase">Rejected</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function AnalyticCard({ label, value, gold, highlight }) {
  return (
    <div className={`bg-[#1b1b1b] p-6 ${highlight ? 'border-l-2 border-[#f9d07a]' : ''}`}>
      <p className="font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-60 uppercase mb-2">{label}</p>
      <p className={`font-bebas text-3xl ${gold ? 'text-[#f9d07a]' : highlight ? 'text-[#f9d07a]' : 'text-white'}`}>{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tournaments Tab
// ─────────────────────────────────────────────────────────────
function TournamentsTab({ tournaments, registrations, onEdit, onDelete, onViewRegs, onViewGroups, onExport }) {
  return (
    <div className="space-y-4">
      {tournaments.length === 0 ? (
        <div className="text-center py-20 bg-[#1b1b1b]">
          <p className="font-teko text-[14px] tracking-widest text-[#d1c5b3] opacity-70">
            NO TOURNAMENTS YET — CREATE ONE ABOVE
          </p>
        </div>
      ) : (
        tournaments.map((t) => {
          const regCount = registrations.filter(
            (r) => r.tournament_id === t.id && r.status !== 'rejected'
          ).length;
          const approvedCount = registrations.filter(
            (r) => r.tournament_id === t.id && r.status === 'approved'
          ).length;
          const pendingCount = registrations.filter(
            (r) => r.tournament_id === t.id && r.status === 'pending'
          ).length;
          const capacityPct = t.max_teams ? Math.min((approvedCount / t.max_teams) * 100, 100) : 0;
          const prizeFormatted = t.prize_pool ? `PKR ${Number(t.prize_pool).toLocaleString('en-PK')}` : null;

          return (
            <div
              key={t.id}
              className="bg-[#1b1b1b] border border-[rgba(78,70,56,0.2)] hover:border-[rgba(78,70,56,0.4)] transition-colors overflow-hidden"
            >
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-5 md:p-6 border-b border-[rgba(78,70,56,0.1)] gap-4">
                <div className="flex flex-row items-center gap-4 md:gap-6">
                  {/* Poster thumbnail */}
                  <div className="w-14 h-14 bg-[#0e0e0e] border border-[rgba(78,70,56,0.2)] flex-shrink-0 overflow-hidden">
                    {t.poster_url ? (
                      <img src={t.poster_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy size={20} className="text-[#f9d07a] opacity-20" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-bebas text-xl md:text-2xl font-bold leading-tight">{t.title}</p>
                      <StatusBadge status={t.status} />
                    </div>
                    <p className="font-teko text-[13px] md:text-[10px] text-[#d1c5b3] opacity-60 tracking-widest">
                      {t.game || 'PUBG MOBILE'}
                      {prizeFormatted && <> &bull; {prizeFormatted}</>}
                      &bull; {approvedCount}/{t.max_teams || 'UNLIMITED'} TEAMS
                      {pendingCount > 0 && (
                        <span className="text-[#f9d07a] ml-2">• {pendingCount} PENDING</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => onEdit(t)}
                    title="Edit Tournament"
                    className="text-[#f9d07a] hover:opacity-70 transition-opacity p-2"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(t)}
                    title="Delete Tournament"
                    className="text-[#ffb4ab] hover:opacity-70 transition-opacity p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Capacity bar */}
              {t.max_teams && (
                <div className="w-full bg-[#0e0e0e] h-1">
                  <div className="zenith-gradient h-full transition-all duration-1000" style={{ width: `${capacityPct}%` }} />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-0 divide-x divide-[rgba(78,70,56,0.15)]">
                  <ActionBtn
                    icon={Eye}
                    label="Registrations"
                    badge={pendingCount > 0 ? pendingCount : null}
                    onClick={() => onViewRegs(t)}
                  />
                  <ActionBtn
                    icon={Split}
                    label="Groups"
                    onClick={() => onViewGroups(t)}
                  />
                  <ActionBtn
                    icon={Download}
                    label="Export"
                    onClick={() => onExport(t)}
                  />
                </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function QuickStatCard({ icon: Icon, label, value, highlight }) {
  return (
    <div className={`bg-[#1b1b1b] p-5 md:p-6 ${highlight ? 'border-l-2 border-[#f9d07a]' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} className={`${highlight ? 'text-[#f9d07a]' : 'text-[#d1c5b3] opacity-60'}`} />
        <span className="font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-70 uppercase">{label}</span>
      </div>
      <p className={`font-bebas text-3xl md:text-4xl font-bold ${highlight ? 'text-[#f9d07a]' : 'text-white'}`}>{value}</p>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 px-3 md:px-6 py-4 font-teko text-[14px] md:text-[11px] tracking-widest text-[#d1c5b3] opacity-60 hover:opacity-100 hover:bg-[#2a2a2a] transition-all flex-1 min-w-[33.33%]"
    >
      <Icon size={14} className="md:w-4 md:h-4" />
      {label}
      {badge && (
        <span className="bg-[#f9d07a] text-[#402d00] font-bold text-[8px] px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Tournament Registrations Modal
// ─────────────────────────────────────────────────────────────
function TournamentRegsModal({ tournament, registrations, onClose, onApprove, onReject, onDelete, onExport, onEdit, onAdd }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const filtered = registrations
    .filter((r) => filterStatus === 'all' || r.status === filterStatus)
    .filter((r) =>
      search
        ? r.team_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.real_name?.toLowerCase().includes(search.toLowerCase())
        : true
    );

  const stats = {
    total:     registrations.length,
    pending:   registrations.filter((r) => r.status === 'pending').length,
    reapplied: registrations.filter((r) => r.status === 'reapplied').length,
    approved:  registrations.filter((r) => r.status === 'approved').length,
    rejected:  registrations.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-[#131313] border border-[rgba(78,70,56,0.3)] w-full max-w-6xl mx-4 flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[rgba(78,70,56,0.2)] flex-shrink-0">
          <div>
            <h2 className="font-bebas text-2xl font-bold text-[#f9d07a]">REGISTRATIONS</h2>
            <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-70 mt-1">
              {tournament.title.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <button
                onClick={() => setExportMenuOpen(!exportMenuOpen)}
                className="flex items-center gap-2 border border-[rgba(78,70,56,0.3)] px-3 md:px-4 py-2 font-teko text-[12px] md:text-[9px] tracking-widest text-[#d1c5b3] hover:bg-[#2a2a2a] transition-colors"
              >
                <Download size={12} /> <span className="hidden sm:inline">EXPORT</span>
              </button>
              
              {exportMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportMenuOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-[rgba(78,70,56,0.4)] shadow-2xl z-50 flex flex-col py-1 animate-page-enter">
                    <button 
                      onClick={() => { onExport('verified'); setExportMenuOpen(false); }}
                      className="px-4 py-3 text-left font-teko text-[13px] tracking-widest text-[#d1c5b3] hover:bg-[#2a2a2a] hover:text-[#f9d07a] transition-colors border-b border-white/5"
                    >
                      EXPORT VERIFIED TEAMS
                    </button>
                    <button 
                      onClick={() => { onExport('rejected'); setExportMenuOpen(false); }}
                      className="px-4 py-3 text-left font-teko text-[13px] tracking-widest text-[#d1c5b3] hover:bg-[#2a2a2a] hover:text-[#ffb4ab] transition-colors border-b border-white/5"
                    >
                      EXPORT REJECTED TEAMS
                    </button>
                    <button 
                      onClick={() => { onExport('all'); setExportMenuOpen(false); }}
                      className="px-4 py-3 text-left font-teko text-[13px] tracking-widest text-[#d1c5b3] hover:bg-[#2a2a2a] hover:text-white transition-colors"
                    >
                      EXPORT ALL (BOTH)
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onAdd}
              className="flex items-center gap-2 bg-[#f9d07a]/10 border border-[#f9d07a]/30 text-[#f9d07a] px-3 md:px-4 py-2 font-teko text-[12px] md:text-[9px] tracking-widest hover:bg-[#f9d07a]/20 transition-colors"
            >
              <Plus size={12} /> <span className="hidden sm:inline">ADD</span>
            </button>
            <button onClick={onClose} className="text-[#d1c5b3] hover:text-white transition-colors p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-5 border-b border-[rgba(78,70,56,0.15)] flex-shrink-0">
          {[
            { label: 'TOTAL',      value: stats.total },
            { label: 'PENDING',    value: stats.pending,  hi: true },
            { label: 'RE-APPLIED', value: stats.reapplied, hi: true },
            { label: 'APPROVED',   value: stats.approved },
            { label: 'REJECTED',   value: stats.rejected, hi: true },
          ].map(({ label, value, hi }) => (
            <div key={label} className={`p-4 ${hi ? 'bg-[#1b1b1b]' : ''}`}>
              <p className="font-teko text-[11px] text-[#c6c6c6] tracking-widest">{label}</p>
              <p className="font-bebas text-2xl font-bold text-[#f9d07a]">{value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 px-6 py-4 border-b border-[rgba(78,70,56,0.1)] flex-wrap flex-shrink-0">
          <div className="flex items-center gap-2 bg-[#1f1f1f] border border-[rgba(78,70,56,0.3)] px-3 py-2">
            <Search size={12} className="text-[#d1c5b3] opacity-60" />
            <input
              type="text"
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-[11px] font-teko text-[14px] tracking-widest text-[#d1c5b3] placeholder:opacity-70 w-36 focus:outline-none"
            />
          </div>
          {['all', 'pending', 'reapplied', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`font-teko text-[13px] tracking-widest px-4 py-2 transition-all ${
                filterStatus === s
                  ? 'bg-[#f9d07a] text-[#402d00]'
                  : 'border border-[rgba(78,70,56,0.3)] text-[#d1c5b3] opacity-70 hover:opacity-100'
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-[#1a1a1a] z-10">
              <tr>
                {['TEAM', 'REAL NAME', 'WHATSAPP', 'PLAYERS', 'STATUS', 'GROUP', 'ACTIONS'].map((h) => (
                  <th key={h} className="px-4 py-3 font-teko text-[12px] text-[#d1c5b3] tracking-widest opacity-70 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center font-teko text-[13px] text-[#d1c5b3] opacity-20 tracking-widest">
                    NO REGISTRATIONS FOUND
                  </td>
                </tr>
              ) : (
                filtered.map((reg) => (
                  <tr key={reg.id} className="border-b border-[rgba(78,70,56,0.08)] group hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {reg.logo_url ? (
                          <img src={reg.logo_url} alt="" className="w-8 h-8 object-cover rounded-full border border-[#4e4638] flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center font-bebas text-sm text-[#f9d07a] font-bold flex-shrink-0">
                            {reg.team_name?.[0]}
                          </div>
                        )}
                        <span className="font-bebas font-bold text-base whitespace-nowrap">{reg.team_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-body text-sm text-[#d1c5b3] opacity-70">
                      <div>{reg.real_name || '—'}</div>
                      {reg.status === 'rejected' && reg.rejection_reason && (
                        <div className="text-[10px] text-red-400 mt-1 uppercase tracking-tight italic opacity-60">
                          REASON: {reg.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-body text-xs text-[#d1c5b3] opacity-70">{reg.whatsapp_number}</td>
                    <td className="px-4 py-4">
                      <span className="font-teko text-[13px] text-[#f9d07a] tracking-widest">
                        {reg.player_ids?.length || 0} PLAYERS
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={reg.status} />
                    </td>
                    <td className="px-4 py-4 font-teko text-[13px] text-[#d1c5b3] opacity-60 tracking-widest">
                      {reg.group_id || '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                        {(reg.status === 'pending' || reg.status === 'reapplied') && (
                          <>
                            <button onClick={() => onApprove(reg)} title="Approve" className="text-emerald-400 hover:text-emerald-300">
                              <CheckCircle2 size={16} />
                            </button>
                            <button onClick={() => onReject(reg)} title="Reject" className="text-red-400 hover:text-red-300">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button onClick={() => onEdit(reg)} title="Edit" className="text-[#f9d07a] hover:opacity-70">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => onDelete(reg)} title="Delete" className="text-[#9a8f7f] hover:text-[#ffb4ab]">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tournament Groups Modal
// ─────────────────────────────────────────────────────────────
function TournamentGroupsModal({ tournament, registrations, allRegistrations, updateReg, onClose }) {
  const [groupingInProgress, setGroupingInProgress] = useState(false);

  // Build group map from assigned registrations
  const assignedRegs = allRegistrations.filter((r) => r.group_id);
  const groupMap = {};
  assignedRegs.forEach((r) => {
    if (!groupMap[r.group_id]) groupMap[r.group_id] = [];
    groupMap[r.group_id].push(r);
  });
  const groupNames = Object.keys(groupMap).sort((a, b) => {
    const n1 = parseInt(a.replace('Group ', ''), 10);
    const n2 = parseInt(b.replace('Group ', ''), 10);
    return n1 - n2;
  });

  // Auto-split if none assigned
  React.useEffect(() => {
    const unassigned = registrations.filter((r) => !r.group_id);
    if (unassigned.length > 0 && assignedRegs.length === 0 && !groupingInProgress) {
      const autoSplit = async () => {
        setGroupingInProgress(true);
        try {
          const { groupsCreated, teamsAssigned } = await assignGroupsToSupabase(unassigned, updateReg, 20);
          toast.success(`SYSTEM: ${teamsAssigned} teams auto-assigned to ${groupsCreated} groups`);
        } catch (err) {
          console.error('Auto-grouping failed:', err);
        } finally {
          setGroupingInProgress(false);
        }
      };
      autoSplit();
    }
  }, [registrations.length, assignedRegs.length, groupingInProgress]);

  async function handleSplit() {
    const unassigned = registrations.filter((r) => !r.group_id);
    if (unassigned.length === 0) {
      toast.error('No unassigned approved teams found');
      return;
    }
    setGroupingInProgress(true);
    try {
      const { groupsCreated, teamsAssigned } = await assignGroupsToSupabase(unassigned, updateReg, 20);
      toast.success(`${teamsAssigned} teams assigned to ${groupsCreated} groups!`);
    } catch (err) {
      toast.error('Group split failed');
    } finally {
      setGroupingInProgress(false);
    }
  }

  async function handleReset() {
    if (!confirm(`Reset all group assignments for ${tournament.title}?`)) return;
    for (const reg of assignedRegs) {
      await updateReg(reg.id, { group_id: null });
    }
    toast.success('All group assignments reset');
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-[#131313] border border-[rgba(78,70,56,0.3)] w-full max-w-5xl mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[rgba(78,70,56,0.2)]">
          <div>
            <h2 className="font-bebas text-2xl font-bold text-[#f9d07a]">GROUPS</h2>
            <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-70 mt-1">
              {tournament.title.toUpperCase()} &bull; {registrations.length} APPROVED TEAMS
            </p>
          </div>
          <div className="flex items-center gap-3">
            {groupNames.length > 0 && (
              <button
                onClick={handleReset}
                className="border border-[rgba(78,70,56,0.3)] px-4 py-2 font-teko text-[13px] tracking-widest text-[#d1c5b3] hover:bg-[#2a2a2a] transition-colors"
              >
                RESET ALL
              </button>
            )}
            <GradientButton icon={Split} onClick={handleSplit} disabled={groupingInProgress}>
              {groupingInProgress ? 'SPLITTING...' : 'AUTO-SPLIT (20)'}
            </GradientButton>
            <button onClick={onClose} className="text-[#d1c5b3] hover:text-white transition-colors p-1 ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Groups Grid */}
        <div className="p-8">
          {groupNames.length === 0 ? (
            <div className="text-center py-16 bg-[#1b1b1b]">
              <p className="font-teko text-[14px] tracking-widest text-[#d1c5b3] opacity-70 mb-2">
                NO GROUPS ASSIGNED YET
              </p>
              <p className="text-[#d1c5b3] opacity-20 text-sm">
                Approve teams first, then click AUTO-SPLIT.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groupNames.map((groupName) => {
                const teams = groupMap[groupName];
                const isFull = teams.length >= 20;
                return (
                  <div key={groupName} className={`bg-[#1f1f1f] p-5 border-l-4 ${isFull ? 'border-[#dbb462]' : 'border-[rgba(78,70,56,0.3)]'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bebas text-xl font-bold">{groupName.toUpperCase()}</p>
                        <p className="font-teko text-[13px] text-[#d1c5b3] opacity-70 tracking-widest">
                          {teams.length} / 20 SLOTS
                        </p>
                      </div>
                      {isFull ? <CheckCircle2 size={18} className="text-[#f9d07a]" /> : <Clock size={18} className="text-[#9a8f7f] opacity-60" />}
                    </div>
                    <div className="w-full bg-[#353535] h-0.5 mb-3">
                      <div className="zenith-gradient h-full" style={{ width: `${(teams.length / 20) * 100}%` }} />
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto no-scrollbar">
                      {teams.map((t) => (
                        <div key={t.id} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-[#dbb462] rounded-full flex-shrink-0" />
                          <span className="font-body text-xs text-[#d1c5b3] opacity-60 truncate">{t.team_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────
// Tournament Create/Edit Modal
// ─────────────────────────────────────────────────────────────

const GAME_MODES = {
  'PUBG Mobile': ['Squad', 'Duo', 'Solo'],
  'Free Fire':   ['Squad', 'Duo', 'Solo'],
  'Valorant':    ['5v5', 'Duo', 'Solo'],
  'Warzone':     ['Trio', 'Duo', 'Solo'],
  'Other':       ['Team', 'Duo', 'Solo', 'Custom'],
};

const TEAM_SIZE_BY_FORMAT = {
  Squad: 4, Duo: 2, Solo: 1, Trio: 3, '5v5': 5, Team: 4, Custom: 4,
};

const ROADMAP_PRESETS = {
  standard: {
    label: 'Standard (4 stages)',
    rows: [
      { phase: 'Group Stage',    title: 'Group Stage',    description: 'Teams divided into groups. Top performers per group advance to knockouts.' },
      { phase: 'Quarter Finals', title: 'Quarter Finals', description: 'Group leaders face off in best-of-series knockout matches.' },
      { phase: 'Semi Finals',    title: 'Semi Finals',    description: 'QF winners battle for a spot in the Grand Final.' },
      { phase: 'Grand Final',    title: 'Grand Final',    description: 'The top teams compete for the championship title and prize pool.' },
    ],
  },
  compact: {
    label: 'Compact (2 stages)',
    rows: [
      { phase: 'Group Stage', title: 'Group Stage', description: 'All teams compete in groups. Top 3 from each group qualify for the Final.' },
      { phase: 'Grand Final', title: 'Grand Final', description: 'Qualified teams battle in the Grand Final for glory and the prize pool.' },
    ],
  },
  full: {
    label: 'Full Circuit (5 stages)',
    rows: [
      { phase: 'Open Qualifier', title: 'Open Qualifier',  description: 'Open registration rounds — all registered teams compete for qualification.' },
      { phase: 'Group Stage',    title: 'Group Stage',     description: 'Qualifiers sorted into balanced groups.' },
      { phase: 'Quarter Finals', title: 'Quarter Finals',  description: 'Top group teams advance to knockout QFs.' },
      { phase: 'Semi Finals',    title: 'Semi Finals',     description: 'QF winners move to Semi Finals.' },
      { phase: 'Grand Final',    title: 'Grand Final',     description: 'Grand Final — the ultimate battle for the championship.' },
    ],
  },
};

const DESCRIPTION_PRESETS = [
  'The next evolution of competitive PUBG Mobile. Secure your slot and prepare for battle.',
  'Pakistan\'s most rigorous squad tournament. Only verified teams. Only the best rise.',
  'Full prize pool distribution across top teams. Register now before slots fill up.',
  'Squad vs Squad. Group Stage → Knockout → Grand Finals. One champion stands.',
];

const SOCIAL_PRESETS = [
  { label: 'Subscribe to YouTube', icon: '▶', template: (url) => `Subscribe to our YouTube channel${url ? ` (${url})` : ''} and upload a screenshot` },
  { label: 'Follow on Instagram',  icon: '📷', template: (url) => `Follow us on Instagram${url ? ` (@${url.split('/').pop()})` : ''} and upload a screenshot` },
  { label: 'Join WhatsApp Group',  icon: '💬', template: () => 'Join the WhatsApp community group and upload a screenshot' },
  { label: 'Join Discord Server',  icon: '🎮', template: (url) => `Join our Discord server${url ? ` (${url})` : ''} and upload a screenshot` },
];

const EMPTY_FORM = {
  title: '',
  description: '',
  briefing: '',
  game: 'PUBG Mobile',
  format: 'Squad',
  team_size: 4,
  region: 'Pakistan',
  max_teams: 64,
  prize_pool: '',
  prize_breakdown: { first: '', second: '', third: '', fourth: '', fifth: '' },
  prize_distributed_to: 3,
  kill_reward: '',
  mvp_prize: '',
  entry_fee: 0,
  discord_link: '',
  stream_url: '',
  youtube_url: '',
  instagram_url: '',
  whatsapp_group_link: '',
  map_pool: [],
  perspective: 'TPP',
  skill_tier: 'Open',
  auto_approve: false,
  registration_open_date: '',
  registration_deadline: '',
  start_date: '',
  end_date: '',
  poster_url: '',
  is_completed: false,
  registration_config: { screenshots: [] },
};

const MODAL_SECTIONS = [
  { id: 'basics',   label: 'BASICS',   icon: Trophy      },
  { id: 'media',    label: 'MEDIA',    icon: Eye         },
  { id: 'dates',    label: 'DATES',    icon: Calendar    },
  { id: 'prize',    label: 'PRIZE',    icon: TrendingUp  },
  { id: 'briefing', label: 'BRIEFING', icon: FileText    },
  { id: 'schedule', label: 'SCHEDULE', icon: ListOrdered },
  { id: 'roadmap',  label: 'ROADMAP',  icon: Map         },
  { id: 'config',   label: 'CONFIG',   icon: ToggleRight },
];

function TournamentModal({ isOpen, onClose, tournament, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [roadmapRows, setRoadmapRows] = useState([]);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState('basics');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const parseJSON = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };

  const toPKT = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'Asia/Karachi',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(new Date(dateStr)).replace(' ', 'T');
    } catch { return ''; }
  };

  const fromPKT = (val) => val ? `${val}:00+05:00` : null;

  React.useEffect(() => {
    if (!isOpen) return;
    if (tournament) {
      const pb = tournament.prize_breakdown;
      setForm({
        title:                  tournament.title || '',
        description:            tournament.description || '',
        briefing:               tournament.briefing || '',
        game:                   tournament.game || 'PUBG Mobile',
        format:                 tournament.format || 'Squad',
        team_size:              tournament.team_size ?? 4,
        region:                 tournament.region || 'Pakistan',
        max_teams:              tournament.max_teams === null ? '' : (tournament.max_teams ?? 64),
        prize_pool:             tournament.prize_pool || '',
        prize_breakdown:        (pb && typeof pb === 'object' && !Array.isArray(pb)) ? { first: '', second: '', third: '', fourth: '', fifth: '', ...pb } : { first: '', second: '', third: '', fourth: '', fifth: '' },
        prize_distributed_to:   tournament.prize_distributed_to ?? 3,
        kill_reward:            tournament.kill_reward || '',
        mvp_prize:              tournament.mvp_prize || '',
        entry_fee:              tournament.entry_fee ?? 0,
        discord_link:           tournament.discord_link || '',
        stream_url:             tournament.stream_url || '',
        youtube_url:            tournament.youtube_url || '',
        instagram_url:          tournament.instagram_url || '',
        whatsapp_group_link:    tournament.whatsapp_group_link || '',
        map_pool:               tournament.map_pool || [],
        perspective:            tournament.perspective || 'TPP',
        skill_tier:             tournament.skill_tier || 'Open',
        auto_approve:           tournament.auto_approve || false,
        registration_open_date: toPKT(tournament.registration_open_date),
        registration_deadline:  toPKT(tournament.registration_deadline),
        start_date:             tournament.start_date ? new Date(tournament.start_date).toISOString().slice(0, 10) : '',
        end_date:               tournament.end_date   ? new Date(tournament.end_date).toISOString().slice(0, 10)   : '',
        poster_url:             tournament.poster_url || '',
        is_completed:           tournament.is_completed || false,
        registration_config:    tournament.registration_config || { screenshots: [] },
      });
      setScheduleRows(parseJSON(tournament.schedule).map(r => ({ ...r, id: Math.random() })));
      setRoadmapRows(parseJSON(tournament.roadmap).map(r => ({ ...r, id: Math.random() })));
    } else {
      setForm({ ...EMPTY_FORM, prize_breakdown: { first: '', second: '', third: '', fourth: '', fifth: '' } });
      setScheduleRows([]);
      setRoadmapRows([]);
    }
    setFile(null);
    setSection('basics');
  }, [tournament, isOpen]);

  // ── Schedule helpers ──
  const addScheduleRow = () => setScheduleRows(p => [...p, { id: Math.random(), date: '', time: '', event: '', note: '' }]);
  const updSched = (id, f, v) => setScheduleRows(p => p.map(r => r.id === id ? { ...r, [f]: v } : r));
  const delSched = (id) => setScheduleRows(p => p.filter(r => r.id !== id));

  // ── Roadmap helpers ──
  const addRoadmapRow = () => setRoadmapRows(p => [...p, { id: Math.random(), phase: '', title: '', description: '' }]);
  const updRoad = (id, f, v) => setRoadmapRows(p => p.map(r => r.id === id ? { ...r, [f]: v } : r));
  const delRoad = (id) => setRoadmapRows(p => p.filter(r => r.id !== id));

  function autoFillBriefing() {
    const title    = form.title?.trim() || 'ZENITH OPEN';
    const game     = form.game || 'PUBG Mobile';
    const fmt      = form.format || 'Squad';
    const teamSz   = form.team_size || 4;
    const prize    = form.prize_pool ? `PKR ${Number(form.prize_pool).toLocaleString('en-PK')}` : 'TBA';
    const slots    = form.max_teams ? `${form.max_teams} teams` : 'unlimited teams';
    const fee      = (form.entry_fee && Number(form.entry_fee) > 0) ? `PKR ${Number(form.entry_fee).toLocaleString('en-PK')}` : 'FREE';
    const deadline = form.registration_deadline
      ? new Date(fromPKT(form.registration_deadline)).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'TBA';
    const startStr = form.start_date
      ? new Date(form.start_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'TBA';
    const discordLine = form.discord_link ? `\nDiscord: ${form.discord_link}` : '';
    set('briefing', `Welcome to ${title} — an official ${game} tournament hosted by Zenith Esports Pakistan.

TOURNAMENT FORMAT
• Mode: ${fmt} (${teamSz} player${teamSz > 1 ? 's' : ''} per team)
• Total Slots: ${slots}
• Format: Group Stage → Knockout Rounds → Grand Final
• Scoring: Standard ${game} scoring (Placement Points + Kill Points)
• Entry Fee: ${fee}

PRIZE POOL
Total Prize Pool: ${prize}
Prize distribution will be announced after bracket finalization.

KEY DATES
• Registration Deadline: ${deadline}
• Tournament Start: ${startStr}

ELIGIBILITY & RULES
1. All players must be registered with their correct ${game} Character IDs.
2. No roster changes are allowed after the registration deadline.
3. Players must be online and ready 15 minutes before each scheduled match.
4. No cheating, hacking, or use of any unauthorized third-party software.
5. Misconduct, toxicity, or unsportsmanlike behavior will result in disqualification.
6. All disputes are subject to the final decision of Zenith Esports administration.

CONTACT${discordLine}
For queries, reach out via WhatsApp or our official Discord.
Good luck, and may the best team win!`);
    toast.success('Briefing template applied');
  }

  function applyRoadmapPreset(key) {
    const preset = ROADMAP_PRESETS[key];
    if (!preset) return;
    setRoadmapRows(preset.rows.map(r => ({ ...r, id: Math.random() })));
    toast.success(`"${preset.label}" roadmap applied`);
  }

  function autoFillSchedule() {
    if (!form.start_date) { toast.error('Set the Start Date first (Dates tab)'); return; }
    const base = new Date(form.start_date);
    const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
    setScheduleRows([
      { date: form.start_date,   time: '18:00', event: 'Group Stage — Day 1', note: ''               },
      { date: addDays(base, 1),  time: '18:00', event: 'Group Stage — Day 2', note: ''               },
      { date: addDays(base, 2),  time: '18:00', event: 'Quarter Finals',      note: ''               },
      { date: addDays(base, 3),  time: '18:00', event: 'Semi Finals',         note: ''               },
      { date: addDays(base, 4),  time: '20:00', event: 'Grand Finals',        note: 'Championship'   },
    ].map(r => ({ ...r, id: Math.random() })));
    toast.success('Schedule generated from start date');
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Tournament title is required'); return; }
    if (form.title.trim().length < 3) { toast.error('Title must be at least 3 characters'); return; }

    const openTs     = form.registration_open_date ? new Date(fromPKT(form.registration_open_date)) : null;
    const deadlineTs = form.registration_deadline  ? new Date(fromPKT(form.registration_deadline))  : null;
    const startTs    = form.start_date             ? new Date(form.start_date)                       : null;
    const endTs      = form.end_date               ? new Date(form.end_date)                         : null;

    if (openTs && deadlineTs && openTs >= deadlineTs) {
      toast.error('Registration deadline must be after the open date'); return;
    }
    if (deadlineTs && startTs && deadlineTs > startTs) {
      toast.error('Start date must be on or after the registration deadline'); return;
    }
    if (startTs && endTs && startTs > endTs) {
      toast.error('End date must be on or after the start date'); return;
    }

    const parsedMaxTeams = (form.max_teams === '' || form.max_teams === null) ? null : parseInt(form.max_teams, 10);
    if (parsedMaxTeams !== null && (isNaN(parsedMaxTeams) || parsedMaxTeams < 2)) {
      toast.error('Max teams must be at least 2'); return;
    }

    const validSchedule = scheduleRows.filter(r => r.event?.trim());
    const validRoadmap  = roadmapRows.filter(r => r.title?.trim());

    setSaving(true);
    try {
      await onSave({
        ...form,
        max_teams:              parsedMaxTeams,
        team_size:              Number(form.team_size) || 4,
        entry_fee:              Number(form.entry_fee) || 0,
        registration_open_date: fromPKT(form.registration_open_date),
        registration_deadline:  fromPKT(form.registration_deadline),
        end_date:               form.end_date || null,
        schedule:               validSchedule.map(({ date, time, event, note }) => ({ date, time, event, note })),
        roadmap:                validRoadmap.map(({ phase, title, description }) => ({ phase, title, description })),
      }, file);
    } finally {
      setSaving(false);
    }
  }

  const sectionComplete = {
    basics:   !!(form.title?.trim() && form.game),
    media:    !!(file || form.poster_url),
    dates:    !!(form.registration_open_date || form.start_date),
    prize:    !!(form.prize_pool),
    briefing: !!(form.briefing?.trim()),
    schedule: scheduleRows.filter(r => r.event?.trim()).length > 0,
    roadmap:  roadmapRows.filter(r => r.title?.trim()).length > 0,
    config:   (form.registration_config?.screenshots || []).length > 0,
  };

  const completedCount = Object.values(sectionComplete).filter(Boolean).length;
  const computedStatus = computeTournamentStatus(form);

  const inputCls = 'w-full bg-[#0a0a0a] border border-[rgba(78,70,56,0.25)] px-3 py-2.5 text-sm text-[#e2e2e2] focus:outline-none focus:border-[#f9d07a] transition-colors placeholder:opacity-30 placeholder:text-[#d1c5b3]';
  const labelCls = 'font-teko text-[11px] tracking-[0.15em] text-[#d1c5b3] uppercase block mb-1.5 opacity-60';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 md:p-6">
      <div
        className="w-full max-w-5xl bg-[#0e0e0e] border border-[rgba(78,70,56,0.3)] flex flex-col md:flex-row overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 3rem)' }}
      >
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden md:flex md:w-52 flex-shrink-0 bg-[#0a0a0a] border-r border-[rgba(78,70,56,0.15)] flex-col">
          <div className="px-6 py-5 border-b border-[rgba(78,70,56,0.1)]">
            <p className="font-teko text-[10px] tracking-[0.2em] text-[#dbb462] opacity-50 uppercase mb-0.5">
              {tournament ? 'EDITING' : 'NEW TOURNAMENT'}
            </p>
            <h2 className="font-bebas text-lg text-white tracking-widest leading-tight line-clamp-2 min-h-[1.4rem]">
              {form.title || <span className="opacity-20">UNTITLED</span>}
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-px bg-[#1f1f1f] overflow-hidden">
                <div className="h-full zenith-gradient transition-all duration-500" style={{ width: `${(completedCount / MODAL_SECTIONS.length) * 100}%` }} />
              </div>
              <span className="font-teko text-[10px] text-[#dbb462] opacity-40 tracking-widest whitespace-nowrap">{completedCount}/{MODAL_SECTIONS.length}</span>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-1 no-scrollbar">
            {MODAL_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full flex items-center gap-3 px-5 py-3 font-teko text-[12px] tracking-widest transition-all text-left relative ${
                  section === id ? 'bg-[#191919] text-[#f9d07a] border-l-2 border-[#f9d07a]' : 'text-[#d1c5b3] opacity-40 hover:opacity-80 hover:bg-[#111]'
                }`}
              >
                <Icon size={13} className="shrink-0" />
                {label}
                {sectionComplete[id] && section !== id && <span className="ml-auto w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0" />}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-[rgba(78,70,56,0.15)]">
            <GradientButton className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? 'SAVING...' : (tournament ? 'UPDATE' : 'PUBLISH')}
            </GradientButton>
          </div>
        </aside>

        {/* ── Mobile Section Dropdown ── */}
        <div className="md:hidden flex items-center gap-2 px-4 py-3 bg-[#0a0a0a] border-b border-[rgba(78,70,56,0.15)] flex-shrink-0">
          <select
            value={section}
            onChange={e => setSection(e.target.value)}
            className="flex-1 bg-[#111] border border-[rgba(78,70,56,0.25)] px-3 py-2 font-teko text-[13px] tracking-widest text-[#f9d07a] uppercase focus:outline-none focus:border-[#dbb462]/50"
          >
            {MODAL_SECTIONS.map(({ id, label }) => (
              <option key={id} value={id}>{label}{sectionComplete[id] ? ' ✓' : ''}</option>
            ))}
          </select>
          <GradientButton onClick={handleSave} disabled={saving} className="px-4 py-2 text-[12px]">
            {saving ? '...' : (tournament ? 'UPDATE' : 'SAVE')}
          </GradientButton>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Content header */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-[rgba(78,70,56,0.1)] flex-shrink-0">
            <div className="flex items-center gap-3">
              {(() => { const s = MODAL_SECTIONS.find(x => x.id === section); const Icon = s?.icon; return Icon ? <Icon size={15} className="text-[#dbb462] opacity-60" /> : null; })()}
              <h3 className="font-bebas text-xl tracking-widest text-white">
                {MODAL_SECTIONS.find(s => s.id === section)?.label}
              </h3>
            </div>
            <button onClick={onClose} className="text-[#d1c5b3] opacity-30 hover:opacity-100 transition-opacity">
              <X size={18} />
            </button>
          </div>

          {/* Scrollable section content */}
          <div className="flex-1 overflow-y-auto p-8 no-scrollbar">

            {/* ── BASICS ── */}
            {section === 'basics' && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Tournament Title <span className="text-red-400 opacity-100">*</span></label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="e.g. ZENITH OPEN SEASON 2"
                    autoFocus
                    className={inputCls + ' font-bebas text-xl tracking-wider'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Game</label>
                    <select
                      value={form.game}
                      onChange={e => {
                        const g = e.target.value;
                        const modes = GAME_MODES[g] || ['Team'];
                        const fmt = modes[0];
                        setForm(f => ({ ...f, game: g, format: fmt, team_size: TEAM_SIZE_BY_FORMAT[fmt] || 4 }));
                      }}
                      className={inputCls}
                    >
                      {Object.keys(GAME_MODES).map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Format / Mode</label>
                    <select
                      value={form.format}
                      onChange={e => {
                        const fmt = e.target.value;
                        setForm(f => ({ ...f, format: fmt, team_size: TEAM_SIZE_BY_FORMAT[fmt] || f.team_size }));
                      }}
                      className={inputCls}
                    >
                      {(GAME_MODES[form.game] || ['Team', 'Duo', 'Solo', 'Custom']).map(m => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Perspective</label>
                    <select value={form.perspective} onChange={e => set('perspective', e.target.value)} className={inputCls}>
                      {['TPP', 'FPP', 'TPP + FPP'].map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Skill Tier</label>
                    <select value={form.skill_tier} onChange={e => set('skill_tier', e.target.value)} className={inputCls}>
                      {['Open', 'Amateur', 'Intermediate', 'Pro', 'Elite', 'Invitational'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Map Pool <span className="opacity-40 normal-case tracking-normal">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik', 'Karakin', 'Nusa', 'Rondo'].map(map => {
                      const selected = (form.map_pool || []).includes(map);
                      return (
                        <button
                          key={map}
                          type="button"
                          onClick={() => {
                            const cur = form.map_pool || [];
                            set('map_pool', selected ? cur.filter(m => m !== map) : [...cur, map]);
                          }}
                          className={`font-teko text-[11px] tracking-widest px-3 py-1.5 border transition-colors uppercase ${
                            selected
                              ? 'bg-[#dbb462]/15 border-[#dbb462]/40 text-[#dbb462]'
                              : 'border-[rgba(78,70,56,0.2)] text-[#d1c5b3] opacity-40 hover:opacity-80'
                          }`}
                        >
                          {selected ? '✓ ' : ''}{map}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Players per Team</label>
                    <input
                      type="number" min={1} max={10}
                      value={form.team_size}
                      onChange={e => set('team_size', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelCls + ' mb-0'}>Max Teams</label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.max_teams === '' || form.max_teams === null}
                          onChange={e => set('max_teams', e.target.checked ? '' : 64)}
                          className="accent-[#dbb462] w-3 h-3"
                        />
                        <span className="font-teko text-[10px] text-[#dbb462] tracking-widest uppercase opacity-70">∞ Unlimited</span>
                      </label>
                    </div>
                    <input
                      type="number"
                      value={form.max_teams === null ? '' : form.max_teams}
                      onChange={e => set('max_teams', e.target.value)}
                      disabled={form.max_teams === '' || form.max_teams === null}
                      placeholder="64"
                      className={inputCls + ((form.max_teams === '' || form.max_teams === null) ? ' opacity-20 cursor-not-allowed' : '')}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Region</label>
                    <select
                      value={form.region || 'Pakistan'}
                      onChange={e => set('region', e.target.value)}
                      className={inputCls}
                    >
                      <option>Pakistan</option>
                      <option>Open / International</option>
                      <option>South Asia</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Short Description <span className="opacity-40 normal-case tracking-normal">(shown on tournament cards)</span></label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {DESCRIPTION_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => set('description', preset)}
                        className="font-teko text-[10px] tracking-widest text-[#dbb462] bg-[#dbb462]/8 border border-[#dbb462]/15 px-2 py-1 hover:bg-[#dbb462]/18 transition-colors uppercase"
                      >
                        PRESET {i + 1}
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="One-liner about the tournament..."
                    rows={2}
                    className={inputCls + ' resize-none'}
                  />
                </div>
              </div>
            )}

            {/* ── MEDIA ── */}
            {section === 'media' && (
              <div className="space-y-7">
                <div>
                  <label className={labelCls}>Event Poster</label>
                  <div className="flex gap-6 items-start">
                    <div className="w-32 h-44 bg-[#0a0a0a] border border-[rgba(78,70,56,0.25)] flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {file ? (
                        <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      ) : form.poster_url ? (
                        <img src={form.poster_url} alt="Poster" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Trophy size={28} className="text-[#dbb462] opacity-10 mx-auto mb-2" />
                          <p className="font-teko text-[9px] text-[#d1c5b3] opacity-20 tracking-widest">NO POSTER</p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <label className={labelCls}>Upload New File</label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={e => setFile(e.target.files[0])}
                          className="w-full text-[11px] text-[#d1c5b3] file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-[#1f1f1f] file:text-[#f9d07a] file:font-teko file:text-[10px] file:tracking-widest file:cursor-pointer hover:file:bg-[#2a2a2a] file:transition-colors"
                        />
                        <p className="font-teko text-[10px] text-[#d1c5b3] opacity-30 mt-1.5 tracking-widest">3:4 portrait ratio recommended · Max 5MB</p>
                      </div>
                      {file && (
                        <button
                          onClick={() => setFile(null)}
                          className="font-teko text-[11px] tracking-widest text-red-400 opacity-50 hover:opacity-100 transition-opacity"
                        >
                          ✕ Remove selected file
                        </button>
                      )}
                      <div>
                        <label className={labelCls}>Or paste existing URL</label>
                        <input
                          type="url"
                          value={form.poster_url}
                          onChange={e => set('poster_url', e.target.value)}
                          placeholder="https://..."
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Live Stream URL <span className="opacity-40 normal-case tracking-normal">(YouTube / Twitch)</span></label>
                  <input
                    type="url"
                    value={form.stream_url}
                    onChange={e => set('stream_url', e.target.value)}
                    placeholder="https://youtube.com/live/..."
                    className={inputCls}
                  />
                  <p className="font-teko text-[10px] text-[#d1c5b3] opacity-30 mt-1.5 tracking-widest">
                    Shown as a "Watch Live" button when the tournament is in progress.
                  </p>
                </div>
              </div>
            )}

            {/* ── DATES ── */}
            {section === 'dates' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between bg-[#0a0a0a] border border-[rgba(78,70,56,0.15)] px-5 py-3">
                  <span className="font-teko text-[11px] tracking-[0.15em] text-[#d1c5b3] opacity-50 uppercase">Auto-computed status</span>
                  <span className={`font-teko text-[12px] tracking-widest px-3 py-0.5 border uppercase ${
                    computedStatus === 'registrations_open'   ? 'text-emerald-400 border-emerald-500/30' :
                    computedStatus === 'in_progress'          ? 'text-blue-400 border-blue-500/30' :
                    computedStatus === 'registrations_closed' ? 'text-orange-400 border-orange-500/30' :
                    computedStatus === 'completed'            ? 'text-[#9a8f7f] border-[rgba(78,70,56,0.3)]' :
                    'text-[#f9d07a] border-[#f9d07a]/30'
                  }`}>
                    {computedStatus.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Registration Opens <span className="text-[#dbb462] opacity-60">(PKT)</span></label>
                    <input
                      type="datetime-local"
                      value={form.registration_open_date}
                      onChange={e => set('registration_open_date', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Registration Deadline <span className="text-[#dbb462] opacity-60">(PKT)</span></label>
                    <input
                      type="datetime-local"
                      value={form.registration_deadline}
                      onChange={e => set('registration_deadline', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Tournament Start Date</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={e => set('start_date', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Tournament End Date</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={e => set('end_date', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                {form.registration_open_date && form.registration_deadline && form.start_date && (() => {
                  const oTs = new Date(fromPKT(form.registration_open_date));
                  const dTs = new Date(fromPKT(form.registration_deadline));
                  const sTs = new Date(form.start_date);
                  const ok  = oTs < dTs && dTs <= sTs;
                  return (
                    <div className={`flex items-center gap-2 px-4 py-2.5 ${ok ? 'bg-emerald-900/10 border border-emerald-500/15' : 'bg-red-900/10 border border-red-500/20'}`}>
                      {ok ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" /> : <XCircle size={13} className="text-red-400 shrink-0" />}
                      <span className={`font-teko text-[11px] tracking-widest ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
                        {ok ? 'Date order valid: Open → Deadline → Start' : 'Invalid order: Open must be before Deadline, Deadline must be before Start'}
                      </span>
                    </div>
                  );
                })()}

                <div className="flex items-center justify-between bg-[#0a0a0a] border border-[rgba(78,70,56,0.15)] px-5 py-4">
                  <div>
                    <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] uppercase">Mark as Completed</p>
                    <p className="font-teko text-[10px] tracking-widest text-[#d1c5b3] opacity-30 mt-0.5">Forces status to "completed" regardless of dates</p>
                  </div>
                  <button
                    onClick={() => set('is_completed', !form.is_completed)}
                    className={`transition-colors ${form.is_completed ? 'text-[#f9d07a]' : 'text-[#4e4638]'}`}
                  >
                    {form.is_completed ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              </div>
            )}

            {/* ── PRIZE ── */}
            {section === 'prize' && (
              <div className="space-y-6">
                <div>
                  <label className={labelCls}>Total Prize Pool (PKR)</label>
                  <input
                    type="number"
                    value={form.prize_pool}
                    onChange={e => set('prize_pool', e.target.value)}
                    placeholder="50000"
                    className={inputCls + ' font-bebas text-2xl tracking-wider text-[#f9d07a]'}
                  />
                  {form.prize_pool && (
                    <p className="font-bebas text-sm text-[#dbb462] opacity-50 mt-1 tracking-widest">
                      PKR {Number(form.prize_pool).toLocaleString('en-PK')}
                    </p>
                  )}
                </div>

                <div className="bg-[#0a0a0a] border border-[rgba(78,70,56,0.15)] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <p className={labelCls + ' mb-0'}>Prize Breakdown</p>
                      <div className="flex items-center gap-2">
                        <label className="font-teko text-[10px] tracking-widest text-[#d1c5b3] opacity-40 uppercase">Top</label>
                        <input
                          type="number"
                          min={1}
                          value={form.prize_distributed_to || 3}
                          onChange={e => set('prize_distributed_to', Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 bg-[#111] border border-[rgba(78,70,56,0.25)] px-2 py-0.5 font-teko text-[12px] text-[#dbb462] tracking-widest focus:outline-none"
                        />
                        <label className="font-teko text-[10px] tracking-widest text-[#d1c5b3] opacity-40 uppercase">teams</label>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { label: '50/30/20', splits: [0.50, 0.30, 0.20, 0, 0] },
                        { label: '60/30/10', splits: [0.60, 0.30, 0.10, 0, 0] },
                        { label: '40/25/20/10/5', splits: [0.40, 0.25, 0.20, 0.10, 0.05] },
                      ].map(({ label, splits }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            const total = Number(form.prize_pool) || 0;
                            if (!total) { toast.error('Set the total prize pool first'); return; }
                            const keys = ['first','second','third','fourth','fifth'];
                            const pb = {};
                            keys.forEach((k, i) => { pb[k] = splits[i] ? Math.round(total * splits[i]) : ''; });
                            setForm(f => ({ ...f, prize_breakdown: pb, prize_distributed_to: splits.filter(Boolean).length }));
                            toast.success(`${label} split applied`);
                          }}
                          className="font-teko text-[10px] tracking-widest text-[#dbb462] opacity-50 hover:opacity-100 border border-[#dbb462]/20 px-2 py-1 transition-opacity uppercase"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {Array.from({ length: form.prize_distributed_to || 3 }, (_, i) => {
                    const pos = i + 1;
                    const NAMED = ['first','second','third','fourth','fifth'];
                    const key = pos <= 5 ? NAMED[i] : `pos${pos}`;
                    const suffix = pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th';
                    const color = pos === 1 ? 'text-[#f9d07a]' : pos === 2 ? 'text-[#c0c0c0]' : pos === 3 ? 'text-[#cd7f32]' : 'text-[#d1c5b3]';
                    return (
                      <div key={key} className="flex items-center gap-4">
                        <span className={`font-teko text-[13px] tracking-widest w-20 shrink-0 ${color}`}>{pos}{suffix} Place</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-teko text-[11px] text-[#d1c5b3] opacity-40 pointer-events-none">PKR</span>
                          <input
                            type="number"
                            value={form.prize_breakdown[key] ?? ''}
                            onChange={e => setForm(f => ({ ...f, prize_breakdown: { ...f.prize_breakdown, [key]: e.target.value } }))}
                            placeholder="0"
                            className={inputCls + ' pl-12'}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {(() => {
                    const n = form.prize_distributed_to || 3;
                    const NAMED = ['first','second','third','fourth','fifth'];
                    const keys = Array.from({ length: n }, (_, i) => i < 5 ? NAMED[i] : `pos${i+1}`);
                    const pb = form.prize_breakdown;
                    const sum = keys.reduce((acc, k) => acc + (Number(pb[k]) || 0), 0);
                    if (!sum) return null;
                    const total = Number(form.prize_pool) || 0;
                    const ok = total > 0 && sum === total;
                    return (
                      <div className="flex items-center gap-2 pt-3 border-t border-[rgba(78,70,56,0.1)]">
                        {ok ? <CheckCircle2 size={12} className="text-emerald-400" /> : <XCircle size={12} className="text-orange-400" />}
                        <span className={`font-teko text-[11px] tracking-widest ${ok ? 'text-emerald-400' : 'text-orange-400'}`}>
                          Breakdown total: PKR {sum.toLocaleString('en-PK')} {ok ? '— matches prize pool ✓' : `— differs from PKR ${total.toLocaleString('en-PK')}`}
                        </span>
                      </div>
                    );
                  })()}
                </div>

                <div>
                  <label className={labelCls}>Entry Fee (PKR) <span className="opacity-40 normal-case tracking-normal">— 0 = free to enter</span></label>
                  <input
                    type="number" min={0}
                    value={form.entry_fee}
                    onChange={e => set('entry_fee', e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Kill Reward (PKR per kill) <span className="opacity-40 normal-case tracking-normal">— 0 = none</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-teko text-[11px] text-[#d1c5b3] opacity-40 pointer-events-none">PKR</span>
                      <input
                        type="number" min={0}
                        value={form.kill_reward}
                        onChange={e => set('kill_reward', e.target.value)}
                        placeholder="0"
                        className={inputCls + ' pl-12'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>MVP Prize (PKR) <span className="opacity-40 normal-case tracking-normal">— 0 = none</span></label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-teko text-[11px] text-[#d1c5b3] opacity-40 pointer-events-none">PKR</span>
                      <input
                        type="number" min={0}
                        value={form.mvp_prize}
                        onChange={e => set('mvp_prize', e.target.value)}
                        placeholder="0"
                        className={inputCls + ' pl-12'}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Discord Server Invite</label>
                  <input
                    type="url"
                    value={form.discord_link}
                    onChange={e => set('discord_link', e.target.value)}
                    placeholder="https://discord.gg/..."
                    className={inputCls}
                  />
                </div>
              </div>
            )}

            {/* ── BRIEFING ── */}
            {section === 'briefing' && (
              <div className="space-y-5">
                <div>
                  <label className={labelCls}>Short Description <span className="opacity-40 normal-case tracking-normal">(card preview)</span></label>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    placeholder="One-liner shown on tournament cards..."
                    rows={2}
                    className={inputCls + ' resize-none'}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={labelCls + ' mb-0'}>Full Briefing</label>
                    <div className="flex items-center gap-3">
                      <span className="font-teko text-[10px] tracking-widest text-[#d1c5b3] opacity-25">{(form.briefing || '').length} chars</span>
                      <button
                        type="button"
                        onClick={autoFillBriefing}
                        className="flex items-center gap-1.5 bg-[#dbb462]/10 border border-[#dbb462]/20 text-[#dbb462] px-3 py-1.5 font-teko text-[11px] tracking-widest hover:bg-[#dbb462]/20 transition-colors uppercase"
                      >
                        <FileText size={11} /> AUTO-FILL
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={form.briefing}
                    onChange={e => set('briefing', e.target.value)}
                    placeholder="Full tournament rules, format, eligibility — or click AUTO-FILL above."
                    rows={15}
                    className={inputCls + ' resize-none leading-relaxed font-mono text-xs'}
                  />
                </div>
              </div>
            )}

            {/* ── SCHEDULE ── */}
            {section === 'schedule' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-teko text-[11px] tracking-widest text-[#d1c5b3] opacity-40">
                    Displayed on the Schedule tab in chronological order.
                  </p>
                  <button
                    type="button"
                    onClick={autoFillSchedule}
                    className="flex items-center gap-1.5 bg-[#dbb462]/10 border border-[#dbb462]/20 text-[#dbb462] px-3 py-1.5 font-teko text-[11px] tracking-widest hover:bg-[#dbb462]/20 transition-colors uppercase whitespace-nowrap"
                  >
                    <Calendar size={11} /> AUTO-GENERATE
                  </button>
                </div>

                {scheduleRows.length === 0 ? (
                  <div className="text-center py-10 bg-[#0a0a0a] border border-dashed border-[rgba(78,70,56,0.15)]">
                    <p className="font-teko text-[11px] text-[#d1c5b3] opacity-25 tracking-widest">
                      NO EVENTS — ADD MANUALLY OR CLICK AUTO-GENERATE
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {scheduleRows.map((row, i) => (
                      <div key={row.id} className="bg-[#0a0a0a] border border-[rgba(78,70,56,0.15)] p-3">
                        <div className="grid grid-cols-[auto_1fr_1fr_2fr_auto] gap-2 items-center">
                          <span className="font-bebas text-base text-[#dbb462]/20 w-5 text-center">{i + 1}</span>
                          <input type="date"  value={row.date}  onChange={e => updSched(row.id, 'date', e.target.value)}  className={inputCls + ' text-xs'} />
                          <input type="time"  value={row.time}  onChange={e => updSched(row.id, 'time', e.target.value)}  className={inputCls + ' text-xs'} />
                          <input type="text"  placeholder="Event name" value={row.event} onChange={e => updSched(row.id, 'event', e.target.value)} className={inputCls + ' text-xs'} />
                          <button onClick={() => delSched(row.id)} className="text-red-400 opacity-30 hover:opacity-100 p-1 transition-opacity">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="pl-7 mt-1.5">
                          <input
                            type="text"
                            placeholder="Note (optional)"
                            value={row.note || ''}
                            onChange={e => updSched(row.id, 'note', e.target.value)}
                            className="w-full bg-transparent border-b border-[rgba(78,70,56,0.1)] py-1 text-[11px] text-[#d1c5b3] opacity-50 focus:outline-none focus:opacity-80 focus:border-[#dbb462]/30 placeholder:opacity-30 transition-all"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={addScheduleRow}
                  className="flex items-center gap-2 border border-dashed border-[rgba(78,70,56,0.25)] px-4 py-3 w-full font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-40 hover:opacity-100 hover:bg-[#111] transition-all"
                >
                  <Plus size={13} /> ADD EVENT
                </button>
              </div>
            )}

            {/* ── ROADMAP ── */}
            {section === 'roadmap' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-teko text-[11px] tracking-widest text-[#d1c5b3] opacity-40">Presets:</span>
                  {Object.entries(ROADMAP_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyRoadmapPreset(key)}
                      className="flex items-center gap-1.5 bg-[#dbb462]/10 border border-[#dbb462]/20 text-[#dbb462] px-3 py-1.5 font-teko text-[11px] tracking-widest hover:bg-[#dbb462]/20 transition-colors uppercase"
                >
                  <Map size={11} /> {preset.label}
                </button>
                  ))}
                </div>

                {roadmapRows.length === 0 ? (
                  <div className="text-center py-10 bg-[#0a0a0a] border border-dashed border-[rgba(78,70,56,0.15)]">
                    <p className="font-teko text-[11px] text-[#d1c5b3] opacity-25 tracking-widest">
                      NO PHASES — APPLY A PRESET OR ADD MANUALLY
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roadmapRows.map((row, i) => (
                      <div key={row.id} className="bg-[#0a0a0a] border border-[rgba(78,70,56,0.15)] p-4 group">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-bebas text-sm text-[#dbb462]/20 w-5 text-center">{i + 1}</span>
                          <input
                            type="text"
                            placeholder="Phase label (e.g. GROUP STAGE)"
                            value={row.phase}
                            onChange={e => updRoad(row.id, 'phase', e.target.value)}
                            className="flex-1 bg-transparent border-b border-[rgba(78,70,56,0.2)] py-1 text-[12px] text-[#dbb462] focus:outline-none focus:border-[#f9d07a] font-teko tracking-[0.15em] placeholder:opacity-30 uppercase"
                          />
                          <button
                            onClick={() => delRoad(row.id)}
                            className="text-red-400 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity p-1"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        <div className="grid grid-cols-[1fr_2fr] gap-3 pl-7">
                          <input
                            type="text"
                            placeholder="Stage title"
                            value={row.title}
                            onChange={e => updRoad(row.id, 'title', e.target.value)}
                            className={inputCls + ' text-xs'}
                          />
                          <input
                            type="text"
                            placeholder="Short description"
                            value={row.description}
                            onChange={e => updRoad(row.id, 'description', e.target.value)}
                            className={inputCls + ' text-xs'}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={addRoadmapRow}
                  className="flex items-center gap-2 border border-dashed border-[rgba(78,70,56,0.25)] px-4 py-3 w-full font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-40 hover:opacity-100 hover:bg-[#111] transition-all"
                >
                  <Plus size={13} /> ADD PHASE
                </button>
              </div>
            )}

            {/* ── CONFIG ── */}
            {section === 'config' && (
              <div className="space-y-6">

                {/* Registration behaviour */}
                <div className="flex items-center justify-between bg-[#0a0a0a] border border-[rgba(78,70,56,0.15)] px-5 py-4">
                  <div>
                    <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] uppercase">Auto-Approve Registrations</p>
                    <p className="font-teko text-[10px] tracking-widest text-[#d1c5b3] opacity-30 mt-0.5">Instantly approve every submitted registration</p>
                  </div>
                  <button
                    onClick={() => set('auto_approve', !form.auto_approve)}
                    className={`transition-colors ${form.auto_approve ? 'text-[#f9d07a]' : 'text-[#4e4638]'}`}
                  >
                    {form.auto_approve ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                {/* WhatsApp group link */}
                <div>
                  <label className={labelCls}>WhatsApp Group Link <span className="opacity-40 normal-case tracking-normal">(shared with approved teams)</span></label>
                  <input
                    type="url"
                    value={form.whatsapp_group_link}
                    onChange={e => set('whatsapp_group_link', e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className={inputCls}
                  />
                </div>

                {/* Social links */}
                <div>
                  <p className={labelCls}>Social Channel Links</p>
                  <p className="font-teko text-[11px] tracking-widest text-[#d1c5b3] opacity-30 mb-3">
                    Add links so presets auto-fill screenshot requirements below.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className={labelCls}>YouTube Channel URL</label>
                      <input
                        type="url"
                        value={form.youtube_url || ''}
                        onChange={e => set('youtube_url', e.target.value)}
                        placeholder="https://youtube.com/@zenithesports"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Instagram Profile URL</label>
                      <input
                        type="url"
                        value={form.instagram_url || ''}
                        onChange={e => set('instagram_url', e.target.value)}
                        placeholder="https://instagram.com/zenithesports.pk"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick-add presets */}
                <div>
                  <p className={labelCls}>Quick-Add Requirements</p>
                  <div className="flex flex-wrap gap-2">
                    {SOCIAL_PRESETS.map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          const url = i === 0 ? form.youtube_url : i === 1 ? form.instagram_url : i === 3 ? form.discord_link : '';
                          const label = preset.template(url);
                          const newSS = [...(form.registration_config?.screenshots || []), { label, required: true }];
                          if (newSS.length > 6) { toast.error('Maximum 6 requirements allowed'); return; }
                          setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                          toast.success(`"${preset.label}" requirement added`);
                        }}
                        className="flex items-center gap-1.5 bg-[#dbb462]/8 border border-[#dbb462]/15 text-[#dbb462] px-3 py-1.5 font-teko text-[11px] tracking-widest hover:bg-[#dbb462]/18 transition-colors uppercase"
                      >
                        {preset.icon} {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Screenshot requirements list */}
                <div>
                  <p className={labelCls}>Screenshot Verification Requirements</p>
                  <p className="font-teko text-[11px] tracking-widest text-[#d1c5b3] opacity-30 mb-3">
                    Teams must upload these screenshots during registration.
                  </p>
                  <div className="space-y-3">
                    {(form.registration_config?.screenshots || []).map((ss, idx) => (
                      <div key={idx} className="bg-[#0a0a0a] border border-[rgba(78,70,56,0.15)] p-4 flex gap-3 items-end">
                        <div className="flex-1">
                          <label className={labelCls}>Requirement #{idx + 1}</label>
                          <input
                            type="text"
                            value={ss.label}
                            onChange={e => {
                              const newSS = [...form.registration_config.screenshots];
                              newSS[idx] = { ...newSS[idx], label: e.target.value };
                              setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                            }}
                            placeholder="e.g. Subscribe to Zenith Esports YouTube"
                            className={inputCls}
                          />
                        </div>
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <label className={labelCls + ' text-center'}>Req'd</label>
                          <button
                            type="button"
                            onClick={() => {
                              const newSS = [...form.registration_config.screenshots];
                              newSS[idx] = { ...newSS[idx], required: !newSS[idx].required };
                              setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                            }}
                            className={ss.required ? 'text-[#dbb462]' : 'text-white/20'}
                          >
                            {ss.required ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newSS = form.registration_config.screenshots.filter((_, i) => i !== idx);
                            setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                          }}
                          className="text-red-400 opacity-30 hover:opacity-100 p-1.5 transition-opacity shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {(form.registration_config?.screenshots || []).length < 6 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newSS = [...(form.registration_config?.screenshots || []), { label: '', required: true }];
                          setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                        }}
                        className="w-full py-3 border border-dashed border-[#dbb462]/15 text-[#dbb462]/30 hover:text-[#dbb462] hover:bg-[#dbb462]/5 font-teko text-[12px] tracking-[0.2em] transition-all uppercase"
                      >
                        + Add Custom Requirement
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>{/* end scrollable */}
        </div>{/* end content */}
      </div>{/* end modal box */}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Registration Add/Edit Modal
// ─────────────────────────────────────────────────────────────
function RegistrationModal({ isOpen, onClose, registration, tournament, onSave }) {
  const [form, setForm] = useState({
    team_name: '', real_name: '', whatsapp_number: '', captain_discord: '',
    player_1_id: '', player_2_id: '', player_3_id: '',
    player_4_id: '', player_5_id: '', player_6_id: '',
    player_1_ign: '', player_2_ign: '', player_3_ign: '',
    player_4_ign: '', player_5_ign: '', player_6_ign: '',
    tournament_id: '', status: 'pending', group_id: '', logo_url: '',
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (registration) {
      setForm({
        team_name:       registration.team_name || '',
        real_name:       registration.real_name || '',
        whatsapp_number: registration.whatsapp_number || '',
        captain_discord: registration.captain_discord || '',
        player_1_id:     registration.player_ids?.[0] || '',
        player_2_id:     registration.player_ids?.[1] || '',
        player_3_id:     registration.player_ids?.[2] || '',
        player_4_id:     registration.player_ids?.[3] || '',
        player_5_id:     registration.player_ids?.[4] || '',
        player_6_id:     registration.player_ids?.[5] || '',
        player_1_ign:    registration.player_igns?.[0] || '',
        player_2_ign:    registration.player_igns?.[1] || '',
        player_3_ign:    registration.player_igns?.[2] || '',
        player_4_ign:    registration.player_igns?.[3] || '',
        player_5_ign:    registration.player_igns?.[4] || '',
        player_6_ign:    registration.player_igns?.[5] || '',
        tournament_id:   registration.tournament_id || '',
        status:          registration.status || 'pending',
        group_id:        registration.group_id || '',
        logo_url:        registration.logo_url || '',
      });
    } else {
      setForm({
        team_name: '', real_name: '', whatsapp_number: '', captain_discord: '',
        player_1_id: '', player_2_id: '', player_3_id: '',
        player_4_id: '', player_5_id: '', player_6_id: '',
        player_1_ign: '', player_2_ign: '', player_3_ign: '',
        player_4_ign: '', player_5_ign: '', player_6_ign: '',
        tournament_id: tournament?.id || '',
        status: 'pending', group_id: '', logo_url: '',
      });
    }
    setFile(null);
  }, [registration, isOpen, tournament]);

  async function handleSave() {
    if (!form.team_name.trim()) { toast.error('Team name required'); return; }
    if (!form.tournament_id) { toast.error('Tournament required'); return; }
    setSaving(true);
    try {
      const playerIds = [
        form.player_1_id, form.player_2_id, form.player_3_id,
        form.player_4_id, form.player_5_id, form.player_6_id,
      ].filter(Boolean).map((x) => x.trim().toUpperCase());
      
      const playerIgns = [
        form.player_1_ign, form.player_2_ign, form.player_3_ign,
        form.player_4_ign, form.player_5_ign, form.player_6_ign,
      ].filter(Boolean).map((x) => x.trim());

      // Prepare clean data for the database (remove temporary UI fields)
      const { 
        player_1_id: _p1, player_2_id: _p2, player_3_id: _p3, player_4_id: _p4, player_5_id: _p5, player_6_id: _p6,
        player_1_ign: _i1, player_2_ign: _i2, player_3_ign: _i3, player_4_ign: _i4, player_5_ign: _i5, player_6_ign: _i6,
        ...dbData 
      } = form;

      await onSave({ ...dbData, player_ids: playerIds, player_igns: playerIgns }, file);
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full bg-[#131313] border border-[rgba(78,70,56,0.3)] p-2.5 text-sm text-[#e2e2e2] focus:outline-none focus:border-[#f9d07a] transition-colors font-mono placeholder:opacity-70';
  const labelCls = 'font-teko text-[13px] tracking-widest text-[#d1c5b3] uppercase block mb-1';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={registration ? 'EDIT REGISTRATION' : 'ADD REGISTRATION'}>
      <div className="space-y-5">
        {/* Logo */}
        <div className="flex gap-4 items-center">
          <div className="w-14 h-14 bg-[#131313] border border-[rgba(78,70,56,0.3)] flex-shrink-0 flex items-center justify-center overflow-hidden rounded-full">
            {file ? (
              <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
            ) : form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Users className="text-[#d1c5b3] opacity-20" size={20} />
            )}
          </div>
          <div className="flex-1">
            <label className={labelCls}>Team Logo</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-[10px] text-[#d1c5b3] file:mr-3 file:py-1.5 file:px-3 file:border-0 file:bg-[#1f1f1f] file:text-[#f9d07a] file:font-teko text-[14px] file:text-[9px] file:cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <GhostInput label="Team Name" value={form.team_name} onChange={(e) => setForm((f) => ({ ...f, team_name: e.target.value }))} required />
          <GhostInput label="Captain Real Name" value={form.real_name} onChange={(e) => setForm((f) => ({ ...f, real_name: e.target.value }))} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <GhostInput label="WhatsApp" value={form.whatsapp_number} onChange={(e) => setForm((f) => ({ ...f, whatsapp_number: e.target.value }))} />
          <GhostInput label="Discord" value={form.captain_discord} onChange={(e) => setForm((f) => ({ ...f, captain_discord: e.target.value }))} />
          <div className="space-y-1">
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className={inputCls}>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <label className={labelCls}>Players Info (IGN & Character ID)</label>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div key={num} className="grid grid-cols-2 gap-3">
                <GhostInput
                  label={`Player ${num} IGN${num <= 4 ? ' *' : ''}`}
                  value={form[`player_${num}_ign`]}
                  onChange={(e) => setForm((f) => ({ ...f, [`player_${num}_ign`]: e.target.value }))}
                  placeholder="In-Game Name"
                />
                <GhostInput
                  label={`Player ${num} ID${num <= 4 ? ' *' : ''}`}
                  value={form[`player_${num}_id`]}
                  onChange={(e) => setForm((f) => ({ ...f, [`player_${num}_id`]: e.target.value }))}
                  placeholder="5XXXXXXXXXX"
                />
              </div>
            ))}
          </div>
        </div>

        <GhostInput
          label="Group ID (Optional)"
          value={form.group_id}
          onChange={(e) => setForm((f) => ({ ...f, group_id: e.target.value }))}
          placeholder="e.g. Group 1"
        />

        {registration?.screenshot_urls?.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-white/10">
            <label className={labelCls}>Verification Proofs (Screenshots)</label>
            <div className="grid grid-cols-2 gap-4">
              {registration.screenshot_urls.filter(Boolean).map((entry, i) => (
                <ProofThumb key={i} entry={entry} index={i} />
              ))}
            </div>
          </div>
        )}

        <GradientButton className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? 'SAVING...' : (registration ? 'UPDATE REGISTRATION' : 'ADD REGISTRATION')}
        </GradientButton>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────
// Announcements Tab
// ─────────────────────────────────────────────────────────────
function AnnouncementsTab({ announcements, onAdd, onUpdate, onRemove }) {
  const [form, setForm] = useState({ title: '', body: '', is_gold: false });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => { setForm({ title: '', body: '', is_gold: false }); setEditingId(null); };

  async function handleSubmit() {
    if (!form.title.trim()) return toast.error('Announcement title is required');
    setSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, { title: form.title.trim(), body: form.body.trim() || null, is_gold: form.is_gold, updated_at: new Date().toISOString() });
        toast.success('Announcement updated');
      } else {
        await onAdd({ title: form.title.trim(), body: form.body.trim() || null, is_gold: form.is_gold, is_active: true });
        toast.success('Announcement published');
      }
      resetForm();
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a) {
    try {
      await onUpdate(a.id, { is_active: !a.is_active });
      toast.success(a.is_active ? 'Announcement hidden' : 'Announcement published');
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    }
  }

  async function handleDelete(a) {
    if (!confirm(`Delete announcement "${a.title}"?`)) return;
    try {
      await onRemove(a.id);
      toast.success('Announcement deleted');
      if (editingId === a.id) resetForm();
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    }
  }

  const inputCls = 'w-full bg-[#131313] border border-[rgba(78,70,56,0.3)] p-3 text-sm text-[#e2e2e2] focus:outline-none focus:border-[#f9d07a] transition-colors font-body';
  const labelCls = 'font-teko text-[13px] tracking-widest text-[#d1c5b3] uppercase block mb-1';

  return (
    <div className="space-y-8 animate-page-enter max-w-5xl">
      {/* Composer */}
      <div className="bg-[#1b1b1b] border border-[rgba(78,70,56,0.2)] p-6 space-y-4">
        <h3 className="font-bebas text-2xl text-[#f9d07a] tracking-widest uppercase flex items-center gap-2">
          <Megaphone size={18} /> {editingId ? 'Edit Announcement' : 'New Announcement'}
        </h3>
        <div>
          <label className={labelCls}>Title *</label>
          <input className={inputCls} value={form.title} maxLength={120}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Winter Championship registrations now open" />
        </div>
        <div>
          <label className={labelCls}>Details (optional)</label>
          <textarea className={`${inputCls} resize-none`} rows={3} value={form.body} maxLength={500}
            onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
            placeholder="Supporting detail shown on the landing page card." />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => setForm(f => ({ ...f, is_gold: !f.is_gold }))}
            className="flex items-center gap-2 font-teko text-[13px] tracking-widest uppercase text-[#d1c5b3]">
            {form.is_gold ? <ToggleRight size={28} className="text-[#f9d07a]" /> : <ToggleLeft size={28} className="text-[#4e4638]" />}
            Highlight (Gold + Ticker Pulse)
          </button>
          <div className="flex gap-3">
            {editingId && (
              <button onClick={resetForm} className="border border-white/10 px-6 py-2.5 font-teko text-[13px] tracking-widest text-[#d1c5b3] hover:bg-white/5 transition-colors uppercase">
                Cancel
              </button>
            )}
            <GradientButton onClick={handleSubmit} disabled={saving}>
              {saving ? 'SAVING...' : editingId ? 'UPDATE' : 'PUBLISH'}
            </GradientButton>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <h3 className="font-bebas text-xl text-white tracking-widest uppercase">Published ({announcements.length})</h3>
        {announcements.length === 0 ? (
          <div className="text-center py-10 bg-[#1b1b1b]">
            <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-40">NO ANNOUNCEMENTS YET</p>
          </div>
        ) : announcements.map(a => (
          <div key={a.id} className={`bg-[#1b1b1b] border border-[rgba(78,70,56,0.15)] p-5 flex items-start justify-between gap-4 ${a.is_gold ? 'border-l-2 border-l-[#f9d07a]' : ''}`}>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <p className={`font-bebas text-lg leading-tight ${a.is_gold ? 'text-[#f9d07a]' : 'text-white'}`}>{a.title}</p>
                <span className={`font-teko text-[11px] tracking-widest px-2 py-0.5 uppercase border ${a.is_active ? 'border-emerald-500/30 text-emerald-400' : 'border-[rgba(78,70,56,0.3)] text-[#d1c5b3] opacity-60'}`}>
                  {a.is_active ? 'Live' : 'Hidden'}
                </span>
              </div>
              {a.body && <p className="font-body text-sm text-[#d1c5b3] opacity-50 line-clamp-2">{a.body}</p>}
              <p className="font-teko text-[11px] tracking-widest text-[#d1c5b3] opacity-30 uppercase mt-2">
                {new Date(a.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => toggleActive(a)} title={a.is_active ? 'Hide' : 'Publish'} className="text-[#d1c5b3] opacity-60 hover:opacity-100 hover:text-[#f9d07a] transition-colors">
                {a.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
              </button>
              <button onClick={() => { setEditingId(a.id); setForm({ title: a.title, body: a.body || '', is_gold: a.is_gold }); window.scrollTo({ top: 0, behavior: 'smooth' }); }} title="Edit" className="text-[#d1c5b3] opacity-60 hover:opacity-100 hover:text-[#f9d07a] transition-colors">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(a)} title="Delete" className="text-[#d1c5b3] opacity-60 hover:opacity-100 hover:text-red-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Users Tab — role management
// ─────────────────────────────────────────────────────────────
function UsersTab({ currentUserId }) {
  const { data: users, update: updateUser } = useSupabaseDB('users', { field: 'created_at', direction: 'desc' });
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.display_name || '').toLowerCase().includes(q) ||
           (u.email || '').toLowerCase().includes(q) ||
           (u.team_name || '').toLowerCase().includes(q);
  });

  const adminCount = users.filter(u => u.role === 'admin').length;

  async function toggleRole(u) {
    const makingUser = u.role === 'admin';
    if (makingUser && u.id === currentUserId) return toast.error("You can't remove your own admin access.");
    if (makingUser && adminCount <= 1) return toast.error('At least one admin must remain.');
    const next = makingUser ? 'user' : 'admin';
    if (!confirm(`${makingUser ? 'Revoke admin from' : 'Grant admin to'} ${u.display_name || u.email}?`)) return;
    setBusyId(u.id);
    try {
      await updateUser(u.id, { role: next });
      toast.success(`${u.display_name || u.email} is now ${next === 'admin' ? 'an admin' : 'a standard user'}`);
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6 animate-page-enter max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-[1px] bg-[rgba(78,70,56,0.15)]">
        <AnalyticCard label="Total Users" value={users.length} gold />
        <AnalyticCard label="Admins" value={adminCount} />
        <AnalyticCard label="Standard Users" value={users.length - adminCount} />
      </div>

      <div className="flex items-center gap-3 bg-[#1b1b1b] border border-[rgba(78,70,56,0.2)] px-4 py-3 max-w-sm">
        <Search size={14} className="text-[#d1c5b3] opacity-50 shrink-0" />
        <input type="text" placeholder="Search name, email, or team..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-transparent text-sm font-teko tracking-widest text-[#d1c5b3] placeholder:opacity-50 focus:outline-none w-full" />
        {search && <button onClick={() => setSearch('')} className="text-[#d1c5b3] opacity-40 hover:opacity-100"><X size={12} /></button>}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 bg-[#1b1b1b]">
            <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-40">NO USERS FOUND</p>
          </div>
        ) : filtered.map(u => (
          <div key={u.id} className="bg-[#1b1b1b] border border-[rgba(78,70,56,0.15)] p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className={`w-10 h-10 flex items-center justify-center shrink-0 border ${u.role === 'admin' ? 'bg-[#f9d07a]/10 border-[#f9d07a]/30' : 'bg-[#131313] border-white/5'}`}>
                {u.role === 'admin' ? <Shield size={16} className="text-[#f9d07a]" /> : <User size={16} className="text-[#d1c5b3] opacity-50" />}
              </div>
              <div className="min-w-0">
                <p className="font-bebas text-lg text-white leading-tight truncate">{u.display_name || 'Unnamed Player'}</p>
                <p className="font-teko text-[12px] tracking-wider text-[#d1c5b3] opacity-40 truncate">{u.email}{u.team_name ? ` · ${u.team_name}` : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`font-teko text-[11px] tracking-widest px-2 py-0.5 uppercase border ${u.role === 'admin' ? 'border-[#f9d07a]/30 text-[#f9d07a]' : 'border-[rgba(78,70,56,0.3)] text-[#d1c5b3] opacity-70'}`}>
                {u.role || 'user'}
              </span>
              <button
                onClick={() => toggleRole(u)}
                disabled={busyId === u.id}
                className="font-teko text-[12px] tracking-widest uppercase border border-white/10 px-4 py-2 text-[#d1c5b3] hover:bg-white/5 hover:text-[#f9d07a] transition-colors disabled:opacity-40"
              >
                {busyId === u.id ? '...' : u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Proof Thumbnail — proofs live in a private bucket; admins view
// them through short-lived signed URLs (RLS-gated server-side).
// ─────────────────────────────────────────────────────────────
function ProofThumb({ entry, index }) {
  const [url, setUrl] = useState(null);

  React.useEffect(() => {
    let alive = true;
    getSignedProofUrl(entry).then((signed) => { if (alive) setUrl(signed); });
    return () => { alive = false; };
  }, [entry]);

  if (!url) {
    return <div className="aspect-video bg-[#1a1a1a] border border-white/5 animate-pulse" />;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group relative aspect-video bg-[#1a1a1a] border border-white/5 overflow-hidden flex items-center justify-center"
    >
      <img src={url} alt={`Proof ${index + 1}`} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
        <span className="font-teko text-[13px] text-[#f9d07a] tracking-widest uppercase border border-[#f9d07a]/30 px-3 py-1">View Full</span>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// Loading Screen
// ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131313] pt-28">
      <div className="font-bebas text-4xl font-bold italic text-[#dbb462] animate-pulse">LOADING...</div>
    </div>
  );
}
