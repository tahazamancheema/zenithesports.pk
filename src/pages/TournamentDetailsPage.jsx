import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Trophy, Users, Clock, Calendar, Map, ListOrdered, BookOpen, MessageCircle, ArrowRight, Shield, ChevronRight, BarChart2, Plus, Edit2, Trash2, X, Check, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../supabase/config';
import { computeTournamentStatus } from '../utils/tournamentStatus';
import { useAuth } from '../hooks/useAuth';
import StatusBadge from '../components/ui/StatusBadge';
import RegistrationCountdown from '../components/RegistrationCountdown';
import { useSupabaseDB } from '../hooks/useSupabaseDB';
import { useTournamentCountdown } from '../hooks/useTournamentCountdown';
import { getGame } from '../config/games';

const TABS = [
  { id: 'overview',  label: 'OVERVIEW',  icon: BookOpen },
  { id: 'schedule',  label: 'SCHEDULE',  icon: ListOrdered },
  { id: 'roadmap',   label: 'ROADMAP',   icon: Map },
  { id: 'teams',     label: 'TEAMS',     icon: Users },
  { id: 'results',   label: 'RESULTS',   icon: BarChart2 },
];

const EMPTY_ROW = () => ({ rank: '', team: '', kills: '', points: '', total: '' });
const STAGE_OPTIONS = ['Group Stage', 'Quarter Final', 'Semi Final', 'Final', 'Play-offs', 'Custom'];

export default function TournamentDetailsPage() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [resultModal, setResultModal] = useState({ open: false, data: null });

  // Use the robust real-time hook for tournament data
  const { 
    data: tList, 
    loading: tLoading, 
    error: tError 
  } = useSupabaseDB('tournaments', null, [['id', 'eq', id]]);

  // Use the robust real-time hook for registrations
  const {
    data: registrations,
    loading: rLoading,
    error: rError
  } = useSupabaseDB('registrations_public', null, [['tournament_id', 'eq', id]]);

  // Results
  const {
    data: results,
    add: addResult,
    update: updateResult,
    remove: removeResult,
  } = useSupabaseDB('tournament_results', { field: 'created_at', direction: 'asc' }, [['tournament_id', 'eq', id]]);

  const tournament = tList?.[0] || null;
  const loading = tLoading && !tournament;

  const { phase } = useTournamentCountdown(tournament?.registration_open_date, tournament?.registration_deadline);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex justify-center items-start bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4 mt-24 animate-pulse">
          <div className="w-16 h-[2px] bg-[#dbb462]" />
          <span className="font-bebas text-4xl text-[#dbb462] tracking-widest uppercase">Loading Data</span>
          <div className="w-16 h-[2px] bg-[#dbb462]" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center bg-[#0a0a0a]">
        <Trophy className="text-[#dbb462] opacity-[0.06] mb-8" size={80} />
        <h1 className="font-bebas text-5xl mb-4 uppercase">TOURNAMENT NOT FOUND</h1>
        <Link to="/tournaments" className="font-teko text-[16px] text-[#dbb462] hover:underline uppercase tracking-[0.2em]">
          RETURN TO DIRECTORY
        </Link>
      </div>
    );
  }

  let currentStatus = computeTournamentStatus(tournament);
  const t = { ...tournament, status: currentStatus };
  const { title, description, briefing, game, max_teams, prize_pool, status, start_date, registration_deadline, registration_open_date, poster_url } = t;
  const division = getGame(game);

  const parseJSON = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { return JSON.parse(val); } catch { return []; }
  };
  const schedule = parseJSON(t.schedule);
  const roadmap  = parseJSON(t.roadmap);

  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const totalCount    = registrations.length;
  // A withdrawn or rejected entry doesn't count as "registered" — those users
  // may register/re-apply again while registration is open.
  const userReg = user ? registrations.find(r => r.user_id === user.id) : null;
  const isUserRegistered = !!userReg && !['withdrawn'].includes(userReg.status);
  const isOpen = status === 'registrations_open' && phase === 'closing' && (!max_teams || approvedCount < max_teams);
  const capacityPct = max_teams ? Math.min((approvedCount / max_teams) * 100, 100) : 100;

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'schedule') return schedule.length > 0;
    if (tab.id === 'roadmap')  return roadmap.length > 0;
    return true;
  });

  async function handleDeleteResult(resultId) {
    if (!confirm('Delete this group result?')) return;
    try {
      await removeResult(resultId);
      toast.success('Group result deleted');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveResult({ id: rid, group_name, stage, rows }) {
    try {
      if (rid) {
        await updateResult(rid, { group_name, stage, rows, updated_at: new Date().toISOString() });
        toast.success('Result updated');
      } else {
        await addResult({ tournament_id: id, group_name, stage, rows });
        toast.success('Result published');
      }
      setResultModal({ open: false, data: null });
    } catch (err) {
      toast.error(err.message);
    }
  }

  const prizeFormatted = prize_pool ? `PKR ${Number(prize_pool).toLocaleString('en-PK')}` : 'TBA';

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-28 md:pt-32 pb-20">

      {/* ═══ Hero Banner ═══ */}
      <div className="w-full relative border-b border-white/[0.04] overflow-hidden">
        {/* Poster BG */}
        <div className="absolute inset-0">
          {poster_url ? (
            <img src={poster_url} alt="" className="w-full h-full object-cover scale-105" />
          ) : (
            <div className="w-full h-full bg-[#0e0e0e]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-[#0a0a0a]/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 py-16 md:py-24 lg:py-32">
          {/* Breadcrumb */}
          <Link
            to="/tournaments"
            className="inline-flex items-center gap-2 text-[#d1c5b3] opacity-70 hover:opacity-100 hover:text-[#dbb462] transition-all mb-8 font-teko text-[16px] tracking-[0.2em] uppercase"
          >
            <ChevronLeft size={16} /> Back to Tournaments
          </Link>

          {/* Badges */}
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <Link
              to={`/games/${division.slug}`}
              className="font-teko text-[14px] tracking-[0.2em] uppercase px-4 py-1.5 border transition-opacity hover:opacity-80"
              style={{ color: division.accent, backgroundColor: division.accentSoft, borderColor: division.accent + '33' }}
            >
              {division.name}
            </Link>
            <StatusBadge status={status} />
          </div>

          {/* Title */}
          <h1 className="font-bebas text-5xl md:text-8xl lg:text-[10rem] uppercase leading-[0.82] tracking-tight mb-8 zenith-gradient-text pr-2">
            {title}
          </h1>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-[1px] bg-white/[0.04] max-w-3xl">
            <QuickStat label="PRIZE POOL" value={prizeFormatted} gold />
            <QuickStat label="TEAMS" value={max_teams ? `${approvedCount}/${max_teams}` : `${approvedCount}`} />
            <QuickStat label="STARTS" value={start_date ? new Date(start_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : 'TBA'} />
            <QuickStat label="DEADLINE" value={registration_deadline ? new Date(registration_deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : 'TBA'} />
          </div>
        </div>
      </div>

      {/* ═══ Tab Bar ═══ */}
      <div className="sticky top-24 md:top-28 z-30 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-16 flex gap-0 overflow-x-auto no-scrollbar">
          {visibleTabs.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => {
                setActiveTab(tabId);
                document.getElementById('details-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`
                flex items-center gap-3 font-teko text-[18px] tracking-[0.15em] px-6 md:px-8 py-5 whitespace-nowrap border-b-2 transition-all duration-300 uppercase
                ${activeTab === tabId
                  ? 'text-[#dbb462] border-[#dbb462]'
                  : 'text-[#d1c5b3] opacity-60 border-transparent hover:opacity-100'
                }
              `}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Content Area ═══ */}
      <div id="details-content" className="max-w-7xl mx-auto px-6 lg:px-16 py-16 scroll-mt-40 grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">

        {/* ── Left: Tab Content ── */}
        <div className="lg:col-span-2 order-2 lg:order-1 space-y-16">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <section key="overview" style={{ animation: 'fadeIn 0.4s ease-out both' }}>
              <SectionHeader title="TOURNAMENT OVERVIEW" />
              <div className="bg-[#0e0e0e] border border-white/[0.06] p-8 md:p-12">
                <p className="font-body text-[#d1c5b3] leading-[1.8] opacity-80 whitespace-pre-wrap text-lg">
                  {briefing || description || 'No official briefing provided for this tournament.'}
                </p>
              </div>
            </section>
          )}

          {/* SCHEDULE */}
          {activeTab === 'schedule' && (
            <section key="schedule" style={{ animation: 'fadeIn 0.4s ease-out both' }}>
              <SectionHeader title="EVENT SCHEDULE" />
              {schedule.length === 0 ? (
                <p className="font-teko text-[18px] text-white/20 tracking-[0.2em] uppercase">Schedule pending publication.</p>
              ) : (
                <div className="space-y-[1px] bg-white/[0.04]">
                  {schedule.map((row, i) => (
                    <div key={i} className="bg-[#0e0e0e] flex items-center gap-6 md:gap-8 px-6 md:px-8 py-6 group hover:bg-[#111] transition-all duration-300 relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#dbb462] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                      <span className="font-bebas text-3xl text-[#dbb462] opacity-20 w-10 flex-shrink-0 group-hover:opacity-50 transition-opacity">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-shrink-0 text-center min-w-[80px]">
                        {row.date && <p className="font-bebas text-2xl text-white">{new Date(row.date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</p>}
                        {row.time && <p className="font-teko text-[13px] text-[#dbb462] tracking-[0.15em] uppercase opacity-80">{row.time}</p>}
                      </div>
                      <div className="w-px h-10 bg-white/[0.06] flex-shrink-0" />
                      <p className="font-bebas text-2xl md:text-3xl tracking-tight flex-1 text-white/80 group-hover:text-white transition-colors">{row.event}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ROADMAP */}
          {activeTab === 'roadmap' && (
            <section key="roadmap" style={{ animation: 'fadeIn 0.4s ease-out both' }}>
              <SectionHeader title="TOURNAMENT ROADMAP" />
              {roadmap.length === 0 ? (
                <p className="font-teko text-[18px] text-white/20 tracking-[0.2em] uppercase">Roadmap pending publication.</p>
              ) : (
                <div className="space-y-0 pl-4">
                  {roadmap.map((p, i) => (
                    <div key={i} className="flex gap-8 group">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-4 h-4 zenith-gradient shadow-[0_0_15px_rgba(219,180,98,0.4)] flex-shrink-0 mt-2" />
                        {i < roadmap.length - 1 && (
                          <div className="w-[1px] flex-1 bg-gradient-to-b from-[#dbb462]/30 to-white/5 mt-2 mb-2 min-h-[80px]" />
                        )}
                      </div>
                      <div className="pb-14 group-last:pb-0">
                        <span className="font-teko text-[13px] tracking-[0.2em] text-[#dbb462] block mb-2 uppercase opacity-80">
                          STAGE {i + 1} &bull; {p.phase?.toUpperCase()}
                        </span>
                        <h3 className="font-bebas text-3xl md:text-4xl mb-3 text-white group-hover:text-[#dbb462] transition-colors uppercase">{p.title}</h3>
                        {p.description && (
                          <p className="font-body text-[#d1c5b3] opacity-70 text-base leading-relaxed max-w-xl group-hover:opacity-100 transition-opacity">{p.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* RESULTS */}
          {activeTab === 'results' && (
            <section key="results" style={{ animation: 'fadeIn 0.4s ease-out both' }}>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-[2px] bg-[#dbb462]" />
                  <h2 className="font-bebas text-4xl md:text-5xl text-[#f2f2f2] uppercase">RESULTS</h2>
                  {results.length > 0 && (
                    <span className="font-teko text-[14px] tracking-[0.2em] text-[#d1c5b3] opacity-30 uppercase ml-2">({results.length} group{results.length !== 1 ? 's' : ''})</span>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setResultModal({ open: true, data: null })}
                    className="flex items-center gap-2 btn-obsidian-primary px-5 py-2.5 font-teko text-[15px] tracking-[0.15em] uppercase"
                  >
                    <Plus size={15} /> ADD GROUP
                  </button>
                )}
              </div>

              {results.length === 0 ? (
                <div className="bg-[#0e0e0e] border border-white/[0.06] p-12 text-center">
                  <BarChart2 size={36} className="text-[#dbb462] opacity-[0.12] mx-auto mb-4" />
                  <p className="font-teko text-[18px] tracking-[0.2em] text-white/20 uppercase">
                    {isAdmin ? 'No results published yet. Click ADD GROUP to start.' : 'Results will appear here once the admin publishes them.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-10">
                  {results.map((group) => (
                    <div key={group.id} className="bg-[#0e0e0e] border border-white/[0.06] overflow-hidden">
                      {/* Group Header */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#111]">
                        <div className="flex items-center gap-4">
                          <div className="w-1 h-6 zenith-gradient flex-shrink-0" />
                          <div>
                            <p className="font-bebas text-2xl text-white tracking-wide uppercase leading-none">{group.group_name}</p>
                            <p className="font-teko text-[12px] tracking-[0.2em] text-[#dbb462] opacity-70 uppercase mt-0.5">{group.stage}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setResultModal({ open: true, data: group })}
                              className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center text-[#d1c5b3] hover:text-[#dbb462] hover:border-[#dbb462]/30 transition-all"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteResult(group.id)}
                              className="w-8 h-8 bg-white/5 border border-white/10 flex items-center justify-center text-[#d1c5b3] hover:text-[#ffb4ab] hover:border-[#ffb4ab]/30 transition-all"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Leaderboard Table */}
                      {(!group.rows || group.rows.length === 0) ? (
                        <p className="font-teko text-[14px] tracking-[0.2em] text-white/20 uppercase p-6">No rows added.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[480px]">
                            <thead>
                              <tr className="border-b border-white/[0.06]">
                                <th className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase text-center px-4 py-3 w-12">#</th>
                                <th className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase text-left px-4 py-3">TEAM</th>
                                <th className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase text-center px-4 py-3">KILLS</th>
                                <th className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase text-center px-4 py-3">PLACEMENT</th>
                                <th className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase text-center px-4 py-3">TOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.rows.map((row, i) => (
                                <tr
                                  key={i}
                                  className={`border-b border-white/[0.03] transition-colors ${i === 0 ? 'bg-[#dbb462]/[0.05]' : 'hover:bg-white/[0.02]'}`}
                                >
                                  <td className="text-center px-4 py-3.5">
                                    {i === 0 ? (
                                      <span className="font-bebas text-lg text-[#dbb462]">1ST</span>
                                    ) : i === 1 ? (
                                      <span className="font-bebas text-lg text-[#c0c0c0]">2ND</span>
                                    ) : i === 2 ? (
                                      <span className="font-bebas text-lg text-[#cd7f32]">3RD</span>
                                    ) : (
                                      <span className="font-bebas text-lg text-white/30">{row.rank || i + 1}</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3.5">
                                    <span className={`font-bebas text-xl tracking-wide uppercase ${i === 0 ? 'text-[#dbb462]' : 'text-white/80'}`}>
                                      {row.team}
                                    </span>
                                  </td>
                                  <td className="text-center px-4 py-3.5">
                                    <span className="font-teko text-[17px] text-white/70">{row.kills ?? '—'}</span>
                                  </td>
                                  <td className="text-center px-4 py-3.5">
                                    <span className="font-teko text-[17px] text-white/70">{row.points ?? '—'}</span>
                                  </td>
                                  <td className="text-center px-4 py-3.5">
                                    <span className={`font-bebas text-xl ${i === 0 ? 'text-[#dbb462]' : 'text-white/90'}`}>
                                      {row.total ?? '—'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* TEAMS */}
          {activeTab === 'teams' && (() => {
            const approvedTeams = registrations.filter(r => r.status === 'approved');
            const rankMeta = [
              { color: 'text-[#f9d07a]', bg: 'bg-[#f9d07a]/10', border: 'border-[#f9d07a]/25', label: '1ST' },
              { color: 'text-[#c0c0c0]', bg: 'bg-white/[0.04]', border: 'border-white/[0.08]',  label: '2ND' },
              { color: 'text-[#cd7f32]', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]',  label: '3RD' },
            ];
            return (
              <section key="teams" style={{ animation: 'fadeIn 0.4s ease-out both' }}>
                <div className="flex items-center justify-between mb-8">
                  <SectionHeader title="REGISTERED TEAMS" count={approvedTeams.length} />
                  {approvedTeams.length > 0 && (
                    <span className="font-teko text-[12px] tracking-[0.2em] text-[#d1c5b3] opacity-30 uppercase">
                      {max_teams ? `${max_teams - approvedTeams.length} SLOTS REMAINING` : 'OPEN SLOTS'}
                    </span>
                  )}
                </div>
                {approvedTeams.length === 0 ? (
                  <div className="bg-[#0e0e0e] border border-white/[0.06] py-16 flex flex-col items-center gap-4">
                    <Users size={40} className="text-[#dbb462] opacity-[0.08]" />
                    <p className="font-teko text-[18px] text-white/20 tracking-[0.2em] uppercase">No verified teams yet</p>
                  </div>
                ) : (
                  <div className="space-y-[1px] bg-white/[0.03]">
                    {/* Header row */}
                    <div className="bg-[#0a0a0a] grid grid-cols-[48px_1fr_auto] md:grid-cols-[48px_1fr_120px_auto] gap-4 px-5 py-3 border-b border-white/[0.04]">
                      <span className="font-teko text-[10px] tracking-[0.28em] text-[#d1c5b3] opacity-30 uppercase text-center">#</span>
                      <span className="font-teko text-[10px] tracking-[0.28em] text-[#d1c5b3] opacity-30 uppercase">TEAM</span>
                      <span className="font-teko text-[10px] tracking-[0.28em] text-[#d1c5b3] opacity-30 uppercase hidden md:block">CITY</span>
                      <span className="font-teko text-[10px] tracking-[0.28em] text-[#d1c5b3] opacity-30 uppercase">STATUS</span>
                    </div>
                    {approvedTeams.map((r, i) => {
                      const meta = rankMeta[i] || { color: 'text-[#d1c5b3]', bg: 'bg-[#0e0e0e]', border: 'border-transparent', label: String(i + 1).padStart(2, '0') };
                      const isTop3 = i < 3;
                      return (
                        <div
                          key={r.id}
                          className={`grid grid-cols-[48px_1fr_auto] md:grid-cols-[48px_1fr_120px_auto] gap-4 px-5 py-4 items-center transition-all duration-300 group relative overflow-hidden
                            ${isTop3 ? meta.bg : 'bg-[#0e0e0e] hover:bg-[#111]'}`}
                        >
                          {/* Top-line accent for top 3 */}
                          {isTop3 && (
                            <div className={`absolute top-0 left-0 right-0 h-[1px] ${i === 0 ? 'bg-[#f9d07a]/30' : i === 1 ? 'bg-white/10' : 'bg-[#cd7f32]/20'}`} />
                          )}
                          {!isTop3 && (
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-[#dbb462] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left opacity-30" />
                          )}

                          {/* Rank */}
                          <div className="flex justify-center">
                            <span className={`font-bebas text-xl leading-none tracking-wide ${isTop3 ? meta.color : 'text-white/20 group-hover:text-white/40 transition-colors'}`}>
                              {isTop3 ? meta.label : String(i + 1).padStart(2, '0')}
                            </span>
                          </div>

                          {/* Team identity */}
                          <div className="flex items-center gap-3 min-w-0">
                            {r.logo_url ? (
                              <img src={r.logo_url} alt="" className={`w-9 h-9 object-cover flex-shrink-0 border ${isTop3 ? meta.border : 'border-white/[0.06]'}`} />
                            ) : (
                              <div className={`w-9 h-9 flex-shrink-0 flex items-center justify-center font-bebas text-lg border ${isTop3 ? `${meta.border} ${meta.color}` : 'border-white/[0.06] text-[#dbb462]'} bg-[#111]`}>
                                {r.team_name?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className={`font-bebas text-xl truncate leading-none uppercase ${isTop3 ? meta.color : 'text-white/75 group-hover:text-white transition-colors'}`}>
                                {r.team_name}
                              </p>
                              {r.city && (
                                <p className="font-teko text-[11px] tracking-[0.15em] text-[#d1c5b3] opacity-40 uppercase mt-0.5 md:hidden">{r.city}</p>
                              )}
                            </div>
                          </div>

                          {/* City (desktop) */}
                          <div className="hidden md:block">
                            {r.city ? (
                              <span className="font-teko text-[13px] tracking-[0.15em] text-[#d1c5b3] opacity-45 uppercase">{r.city}</span>
                            ) : (
                              <span className="text-white/10">—</span>
                            )}
                          </div>

                          {/* Status */}
                          <StatusBadge status={r.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })()}
        </div>

        {/* ── Right: Sidebar ── */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="sticky top-40 space-y-6">

            {/* Registration CTA Card */}
            <div className="bg-[#0e0e0e] border border-white/[0.06] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] zenith-gradient" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#dbb462]/[0.04] blur-[60px] pointer-events-none" />

              <div className="relative z-10">
                {/* Countdown / Status Banner */}
                {phase !== 'closed' && (
                  <div className="p-6 pb-0">
                    <RegistrationCountdown openDate={registration_open_date} deadlineDate={registration_deadline} />
                  </div>
                )}

                {phase === 'closed' && (
                  <div className="p-6 pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageCircle size={18} className="text-[#dbb462]" />
                      <h3 className="font-bebas text-2xl text-white uppercase">REGISTRATIONS CLOSED</h3>
                    </div>
                    <p className="font-body text-[#d1c5b3] text-sm leading-relaxed opacity-70 mb-4">
                      Registrations are closed. Contact us via WhatsApp for any queries.
                    </p>
                    <a href="https://wa.me/923390715753" target="_blank" rel="noreferrer" className="btn-obsidian-ghost w-full py-3 font-bebas text-[16px] tracking-[0.15em]">
                      WHATSAPP SUPPORT
                    </a>
                  </div>
                )}

                {/* Specs Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-[1px] bg-white/[0.04] mb-6">
                    <SpecCell icon={Trophy} label="PRIZE POOL" value={prizeFormatted} gold />
                    <SpecCell icon={Users} label="TEAMS" value={max_teams ? `${approvedCount}/${max_teams}` : `${approvedCount}/UNLIMITED`} />
                    <SpecCell icon={Calendar} label="STARTS" value={start_date ? new Date(start_date).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : 'TBA'} />
                    <SpecCell icon={Clock} label="DEADLINE" value={registration_deadline ? new Date(registration_deadline).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }) : 'TBA'} />
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-teko text-[12px] tracking-[0.2em] text-[#d1c5b3] opacity-60 uppercase">
                        {max_teams ? 'SLOT CAPACITY' : 'REGISTRATIONS'}
                      </span>
                      <span className="font-bebas text-xl text-[#dbb462]">
                        {max_teams ? `${Math.round(capacityPct)}%` : approvedCount}
                      </span>
                    </div>
                    <div className="w-full bg-white/[0.06] h-1.5 relative overflow-hidden">
                      <div className="zenith-gradient h-full transition-all duration-[2s] ease-out" style={{ width: `${capacityPct}%` }} />
                    </div>
                    {max_teams && (
                      <p className="font-teko text-[11px] tracking-[0.15em] text-[#d1c5b3] opacity-50 uppercase mt-2 text-right">
                        {max_teams - approvedCount > 0 ? `${max_teams - approvedCount} SLOTS REMAINING` : 'FULL'}
                      </p>
                    )}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    {/* User is registered: Show Status */}
                    {isUserRegistered && (() => {
                      if (userReg?.status === 'rejected') {
                        return (
                          <div className="space-y-4">
                            <StatusBadge status="rejected" className="w-full justify-center py-5" />
                            <div className="bg-red-500/10 border border-red-500/20 p-4">
                              <p className="font-teko text-[12px] text-red-400 uppercase tracking-widest mb-1">REJECTION REASON</p>
                              <p className="font-body text-sm text-white/80 italic leading-relaxed">
                                "{userReg.rejection_reason || 'No specific reason provided.'}"
                              </p>
                            </div>
                            <Link
                              to={`/register/${id}`}
                              className="btn-obsidian-primary w-full py-5 font-bebas text-[22px] tracking-[0.2em] inline-flex items-center justify-center gap-3 uppercase group/cta"
                            >
                              RE-APPLY NOW <ArrowRight size={20} className="group-hover/cta:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        );
                      }
                      return <StatusBadge status={userReg?.status} className="w-full justify-center py-5" />;
                    })()}

                    {/* User is NOT registered: Show appropriate CTA */}
                    {!isUserRegistered && (
                      <>
                        {status === 'registrations_open' && phase !== 'closed' ? (
                          // Registrations are open: check capacity
                          (!max_teams || approvedCount < max_teams) ? (
                            <Link
                              to={user ? `/register/${id}` : '/auth'}
                              className="btn-obsidian-primary w-full py-5 font-bebas text-[22px] tracking-[0.2em] inline-flex items-center justify-center gap-3 uppercase group/cta"
                            >
                              {user ? `REGISTER ${division.roster.teamWord.toUpperCase()}` : 'LOGIN TO REGISTER'} <ArrowRight size={20} className="group-hover/cta:translate-x-1 transition-transform" />
                            </Link>
                          ) : (
                            // Full
                            <div className="w-full py-5 border border-white/10 bg-white/5 text-center flex items-center justify-center">
                              <span className="font-bebas text-2xl text-white/30 tracking-widest uppercase">REGISTRATIONS FULL</span>
                            </div>
                          )
                        ) : (
                          !user && phase !== 'closed' && (
                            <Link
                              to="/auth"
                              className="btn-obsidian-ghost w-full py-4 font-bebas text-[20px] tracking-[0.15em] uppercase"
                            >
                              LOGIN TO REGISTER
                            </Link>
                          )
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Support Card */}
            <a
              href="https://wa.me/923390715753"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 bg-[#0e0e0e] border border-white/[0.06] p-5 hover:border-[#dbb462]/20 transition-all group"
            >
              <Shield size={20} className="text-[#dbb462] opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="flex-1">
                <p className="font-bebas text-xl text-white group-hover:text-[#dbb462] transition-colors uppercase">Need Help?</p>
                <p className="font-teko text-[12px] tracking-[0.15em] text-[#d1c5b3] opacity-40 uppercase">Contact Support via WhatsApp</p>
              </div>
              <ChevronRight size={16} className="text-[#dbb462] opacity-30 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Result Group Modal (admin only) ── */}
      {resultModal.open && (
        <ResultGroupModal
          initial={resultModal.data}
          onSave={handleSaveResult}
          onClose={() => setResultModal({ open: false, data: null })}
        />
      )}
    </div>
  );
}

/* ── Sub-components ── */

function SectionHeader({ title, count }) {
  return (
    <div className="flex items-center gap-4 mb-10">
      <div className="w-8 h-[2px] bg-[#dbb462]" />
      <h2 className="font-bebas text-4xl md:text-5xl text-[#f2f2f2] uppercase">{title}</h2>
      {count !== undefined && (
        <span className="font-teko text-[14px] tracking-[0.2em] text-[#d1c5b3] opacity-30 uppercase ml-2">({count})</span>
      )}
    </div>
  );
}

function QuickStat({ label, value, gold }) {
  return (
    <div className="bg-[#0a0a0a]/80 backdrop-blur-sm px-6 py-5 flex-1 min-w-[110px]">
      <span className="font-teko text-[10px] tracking-[0.25em] text-[#d1c5b3] opacity-50 uppercase block mb-1.5">{label}</span>
      <span className={`font-bebas text-2xl leading-none ${gold ? 'zenith-gradient-text' : 'text-[#f2f2f2]'}`}>{value}</span>
    </div>
  );
}

function SpecRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-4 group">
      <Icon className="text-[#dbb462] flex-shrink-0 mt-0.5 opacity-50 group-hover:opacity-100 transition-opacity" size={16} />
      <div>
        <p className="font-teko text-[12px] text-[#d1c5b3] tracking-[0.15em] uppercase opacity-40 mb-0.5 leading-none">{label}</p>
        <p className="font-bebas text-xl text-white leading-none uppercase">{children}</p>
      </div>
    </div>
  );
}

function SpecCell({ icon: Icon, label, value, gold }) {
  return (
    <div className="bg-[#0e0e0e] p-4 group hover:bg-[#111] transition-all duration-300">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-[#dbb462] opacity-60 group-hover:opacity-100 transition-opacity" />
        <span className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-60 uppercase">{label}</span>
      </div>
      <p className={`font-bebas text-xl leading-none ${gold ? 'text-[#dbb462]' : 'text-[#f2f2f2]'}`}>{value}</p>
    </div>
  );
}

/* ── ResultGroupModal ── */
function ResultGroupModal({ initial, onSave, onClose }) {
  const isEdit = !!initial?.id;
  const [groupName, setGroupName] = useState(initial?.group_name || '');
  const [stage, setStage] = useState(initial?.stage || 'Group Stage');
  const [rows, setRows] = useState(
    initial?.rows?.length ? initial.rows.map(r => ({ ...r })) : [EMPTY_ROW()]
  );
  const [saving, setSaving] = useState(false);

  const updateRow = (i, field, val) => {
    setRows(prev => {
      const next = prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r);
      if (field === 'kills' || field === 'points') {
        const k = parseFloat(field === 'kills' ? val : next[i].kills) || 0;
        const p = parseFloat(field === 'points' ? val : next[i].points) || 0;
        next[i].total = k + p || '';
      }
      return next;
    });
  };

  const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);
  const removeRow = (i) => setRows(prev => prev.filter((_, idx) => idx !== i));

  const moveRow = (i, dir) => {
    setRows(prev => {
      const next = [...prev];
      const swap = i + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[i], next[swap]] = [next[swap], next[i]];
      return next;
    });
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!groupName.trim()) return toast.error('Group name is required');
    const cleanRows = rows
      .filter(r => r.team?.toString().trim())
      .map((r, i) => ({ rank: i + 1, team: r.team.trim(), kills: Number(r.kills) || 0, points: Number(r.points) || 0, total: Number(r.total) || 0 }));
    setSaving(true);
    await onSave({ id: initial?.id, group_name: groupName.trim(), stage, rows: cleanRows });
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-2xl bg-[#111] border border-white/[0.08] flex flex-col max-h-[90vh]" style={{ animation: 'fadeIn 0.25s ease-out both' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 zenith-gradient" />
            <h2 className="font-bebas text-2xl text-white uppercase tracking-wide">
              {isEdit ? 'EDIT GROUP RESULT' : 'ADD GROUP RESULT'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Meta fields */}
          <div className="px-6 pt-5 pb-4 flex gap-4 flex-shrink-0">
            <div className="flex-1">
              <label className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-50 uppercase block mb-2">GROUP NAME *</label>
              <input
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. Group A"
                className="w-full bg-[#1a1a1a] border border-white/[0.08] px-4 py-2.5 font-teko text-[17px] text-white focus:outline-none focus:border-[#dbb462]/40 placeholder-white/20 uppercase tracking-wide"
              />
            </div>
            <div className="w-44">
              <label className="font-teko text-[11px] tracking-[0.2em] text-[#d1c5b3] opacity-50 uppercase block mb-2">STAGE</label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-white/[0.08] px-4 py-2.5 font-teko text-[17px] text-white focus:outline-none focus:border-[#dbb462]/40 appearance-none cursor-pointer"
              >
                {STAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Column headers */}
          <div className="px-6 flex-shrink-0">
            <div className="grid grid-cols-[28px_1fr_70px_80px_70px_28px] gap-2 pb-1">
              <div />
              <span className="font-teko text-[10px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase">TEAM</span>
              <span className="font-teko text-[10px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase text-center">KILLS</span>
              <span className="font-teko text-[10px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase text-center">PLACEMENT</span>
              <span className="font-teko text-[10px] tracking-[0.2em] text-[#d1c5b3] opacity-40 uppercase text-center">TOTAL</span>
              <div />
            </div>
          </div>

          {/* Rows */}
          <div className="px-6 overflow-y-auto flex-1 space-y-1.5 pb-2">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-[28px_1fr_70px_80px_70px_28px] gap-2 items-center group">
                {/* Rank indicator */}
                <span className="font-bebas text-base text-white/20 text-center">{i + 1}</span>

                {/* Team name */}
                <input
                  value={row.team}
                  onChange={e => updateRow(i, 'team', e.target.value)}
                  placeholder="Team name"
                  className="bg-[#1a1a1a] border border-white/[0.06] px-3 py-2 font-teko text-[16px] text-white focus:outline-none focus:border-[#dbb462]/30 placeholder-white/15 w-full"
                />

                {/* Kills */}
                <input
                  type="number"
                  min="0"
                  value={row.kills}
                  onChange={e => updateRow(i, 'kills', e.target.value)}
                  placeholder="0"
                  className="bg-[#1a1a1a] border border-white/[0.06] px-2 py-2 font-teko text-[16px] text-white focus:outline-none focus:border-[#dbb462]/30 text-center w-full"
                />

                {/* Placement pts */}
                <input
                  type="number"
                  min="0"
                  value={row.points}
                  onChange={e => updateRow(i, 'points', e.target.value)}
                  placeholder="0"
                  className="bg-[#1a1a1a] border border-white/[0.06] px-2 py-2 font-teko text-[16px] text-white focus:outline-none focus:border-[#dbb462]/30 text-center w-full"
                />

                {/* Total (auto-calculated, still editable) */}
                <input
                  type="number"
                  min="0"
                  value={row.total}
                  onChange={e => updateRow(i, 'total', e.target.value)}
                  placeholder="0"
                  className="bg-[#1a1a1a] border border-[#dbb462]/10 px-2 py-2 font-bebas text-[17px] text-[#dbb462] focus:outline-none focus:border-[#dbb462]/40 text-center w-full"
                />

                {/* Delete row */}
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-[#ffb4ab] transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add row */}
          <div className="px-6 pt-3 pb-4 flex-shrink-0">
            <button
              type="button"
              onClick={addRow}
              className="flex items-center gap-2 text-[#dbb462] opacity-60 hover:opacity-100 transition-opacity font-teko text-[14px] tracking-[0.15em] uppercase"
            >
              <Plus size={14} /> ADD ROW
            </button>
          </div>

          {/* Footer actions */}
          <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3 justify-end flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-obsidian-ghost px-6 py-2.5 font-teko text-[15px] tracking-[0.15em] uppercase">
              CANCEL
            </button>
            <button type="submit" disabled={saving} className="btn-obsidian-primary px-8 py-2.5 font-teko text-[15px] tracking-[0.15em] uppercase disabled:opacity-50">
              {saving ? 'SAVING...' : isEdit ? 'UPDATE' : 'PUBLISH'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

