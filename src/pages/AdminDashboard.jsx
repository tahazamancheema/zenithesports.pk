import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Download, Users, CheckCircle2, XCircle, Split,
  Plus, Edit2, Trash2, BarChart3,
  Eye, X, ToggleLeft, ToggleRight, Clock, Calendar,
  FileText, Map, ListOrdered, Search, RefreshCw, Trophy, TrendingUp,
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
import { uploadFile } from '../utils/storage';
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
    <div className="min-h-screen bg-[#131313] pt-20">
      <div className="flex animate-page-enter">

        {/* ── Sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 bg-[#131313] border-r border-[rgba(78,70,56,0.15)] min-h-[calc(100vh-5rem)] shrink-0">
          <div className="p-8">
            <h2 className="font-bebas text-2xl font-bold text-[#dbb462] tracking-widest">ZENITH DASHBOARD</h2>
            <p className="font-teko text-[12px] tracking-widest text-[#d1c5b3] opacity-60 mt-1">ADMIN OVERVIEW</p>
          </div>

          <nav className="flex-1 space-y-1">
            {[
              { id: 'overview',     icon: TrendingUp, label: 'Overview' },
              { id: 'tournaments',  icon: BarChart3,  label: 'Tournaments' },
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
        <main className="flex-1 p-8 lg:p-12 overflow-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="font-bebas text-5xl md:text-6xl font-black italic tracking-wider uppercase">
                ZENITH ADMIN
              </h1>
              <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-70 mt-2">
                REAL-TIME MANAGEMENT & GRID LOGISTICS
              </p>
            </div>
            <div className="flex md:hidden">
              <GradientButton onClick={() => setTournamentModal({ open: true, data: null })} icon={Plus}>
                CREATE
              </GradientButton>
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
            const finalData = { ...data, logo_url: logoUrl };
            if (registrationModal.data) {
              await updateReg(registrationModal.data.id, finalData);
              toast.success('Registration updated!');
            } else {
              await addReg({ ...finalData, status: finalData.status || 'pending' });
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

const EMPTY_FORM = {
  title: '',
  description: '',
  briefing: '',
  game: 'PUBG Mobile',
  max_teams: 64,
  prize_pool: '',
  registration_open_date: '',
  registration_deadline: '',
  start_date: '',
  poster_url: '',
  is_completed: false,
  registration_config: { screenshots: [] },
};

function TournamentModal({ isOpen, onClose, tournament, onSave }) {

  const [form, setForm] = useState(EMPTY_FORM);
  const [scheduleRows, setScheduleRows] = useState([]);
  const [roadmapRows, setRoadmapRows] = useState([]);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [section, setSection] = useState('basic');

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
    if (isOpen) {
      if (tournament) {
        setForm({
          title:                  tournament.title || '',
          description:            tournament.description || '',
          briefing:               tournament.briefing || '',
          game:                   tournament.game || 'PUBG Mobile',
          max_teams:              tournament.max_teams === null ? '' : (tournament.max_teams ?? 64),
          prize_pool:             tournament.prize_pool || '',
          registration_open_date: toPKT(tournament.registration_open_date),
          registration_deadline:  toPKT(tournament.registration_deadline),
          start_date:             tournament.start_date ? new Date(tournament.start_date).toISOString().slice(0, 10) : '',
          poster_url:             tournament.poster_url || '',
          is_completed:           tournament.is_completed || false,
          registration_config:    tournament.registration_config || { screenshots: [] },
        });
        setScheduleRows(parseJSON(tournament.schedule).map((r) => ({ ...r, id: Math.random() })));
        setRoadmapRows(parseJSON(tournament.roadmap).map((r) => ({ ...r, id: Math.random() })));
      } else {
        setForm({ ...EMPTY_FORM });
        setScheduleRows([]);
        setRoadmapRows([]);
      }
      setFile(null);
      setSection('basic');
    }
  }, [tournament, isOpen]);

  // ── Schedule helpers ──
  const addScheduleRow = () => setScheduleRows((p) => [...p, { id: Math.random(), date: '', time: '', event: '' }]);
  const updSched = (id, field, value) => setScheduleRows((p) => p.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const delSched = (id) => setScheduleRows((p) => p.filter((r) => r.id !== id));

  // ── Roadmap helpers ──
  const addRoadmapRow = () => setRoadmapRows((p) => [...p, { id: Math.random(), phase: '', title: '', description: '' }]);
  const updRoad = (id, field, value) => setRoadmapRows((p) => p.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const delRoad = (id) => setRoadmapRows((p) => p.filter((r) => r.id !== id));

  // ── Auto-generators ──
  function autoFillBriefing() {
    const title    = form.title?.trim() || 'ZENITH OPEN';
    const game     = form.game || 'PUBG Mobile';
    const prize    = form.prize_pool ? `PKR ${Number(form.prize_pool).toLocaleString('en-PK')}` : 'TBA';
    const slots    = form.max_teams ? `${form.max_teams} teams` : 'unlimited teams';
    const deadline = form.registration_deadline
      ? new Date(fromPKT(form.registration_deadline)).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'TBA';
    const startStr = form.start_date
      ? new Date(form.start_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'TBA';

    setForm(f => ({
      ...f,
      briefing: `Welcome to ${title} — an official ${game} tournament hosted by Zenith Esports Pakistan.

TOURNAMENT FORMAT
• Mode: Battle Royale (Squad — 4 players per team)
• Total Slots: ${slots}
• Format: Group Stage → Knockout Rounds → Grand Final
• Scoring: Standard PUBG Mobile scoring (Placement Points + Kill Points)

PRIZE POOL
Total Prize Pool: ${prize}
Prize distribution will be announced after bracket finalization.

KEY DATES
• Registration Deadline: ${deadline}
• Tournament Start: ${startStr}

ELIGIBILITY & RULES
1. All players must be registered with their correct PUBG Mobile Character IDs.
2. No roster changes are allowed after the registration deadline.
3. Players must be online and ready 15 minutes before each scheduled match.
4. No cheating, hacking, or use of any unauthorized third-party software.
5. Misconduct, toxicity, or unsportsmanlike behavior will result in disqualification.
6. All disputes are subject to the final decision of Zenith Esports administration.

For queries, reach out via WhatsApp or our official Discord server.
Good luck, and may the best team win!`,
    }));
    toast.success('Briefing template applied');
  }

  function applyRoadmapPreset(key) {
    const preset = ROADMAP_PRESETS[key];
    if (!preset) return;
    setRoadmapRows(preset.rows.map(r => ({ ...r, id: Math.random() })));
    toast.success(`"${preset.label}" roadmap applied`);
  }

  function autoFillSchedule() {
    if (!form.start_date) { toast.error('Set the Tournament Start Date first (Basic tab)'); return; }
    const base = new Date(form.start_date);
    const offsetDate = (d, days) => {
      const n = new Date(d); n.setDate(n.getDate() + days);
      return n.toISOString().slice(0, 10);
    };
    const rows = [
      { date: form.start_date,      time: '18:00', event: 'Group Stage — Day 1' },
      { date: offsetDate(base, 1),  time: '18:00', event: 'Group Stage — Day 2' },
      { date: offsetDate(base, 2),  time: '18:00', event: 'Quarter Finals' },
      { date: offsetDate(base, 3),  time: '18:00', event: 'Semi Finals' },
      { date: offsetDate(base, 4),  time: '20:00', event: 'Grand Finals' },
    ];
    setScheduleRows(rows.map(r => ({ ...r, id: Math.random() })));
    toast.success('Schedule template generated from start date');
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Tournament title is required'); return; }
    if (form.title.trim().length < 3) { toast.error('Title must be at least 3 characters'); return; }

    // ── Date ordering validation ──
    const openTs     = form.registration_open_date ? new Date(fromPKT(form.registration_open_date)) : null;
    const deadlineTs = form.registration_deadline  ? new Date(fromPKT(form.registration_deadline))  : null;
    const startTs    = form.start_date             ? new Date(form.start_date)                       : null;

    if (openTs && deadlineTs && openTs >= deadlineTs) {
      toast.error('Registration deadline must be after the open date'); return;
    }
    if (deadlineTs && startTs && deadlineTs > startTs) {
      toast.error('Tournament start date must be on or after the registration deadline'); return;
    }

    const parsedMaxTeams = (form.max_teams === '' || form.max_teams === null) ? null : parseInt(form.max_teams, 10);
    if (parsedMaxTeams !== null && (isNaN(parsedMaxTeams) || parsedMaxTeams < 2)) {
      toast.error('Max teams must be at least 2'); return;
    }

    // ── Warn about empty schedule/roadmap rows ──
    const validSchedule = scheduleRows.filter(r => r.event?.trim());
    const validRoadmap  = roadmapRows.filter(r => r.title?.trim());

    setSaving(true);
    try {
      const finalData = {
        ...form,
        max_teams:              parsedMaxTeams,
        registration_open_date: fromPKT(form.registration_open_date),
        registration_deadline:  fromPKT(form.registration_deadline),
        schedule: validSchedule.map(({ date, time, event }) => ({ date, time, event })),
        roadmap:  validRoadmap.map(({ phase, title, description }) => ({ phase, title, description })),
      };
      await onSave(finalData, file);
    } finally {
      setSaving(false);
    }
  }

  // ── Section completion indicators ──
  const sectionComplete = {
    basic:      !!(form.title?.trim() && form.prize_pool),
    content:    !!(form.briefing?.trim()),
    schedule:   scheduleRows.filter(r => r.event?.trim()).length > 0,
    roadmap:    roadmapRows.filter(r => r.title?.trim()).length > 0,
    reg_config: (form.registration_config?.screenshots || []).length > 0,
  };

  const computedStatus = computeTournamentStatus(form);

  const modalSections = [
    { id: 'basic',      label: 'Basic',    icon: BarChart3   },
    { id: 'content',    label: 'Briefing', icon: FileText    },
    { id: 'schedule',   label: 'Schedule', icon: ListOrdered },
    { id: 'roadmap',    label: 'Roadmap',  icon: Map         },
    { id: 'reg_config', label: 'Config',   icon: ListOrdered },
  ];

  const inputCls = 'w-full bg-[#131313] border border-[rgba(78,70,56,0.3)] p-2.5 text-sm text-[#e2e2e2] focus:outline-none focus:border-[#f9d07a] transition-colors font-mono placeholder:opacity-70';
  const labelCls = 'font-teko text-[13px] tracking-widest text-[#d1c5b3] uppercase block mb-1';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={tournament ? 'EDIT TOURNAMENT' : 'CREATE TOURNAMENT'}>
      {/* Section nav */}
      <div className="flex gap-1 mb-6 -mx-1">
        {modalSections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={`relative flex items-center gap-1.5 flex-1 justify-center py-2 font-teko text-[13px] tracking-widest transition-all ${
              section === id ? 'bg-[#f9d07a] text-[#402d00]' : 'bg-[#1f1f1f] text-[#d1c5b3] opacity-70 hover:opacity-100'
            }`}
          >
            <Icon size={11} /> {label}
            {sectionComplete[id] && section !== id && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── BASIC ── */}
      {section === 'basic' && (
        <div className="space-y-5">
          {/* Poster */}
          <div className="flex gap-4">
            <div className="w-24 h-32 bg-[#0e0e0e] border border-[rgba(78,70,56,0.3)] flex-shrink-0 flex items-center justify-center overflow-hidden">
              {file ? (
                <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
              ) : form.poster_url ? (
                <img src={form.poster_url} alt="Poster" className="w-full h-full object-cover" />
              ) : (
                <BarChart3 className="text-[#d1c5b3] opacity-20" size={28} />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className={labelCls}>Event Poster</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="w-full text-[10px] text-[#d1c5b3] file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-[#1f1f1f] file:text-[#f9d07a] file:font-teko text-[14px] file:text-[9px] file:cursor-pointer hover:file:bg-[#2a2a2a]"
              />
              <p className="text-[9px] text-[#d1c5b3] opacity-70">Recommended: 16:9 or 3:4 ratio</p>
            </div>
          </div>

          <GhostInput
            label="Tournament Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. ZENITH OPEN S1"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className={labelCls}>Game</label>
              <select
                value={form.game}
                onChange={(e) => setForm((f) => ({ ...f, game: e.target.value }))}
                className={inputCls}
              >
                <option>PUBG Mobile</option>
                <option>Warzone</option>
                <option>Free Fire</option>
                <option>Valorant</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Max Teams</label>
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="checkbox"
                    id="unlimitedTeams"
                    checked={form.max_teams === '' || form.max_teams === null}
                    onChange={(e) => setForm((f) => ({ ...f, max_teams: e.target.checked ? '' : 64 }))}
                    className="accent-[#dbb462]"
                  />
                  <label htmlFor="unlimitedTeams" className="font-teko text-[12px] text-[#dbb462] cursor-pointer tracking-widest uppercase">
                    Unset (Unlimited)
                  </label>
                </div>
              </div>
              <input
                type="number"
                value={form.max_teams === null ? '' : form.max_teams}
                onChange={(e) => setForm((f) => ({ ...f, max_teams: e.target.value }))}
                disabled={form.max_teams === '' || form.max_teams === null}
                className={inputCls + (form.max_teams === '' || form.max_teams === null ? ' opacity-70 cursor-not-allowed' : '')}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <GhostInput
            label="Prize Pool (PKR)"
            type="number"
            value={form.prize_pool}
            onChange={(e) => setForm((f) => ({ ...f, prize_pool: e.target.value }))}
            placeholder="50000"
          />

          {/* ── Dates & Auto Status ── */}
          <div className="bg-[#0e0e0e] border border-[rgba(78,70,56,0.2)] p-4 space-y-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-70">AUTO-COMPUTED STATUS</span>
              <span className={`font-teko text-[13px] tracking-widest px-3 py-1 border ${
                computedStatus === 'registrations_open'    ? 'text-emerald-400 border-emerald-500/30' :
                computedStatus === 'in_progress' ? 'text-blue-400 border-blue-500/30' :
                computedStatus === 'registrations_closed' ? 'text-red-400 border-red-500/30' :
                computedStatus === 'completed' ? 'text-[#9a8f7f] border-[rgba(78,70,56,0.3)]' :
                'text-[#f9d07a] border-[#f9d07a]/30'
              }`}>
                {computedStatus.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Registration Opens</label>
              <input
                type="datetime-local"
                value={form.registration_open_date}
                onChange={(e) => setForm((f) => ({ ...f, registration_open_date: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Registration Deadline</label>
              <input
                type="datetime-local"
                value={form.registration_deadline}
                onChange={(e) => setForm((f) => ({ ...f, registration_deadline: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Tournament Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                className={inputCls}
              />
            </div>

            {/* Completed toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-[rgba(78,70,56,0.15)]">
              <span className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-70">
                MARK AS COMPLETED
              </span>
              <button
                onClick={() => setForm((f) => ({ ...f, is_completed: !f.is_completed }))}
                className={`transition-colors ${form.is_completed ? 'text-[#f9d07a]' : 'text-[#4e4638]'}`}
              >
                {form.is_completed
                  ? <ToggleRight size={28} />
                  : <ToggleLeft size={28} />
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BRIEFING ── */}
      {section === 'content' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <label className={labelCls}>Short Description (shown on tournament cards)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Brief one-liner about the tournament..."
              rows={2}
              className="w-full bg-[#131313] border border-[rgba(78,70,56,0.3)] p-3 text-sm text-[#e2e2e2] focus:outline-none focus:border-[#f9d07a] transition-colors resize-none"
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls + ' mb-0'}>Full Briefing (shown in Overview tab)</label>
              <div className="flex items-center gap-3">
                <span className="font-teko text-[11px] tracking-widest text-[#d1c5b3] opacity-40">
                  {(form.briefing || '').length} chars
                </span>
                <button
                  type="button"
                  onClick={autoFillBriefing}
                  className="flex items-center gap-1.5 bg-[#dbb462]/10 border border-[#dbb462]/30 text-[#dbb462] px-3 py-1 font-teko text-[11px] tracking-widest hover:bg-[#dbb462]/20 transition-colors uppercase"
                >
                  <FileText size={11} /> AUTO-FILL TEMPLATE
                </button>
              </div>
            </div>
            <textarea
              value={form.briefing}
              onChange={(e) => setForm((f) => ({ ...f, briefing: e.target.value }))}
              placeholder="Detailed tournament rules, format, eligibility, etc. — or click AUTO-FILL TEMPLATE above."
              rows={12}
              className="w-full bg-[#131313] border border-[rgba(78,70,56,0.3)] p-3 text-sm text-[#e2e2e2] focus:outline-none focus:border-[#f9d07a] transition-colors resize-none leading-relaxed"
            />
          </div>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {section === 'schedule' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-60">
              Events in chronological order — displayed on the Schedule tab.
            </p>
            <button
              type="button"
              onClick={autoFillSchedule}
              className="flex items-center gap-1.5 bg-[#dbb462]/10 border border-[#dbb462]/30 text-[#dbb462] px-3 py-1.5 font-teko text-[11px] tracking-widest hover:bg-[#dbb462]/20 transition-colors uppercase whitespace-nowrap"
            >
              <Calendar size={11} /> AUTO-GENERATE
            </button>
          </div>

          {scheduleRows.length === 0 && (
            <div className="text-center py-8 bg-[#0e0e0e]">
              <p className="font-teko text-[13px] text-[#d1c5b3] opacity-40 tracking-widest">
                NO EVENTS YET — ADD MANUALLY OR CLICK AUTO-GENERATE
              </p>
            </div>
          )}

          <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
            {scheduleRows.map((row, i) => (
              <div key={row.id} className="grid grid-cols-[auto_1fr_1fr_2fr_auto] gap-2 items-center">
                <span className="font-bebas text-base text-[#dbb462]/30 w-5 text-center">{i + 1}</span>
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => updSched(row.id, 'date', e.target.value)}
                  className={inputCls}
                />
                <input
                  type="time"
                  value={row.time}
                  onChange={(e) => updSched(row.id, 'time', e.target.value)}
                  className={inputCls}
                />
                <input
                  type="text"
                  placeholder="Event name (e.g. Group Stage Day 1)"
                  value={row.event}
                  onChange={(e) => updSched(row.id, 'event', e.target.value)}
                  className={inputCls}
                />
                <button onClick={() => delSched(row.id)} className="text-[#ffb4ab] hover:opacity-70 p-1">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addScheduleRow}
            className="flex items-center gap-2 border border-dashed border-[rgba(78,70,56,0.4)] px-4 py-3 w-full font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-70 hover:opacity-100 hover:bg-[#1f1f1f] transition-all"
          >
            <Plus size={14} /> ADD EVENT
          </button>
        </div>
      )}

      {/* ── ROADMAP ── */}
      {section === 'roadmap' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <p className="font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-60">
              Define tournament phases — or apply a preset:
            </p>
            <div className="flex flex-wrap gap-2">
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
          </div>

          {roadmapRows.length === 0 && (
            <div className="text-center py-8 bg-[#0e0e0e]">
              <p className="font-teko text-[13px] text-[#d1c5b3] opacity-40 tracking-widest">
                NO PHASES YET — APPLY A PRESET OR ADD MANUALLY
              </p>
            </div>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
            {roadmapRows.map((row, i) => (
              <div key={row.id} className="bg-[#0e0e0e] border border-[rgba(78,70,56,0.15)] p-3 group relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bebas text-sm text-[#dbb462]/40 w-4">{i + 1}</span>
                  <input
                    type="text"
                    placeholder="Phase label (e.g. Group Stage)"
                    value={row.phase}
                    onChange={(e) => updRoad(row.id, 'phase', e.target.value)}
                    className="flex-1 bg-transparent border-b border-[rgba(78,70,56,0.3)] py-1 text-xs text-[#dbb462] focus:outline-none focus:border-[#f9d07a] font-teko tracking-widest placeholder:opacity-40 uppercase"
                  />
                  <button
                    onClick={() => delRoad(row.id)}
                    className="text-[#ffb4ab] opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity p-1 ml-auto"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-[1fr_2fr] gap-2 pl-6">
                  <input
                    type="text"
                    placeholder="Stage title"
                    value={row.title}
                    onChange={(e) => updRoad(row.id, 'title', e.target.value)}
                    className={inputCls + ' text-xs'}
                  />
                  <input
                    type="text"
                    placeholder="Short description"
                    value={row.description}
                    onChange={(e) => updRoad(row.id, 'description', e.target.value)}
                    className={inputCls + ' text-xs'}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addRoadmapRow}
            className="flex items-center gap-2 border border-dashed border-[rgba(78,70,56,0.4)] px-4 py-3 w-full font-teko text-[13px] tracking-widest text-[#d1c5b3] opacity-70 hover:opacity-100 hover:bg-[#1f1f1f] transition-all"
          >
            <Plus size={14} /> ADD PHASE
          </button>
        </div>
      )}

      {/* ── REGISTRATION CONFIG ── */}
      {section === 'reg_config' && (
        <div className="space-y-6">
          <div>
            <h4 className={labelCls}>Screenshot Verification</h4>
            <p className="text-[10px] text-[#d1c5b3] opacity-60 mb-4 leading-relaxed">
              Require users to upload proof (e.g., Discord join, YouTube sub, In-game profile) during registration.
            </p>

            <div className="space-y-3">
              {(form.registration_config?.screenshots || []).map((ss, idx) => (
                <div key={idx} className="bg-[#0e0e0e] border border-[rgba(78,70,56,0.2)] p-4 flex gap-4 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="font-teko text-[12px] text-[#dbb462]/60 uppercase tracking-widest">Requirement Label</label>
                    <input
                      type="text"
                      value={ss.label}
                      onChange={(e) => {
                        const newSS = [...form.registration_config.screenshots];
                        newSS[idx].label = e.target.value;
                        setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                      }}
                      placeholder="e.g. Subscribe to Zenith YT"
                      className={inputCls}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <label className="font-teko text-[12px] text-[#dbb462]/60 uppercase tracking-widest">Required</label>
                    <button
                      onClick={() => {
                        const newSS = [...form.registration_config.screenshots];
                        newSS[idx].required = !newSS[idx].required;
                        setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                      }}
                      className={ss.required ? 'text-[#dbb462]' : 'text-white/20'}
                    >
                      {ss.required ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const newSS = form.registration_config.screenshots.filter((_, i) => i !== idx);
                      setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                    }}
                    className="text-red-400 opacity-60 hover:opacity-100 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {(form.registration_config?.screenshots || []).length < 4 && (
                <button
                  onClick={() => {
                    const newSS = [...(form.registration_config?.screenshots || []), { label: '', required: true }];
                    setForm(f => ({ ...f, registration_config: { ...f.registration_config, screenshots: newSS } }));
                  }}
                  className="w-full py-4 border border-dashed border-[#dbb462]/20 text-[#dbb462]/40 hover:text-[#dbb462] hover:bg-[#dbb462]/5 font-teko text-[13px] tracking-[0.2em] transition-all uppercase"
                >
                  + Add Screenshot Requirement
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <GradientButton className="w-full mt-6" onClick={handleSave} disabled={saving}>
        {saving ? 'SAVING...' : (tournament ? 'UPDATE TOURNAMENT' : 'CREATE TOURNAMENT')}
      </GradientButton>
    </Modal>
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
              accept="image/*"
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
              {registration.screenshot_urls.filter(Boolean).map((url, i) => (
                <a 
                  key={i} 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="group relative aspect-video bg-[#1a1a1a] border border-white/5 overflow-hidden flex items-center justify-center"
                >
                   <img src={url} alt={`Proof ${i+1}`} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                      <span className="font-teko text-[13px] text-[#f9d07a] tracking-widest uppercase border border-[#f9d07a]/30 px-3 py-1">View Full</span>
                   </div>
                </a>
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
// Loading Screen
// ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131313] pt-20">
      <div className="font-bebas text-4xl font-bold italic text-[#dbb462] animate-pulse">LOADING...</div>
    </div>
  );
}
