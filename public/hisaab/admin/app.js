/**
 * ZENITH HISAAB — private ledger for Zenith Esports
 * Tracks what teams owe Zenith (scrim fees, entries) and what Zenith owes teams (prizes, refunds) in PKR,
 * plus staff salaries: sessions worked per day, paid per session.
 * Data lives in Supabase (see supabase/hisaab.sql and hisaab-payroll.sql); every change is logged with the admin's name.
 * Only UI preferences (your name, the open view) are kept in this browser.
 */

(function () {
  'use strict';

  // ==========================================================================
  // CONFIG & CONSTANTS
  // ==========================================================================
  const CONFIG = window.HISAAB_CONFIG || {};
  const STORAGE_KEY_SESSION = 'zenith_hisaab_session_v3';
  const STORAGE_KEY_ADMIN = 'zenith_hisaab_admin_name_v2';
  const STORAGE_KEY_TAB = 'zenith_hisaab_active_tab_v2';
  const STORAGE_KEY_VIEW = 'zenith_hisaab_view_v1';
  const MIN_PASSCODE_LENGTH = 8;
  const MAX_SESSIONS_PER_DAY = 100;
  const DEFAULT_RATE = 70; // PKR per session
  const POLL_INTERVAL = 30000;

  const MINUTE = 60000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  const ENTRY_TYPES = ['INITIAL', 'INCREMENT', 'DECREMENT', 'CORRECTION'];

  const STATUS_LABELS = {
    UNPAID: 'Pending',
    PARTIAL: 'Partly paid',
    SETTLED: 'Settled'
  };

  // Wording changes with the side of the ledger
  const COPY = {
    RECEIVABLE: {
      side: 'Owed to us',
      progressVerb: 'collected',
      lifetimeCharged: 'charged',
      lifetimeSettled: 'collected',
      settleButton: 'Receive',
      settleMenu: 'Mark as fully paid',
      DECREMENT: { tab: 'Payment received', cta: 'Record payment', placeholder: 'e.g. Easypaisa from captain' },
      INCREMENT: { tab: 'Add charge', cta: 'Add charge', placeholder: 'e.g. Week 3 scrims' },
      plusTitle: 'Add a charge'
    },
    PAYABLE: {
      side: 'We owe',
      progressVerb: 'paid out',
      lifetimeCharged: 'awarded',
      lifetimeSettled: 'paid out',
      settleButton: 'Pay out',
      settleMenu: 'Mark as fully paid out',
      DECREMENT: { tab: 'Payout sent', cta: 'Record payout', placeholder: 'e.g. Sent to manager via bank' },
      INCREMENT: { tab: 'Add to payout', cta: 'Add to payout', placeholder: 'e.g. MVP bonus' },
      plusTitle: 'Add to this payout'
    }
  };

  // ==========================================================================
  // STATE
  // ==========================================================================
  const emptyPayroll = () => ({ staff: [], sessions: [], payouts: [], loaded: false, missing: false, failed: false });

  const state = {
    teams: [],
    loaded: false,
    activeAdmin: '',
    view: 'teams',           // 'teams' | 'salaries'
    activeTab: 'receivable', // 'receivable' | 'payable' | 'split'
    searchQuery: '',
    statusFilter: 'ALL',
    sortBy: 'amount-desc',
    openHistory: new Set(),
    adjust: { teamId: null, type: 'DECREMENT' },
    menuTeamId: null,
    payroll: emptyPayroll(),
    openStaff: new Set(),
    menuStaffId: null,
    log: { date: '', people: [], original: new Map(), counts: new Map() },
    sync: { at: 0, failing: false }
  };

  // ==========================================================================
  // SMALL HELPERS
  // ==========================================================================
  const $ = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  function icon(name, cls = '') {
    return `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  }

  function formatNumber(value) {
    return Math.round(Number(value) || 0).toLocaleString('en-PK');
  }

  function formatPKR(value) {
    return `PKR ${formatNumber(value)}`;
  }

  function moneyHTML(value, signed = false) {
    const sign = signed ? (value > 0 ? '+' : value < 0 ? '−' : '') : '';
    return `<span class="money-sign">${sign}</span><span class="money-cur">PKR</span><span class="money-num">${formatNumber(Math.abs(value))}</span>`;
  }

  function plural(n, word, many = `${word}s`) {
    return `${n} ${n === 1 ? word : many}`;
  }

  const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const longDateFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

  function formatDate(ts) { return dateFmt.format(new Date(ts)); }
  function formatTime(ts) { return timeFmt.format(new Date(ts)); }
  function stamp(ts) { return `${formatDate(ts)}, ${formatTime(ts)}`; }

  function relativeTime(ts) {
    const diff = Date.now() - ts;
    if (diff < MINUTE) return 'Just now';
    if (diff < HOUR) return `${Math.floor(diff / MINUTE)} min ago`;
    if (diff < DAY) return `${Math.floor(diff / HOUR)} h ago`;
    if (diff < 2 * DAY) return 'Yesterday';
    if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
    return formatDate(ts);
  }

  // Work days are calendar dates (YYYY-MM-DD) in this device's time zone, not timestamps
  const weekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short' });
  const longWeekdayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'long' });
  const dayMonthFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' });
  const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long' });

  function isoDay(date) {
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${m}-${d}`;
  }

  function dayDate(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function shiftDay(iso, days) {
    const d = dayDate(iso);
    d.setDate(d.getDate() + days);
    return isoDay(d);
  }

  const todayISO = () => isoDay(new Date());
  const isValidDay = (iso) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && isoDay(dayDate(iso)) === iso;

  /** "Fri 17 Oct" */
  function formatDay(iso) {
    const d = dayDate(iso);
    return `${weekdayFmt.format(d)} ${dayMonthFmt.format(d)}`;
  }

  /** "17 Oct", "10–17 Oct" or "28 Sep – 3 Oct" */
  function formatDayRange(from, to) {
    if (!from) return '';
    if (!to || from === to) return dayMonthFmt.format(dayDate(from));
    const a = dayDate(from);
    const b = dayDate(to);
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) return `${a.getDate()}–${dayMonthFmt.format(b)}`;
    return `${dayMonthFmt.format(a)} – ${dayMonthFmt.format(b)}`;
  }

  /** Salaries load from the first day of last month (plus anything still unpaid). */
  function payrollWindowStart() {
    const now = new Date();
    return isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  }

  function initials(name) {
    const words = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 'ZH';
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  function parseAmount(raw) {
    const n = Number(String(raw).replace(/,/g, '').trim());
    return Number.isFinite(n) ? Math.round(n) : NaN;
  }

  function isTyping(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function storageGet(store, key) {
    try { return store.getItem(key); } catch (err) { return null; }
  }

  function storageSet(store, key, value) {
    try { store.setItem(key, value); } catch (err) { /* private mode etc. — non-critical */ }
  }

  function storageRemove(store, key) {
    try { store.removeItem(key); } catch (err) { /* ignore */ }
  }

  // ==========================================================================
  // SUPABASE CLIENT (plain fetch — the site's CSP only allows same-origin scripts)
  // ==========================================================================
  class ApiError extends Error {
    constructor(message, { status = 0, code = '' } = {}) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }

  const api = (() => {
    let session = null; // { access_token, refresh_token, expires_at (seconds), remember }
    let refreshing = null;

    const configured = () => Boolean(CONFIG.supabaseUrl && CONFIG.supabaseKey && !/PASTE_/.test(CONFIG.supabaseKey) && CONFIG.loginEmail);

    function parse(text) {
      try { return JSON.parse(text); } catch (err) { return null; }
    }

    async function send(path, { method = 'GET', body, auth = true, prefer, token } = {}) {
      const headers = { apikey: CONFIG.supabaseKey, 'Content-Type': 'application/json' };
      if (prefer) headers.Prefer = prefer;
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      } else if (auth) {
        await ensureFresh();
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      let res;
      try {
        res = await fetch(CONFIG.supabaseUrl + path, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          cache: 'no-store'
        });
      } catch (err) {
        throw new ApiError('Can’t reach the server.', { code: 'NETWORK' });
      }

      const text = await res.text();
      const data = text ? parse(text) : null;
      if (!res.ok) {
        const code = data?.error_code || data?.code || data?.error || '';
        const message = data?.message || data?.msg || data?.error_description || `Request failed (${res.status})`;
        throw new ApiError(message, { status: res.status, code: String(code) });
      }
      return data;
    }

    function store(next) {
      session = next;
      const keep = session.remember ? localStorage : sessionStorage;
      const drop = session.remember ? sessionStorage : localStorage;
      storageRemove(drop, STORAGE_KEY_SESSION);
      storageSet(keep, STORAGE_KEY_SESSION, JSON.stringify(session));
    }

    function adopt(data, remember) {
      store({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Number(data.expires_at) || Math.floor(Date.now() / 1000) + (Number(data.expires_in) || 3600),
        remember: Boolean(remember)
      });
    }

    function clear() {
      session = null;
      storageRemove(localStorage, STORAGE_KEY_SESSION);
      storageRemove(sessionStorage, STORAGE_KEY_SESSION);
    }

    function restoreSession() {
      const raw = storageGet(localStorage, STORAGE_KEY_SESSION) || storageGet(sessionStorage, STORAGE_KEY_SESSION);
      const saved = raw ? parse(raw) : null;
      session = saved && saved.refresh_token ? saved : null;
      return Boolean(session);
    }

    async function refresh() {
      if (!session?.refresh_token) throw new ApiError('Signed out', { status: 401, code: 'SESSION' });
      if (!refreshing) {
        const remember = session.remember;
        refreshing = send('/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: session.refresh_token } })
          .then((data) => adopt(data, remember))
          .catch((err) => {
            if (err.code !== 'NETWORK' && err.status < 500) {
              clear();
              throw new ApiError('Your session has ended.', { status: 401, code: 'SESSION' });
            }
            throw err;
          })
          .finally(() => { refreshing = null; });
      }
      return refreshing;
    }

    async function ensureFresh() {
      if (!session) throw new ApiError('Signed out', { status: 401, code: 'SESSION' });
      if (session.expires_at - 60 < Date.now() / 1000) await refresh();
    }

    // Data API call; retries once with a fresh token if the server says the token expired
    async function rest(path, opts) {
      try {
        return await send(path, opts);
      } catch (err) {
        if (err.status === 401 && err.code !== 'SESSION' && opts?.auth !== false) {
          await refresh();
          return send(path, opts);
        }
        throw err;
      }
    }

    const rpc = (fn, args) => rest(`/rest/v1/rpc/${fn}`, { method: 'POST', body: args });

    return {
      configured,
      restoreSession,
      clear,
      remembered: () => Boolean(session?.remember),

      async signIn(password, remember) {
        const data = await send('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email: CONFIG.loginEmail, password } });
        adopt(data, remember);
      },

      // Forget the session locally first, so a quick re-login can't be wiped by a slow logout call
      async signOut() {
        const token = session?.access_token;
        clear();
        if (token) {
          try { await send('/auth/v1/logout', { method: 'POST', token }); } catch (err) { /* already gone */ }
        }
      },

      updatePassword: (password) => rest('/auth/v1/user', { method: 'PUT', body: { password } }),

      async isAdmin() {
        const rows = await rest('/rest/v1/hisaab_admins?select=user_id');
        return Array.isArray(rows) && rows.length > 0;
      },

      fetchLedger: () => rest('/rest/v1/hisaab_teams?select=*,hisaab_entries(*)&order=created_at.desc&hisaab_entries.order=created_at.desc,seq.desc'),
      addTeam: (args) => rpc('hisaab_add_team', args),
      recordEntry: (args) => rpc('hisaab_record_entry', args),
      updateTeam: (id, fields) => rest(`/rest/v1/hisaab_teams?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: fields, prefer: 'return=minimal' }),
      deleteTeam: (id) => rest(`/rest/v1/hisaab_teams?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE', prefer: 'return=minimal' }),
      restore: (teams, replace) => rpc('hisaab_restore', { p_teams: teams, p_replace: replace }),
      clearAll: () => rpc('hisaab_clear_all', {}),

      // Salaries (supabase/hisaab-payroll.sql)
      fetchPayroll: (since) => rpc('hisaab_payroll', { p_since: since }),
      logSessions: (date, counts, admin) => rpc('hisaab_log_sessions', { p_date: date, p_counts: counts, p_admin: admin }),
      payStaff: (items, admin) => rpc('hisaab_pay_staff', { p_items: items, p_admin: admin }),
      undoPayouts: (ids) => rpc('hisaab_undo_payouts', { p_ids: ids }),
      addStaff: (fields) => rest('/rest/v1/hisaab_staff', { method: 'POST', body: fields, prefer: 'return=minimal' }),
      updateStaff: (id, fields) => rest(`/rest/v1/hisaab_staff?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: fields, prefer: 'return=minimal' })
    };
  })();

  /** The salary tables don't exist yet (hisaab-payroll.sql hasn't been run). */
  function isPayrollMissing(err) {
    return ['PGRST202', 'PGRST205', '42883', '42P01'].includes(err?.code) || err?.status === 404;
  }

  function describeError(err, context = 'team') {
    if (context === 'payroll') {
      switch (err?.code) {
        case '23505': return 'Someone with that name is already on the register.';
        case 'ZH001': return 'Another admin changed these numbers a moment ago. The latest are loaded, so check them and try again.';
        case 'ZH003': return 'That person is no longer on the register. Another admin may have removed them.';
        case 'ZH005': return `${err.message}. Paid sessions can’t be taken off.`;
        case 'ZH006': return 'There’s nothing left to pay. Another admin may have just paid it.';
      }
      if (isPayrollMissing(err)) return 'Salaries aren’t set up yet. Run supabase/hisaab-payroll.sql in Supabase first.';
    }
    switch (err?.code) {
      case 'NETWORK': return 'Can’t reach the server. Check your connection and try again.';
      case 'SESSION': return 'Your session has ended. Sign in again.';
      case '23505': return 'A team with that name is already on this side of the ledger.';
      case 'ZH001': return 'Another admin changed this team a moment ago. The latest numbers are loaded, so check them and try again.';
      case 'ZH002': return 'That’s more than the outstanding balance.';
      case 'ZH003': return 'That team no longer exists. Another admin may have deleted it.';
      case '42501': return 'This login doesn’t have access to the ledger.';
      default: return err?.message || 'Something went wrong. Try again.';
    }
  }

  /** Shared failure handling: expired sessions lock the ledger, everything else is a toast. */
  function handleApiError(err, { quiet = false, context = 'team' } = {}) {
    console.error(err);
    if (err?.code === 'SESSION' || (err?.status === 401 && err?.code !== 'NETWORK')) {
      lockLedger('Your session has ended. Enter the passcode to continue.');
      return;
    }
    if (!quiet) showToast(describeError(err, context), 'danger');
  }

  // ==========================================================================
  // DATA MODEL
  // ==========================================================================

  /** Database row (with embedded entries) → the shape the UI and backups use. */
  function fromServer(row) {
    const num = (v) => (v === null || v === undefined ? undefined : Number(v));
    return normalizeTeam({
      id: row.id,
      name: row.name,
      whatsapp: row.whatsapp,
      category: row.category,
      notes: row.notes,
      amount: Number(row.amount),
      createdAt: Date.parse(row.created_at),
      updatedAt: Date.parse(row.updated_at),
      history: (row.hisaab_entries || []).map((e) => ({
        id: e.id,
        type: e.type,
        amount: Number(e.amount),
        delta: num(e.delta),
        previousBalance: num(e.previous_balance),
        resultingBalance: num(e.resulting_balance),
        adminName: e.admin_name,
        note: e.note,
        timestamp: Date.parse(e.created_at)
      }))
    });
  }

  /** Make any team (from the server or an old backup file) safe to use. */
  function normalizeTeam(raw) {
    const t = { ...raw };
    t.id = String(t.id || '');
    t.name = String(t.name || 'Unnamed team').trim();
    t.whatsapp = String(t.whatsapp || '').trim();
    t.category = t.category === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';
    t.notes = String(t.notes || '').trim();
    t.amount = Math.max(0, Math.round(Number(t.amount) || 0));
    t.createdAt = Number(t.createdAt) || Date.now();
    t.updatedAt = Number(t.updatedAt) || t.createdAt;
    t.history = (Array.isArray(t.history) ? t.history : []).map((h) => {
      const parsed = Date.parse(String(h.date || '').replace(',', ''));
      return {
        ...h,
        type: ENTRY_TYPES.includes(h.type) ? h.type : 'INCREMENT',
        amount: Math.abs(Math.round(Number(h.amount) || 0)),
        timestamp: Number(h.timestamp) || (Number.isFinite(parsed) ? parsed : t.updatedAt),
        adminName: String(h.adminName || 'Admin'),
        note: String(h.note || '')
      };
    });
    delete t.initialAmount;
    delete t.status;
    t.status = deriveStatus(t);
    return t;
  }

  /** +1 if the entry raised the balance, −1 if it lowered it. */
  function entrySign(h) {
    if (h.type === 'DECREMENT') return -1;
    if (h.type === 'CORRECTION') return (Number(h.delta) || 0) < 0 ? -1 : 1;
    return 1;
  }

  /**
   * Totals for the current "cycle": everything since the balance last hit zero.
   * A team that cleared last week's dues and got a new charge shows as Pending, not Partly paid.
   */
  function cycleTotals(team) {
    let settled = 0;
    for (let i = 0; i < team.history.length; i++) {
      const h = team.history[i];
      if (i > 0 && h.resultingBalance === 0) break; // previous cycle ended here
      if (h.type === 'DECREMENT') settled += h.amount;
    }
    const charged = team.amount + settled;
    return { charged, settled, progress: charged > 0 ? settled / charged : 1 };
  }

  function lifetimeTotals(team) {
    let settled = 0;
    for (const h of team.history) {
      if (h.type === 'DECREMENT') settled += h.amount;
    }
    return { settled, charged: team.amount + settled };
  }

  function deriveStatus(team) {
    if (team.amount <= 0) return 'SETTLED';
    return cycleTotals(team).settled > 0 ? 'PARTIAL' : 'UNPAID';
  }

  function findTeam(id) {
    return state.teams.find((t) => t.id === id);
  }

  function entryLabel(h, category) {
    const isIn = category === 'RECEIVABLE';
    switch (h.type) {
      case 'INITIAL': return 'Opening balance';
      case 'INCREMENT': return isIn ? 'Charge added' : 'Added to payout';
      case 'DECREMENT': return isIn ? 'Payment received' : 'Payout sent';
      case 'CORRECTION': return 'Balance corrected';
      default: return 'Entry';
    }
  }

  /** Plain copy of the ledger for backups and undo. */
  function snapshot() {
    return JSON.parse(JSON.stringify(state.teams));
  }

  // --- Salaries ---------------------------------------------------------------

  /** hisaab_payroll() result → the shape the salaries screen uses. */
  function payrollFromServer(data) {
    const day = (v) => String(v || '').slice(0, 10);
    return {
      staff: (data?.staff || []).map((s) => ({
        id: s.id,
        name: String(s.name || '').trim() || 'Unnamed',
        rate: Math.max(0, Number(s.rate) || 0),
        active: s.active !== false,
        sessionsTotal: Number(s.sessions_total) || 0,
        earnedTotal: Number(s.earned_total) || 0,
        paidTotal: Number(s.paid_total) || 0,
        lastPaidAt: s.last_paid_at ? Date.parse(s.last_paid_at) : 0
      })),
      sessions: (data?.sessions || []).map((r) => ({
        id: r.id,
        staffId: r.staff_id,
        date: day(r.work_date),
        sessions: Number(r.sessions) || 0,
        rate: Number(r.rate) || 0,
        payoutId: r.payout_id || null,
        adminName: String(r.admin_name || ''),
        updatedAt: Date.parse(r.updated_at) || 0
      })),
      payouts: (data?.payouts || []).map((r) => ({
        id: r.id,
        staffId: r.staff_id,
        sessions: Number(r.sessions) || 0,
        amount: Number(r.amount) || 0,
        from: day(r.from_date),
        to: day(r.to_date),
        adminName: String(r.admin_name || ''),
        createdAt: Date.parse(r.created_at) || 0
      }))
    };
  }

  /**
   * Per-person days, balances and payments, plus the totals for the figures.
   * A day is the sum of its rows: sessions already paid plus sessions still unpaid.
   */
  function payrollModel() {
    const { staff, sessions, payouts } = state.payroll;
    const today = todayISO();
    const month = today.slice(0, 7);
    const people = new Map(staff.map((s) => [s.id, { ...s, due: 0, dueSessions: 0, dueFrom: '', dueTo: '', days: new Map(), payouts: [] }]));
    const totals = { due: 0, dueSessions: 0, duePeople: 0, monthSessions: 0, monthAmount: 0, todaySessions: 0, paidMonth: 0, paidTotal: 0 };

    for (const row of sessions) {
      const person = people.get(row.staffId);
      if (!person) continue;
      const amount = row.sessions * row.rate;
      let day = person.days.get(row.date);
      if (!day) {
        day = { total: 0, paid: 0, amount: 0, paidAmount: 0, admin: '', at: 0 };
        person.days.set(row.date, day);
      }
      day.total += row.sessions;
      day.amount += amount;
      if (row.payoutId) {
        day.paid += row.sessions;
        day.paidAmount += amount;
      } else {
        person.due += amount;
        person.dueSessions += row.sessions;
        if (!person.dueFrom || row.date < person.dueFrom) person.dueFrom = row.date;
        if (row.date > person.dueTo) person.dueTo = row.date;
      }
      if (row.updatedAt >= day.at) {
        day.at = row.updatedAt;
        day.admin = row.adminName;
      }
      if (row.date.startsWith(month)) {
        totals.monthSessions += row.sessions;
        totals.monthAmount += amount;
      }
      if (row.date === today) totals.todaySessions += row.sessions;
    }

    for (const pay of payouts) {
      people.get(pay.staffId)?.payouts.push(pay);
      if (isoDay(new Date(pay.createdAt)).startsWith(month)) totals.paidMonth += pay.amount;
    }

    const all = [...people.values()];
    for (const person of all) {
      totals.due += person.due;
      totals.dueSessions += person.dueSessions;
      if (person.dueSessions > 0) totals.duePeople++;
      totals.paidTotal += person.paidTotal;
    }

    // Removed people stay visible while they still have unpaid sessions
    const visible = all.filter((p) => p.active || p.dueSessions > 0);
    const rates = new Set(all.filter((p) => p.active).map((p) => p.rate));
    const commonRate = rates.size > 1 ? null : rates.size === 1 ? [...rates][0] : DEFAULT_RATE;
    return { people: all, visible, totals, today, commonRate };
  }

  function rateLabel(commonRate) {
    return commonRate === null ? 'Rates vary by person' : `${formatPKR(commonRate)} a session`;
  }

  // ==========================================================================
  // SYNC
  // ==========================================================================
  let sessionGeneration = 0; // bumped on lock so late responses can't repaint data behind the gate
  let loadSeq = 0;           // only the newest request may update the screen

  async function loadLedger({ quiet = false } = {}) {
    const seq = ++loadSeq;
    const generation = sessionGeneration;
    const stale = () => generation !== sessionGeneration || seq !== loadSeq;
    try {
      const rows = await api.fetchLedger();
      if (stale()) return false;
      state.teams = (Array.isArray(rows) ? rows : []).map(fromServer);
      state.loaded = true;
      state.sync.at = Date.now();
      state.sync.failing = false;
      const known = new Set(state.teams.map((t) => t.id));
      state.openHistory.forEach((id) => { if (!known.has(id)) state.openHistory.delete(id); });
      renderAll();
      return true;
    } catch (err) {
      if (stale()) return false;
      state.sync.failing = true;
      handleApiError(err, { quiet });
      return false;
    } finally {
      renderSyncLabel();
    }
  }

  let payrollSeq = 0;

  async function loadPayroll({ quiet = false } = {}) {
    const seq = ++payrollSeq;
    const generation = sessionGeneration;
    const stale = () => generation !== sessionGeneration || seq !== payrollSeq;
    try {
      const data = await api.fetchPayroll(payrollWindowStart());
      if (stale()) return false;
      state.payroll = { ...payrollFromServer(data), loaded: true, missing: false, failed: false };
      state.sync.at = Date.now();
      state.sync.failing = false;
      const known = new Set(state.payroll.staff.map((s) => s.id));
      state.openStaff.forEach((id) => { if (!known.has(id)) state.openStaff.delete(id); });
      renderPayroll();
      return true;
    } catch (err) {
      if (stale()) return false;
      if (isPayrollMissing(err)) {
        state.payroll = { ...emptyPayroll(), loaded: true, missing: true };
        renderPayroll();
        return true;
      }
      if (!state.payroll.loaded) state.payroll.failed = true;
      state.sync.failing = true;
      renderPayroll();
      handleApiError(err, { quiet, context: 'payroll' });
      return false;
    } finally {
      renderSyncLabel();
    }
  }

  /** Pull the latest teams and salaries (polling, tab focus). */
  function refreshAll({ quiet = true } = {}) {
    return Promise.all([loadLedger({ quiet }), loadPayroll({ quiet })]);
  }

  // The server knows something we don't (another admin's change) — pull the latest numbers
  const RELOAD_CODES = ['ZH001', 'ZH002', 'ZH003', 'ZH005', 'ZH006', '23505'];
  const PAYROLL = { reload: loadPayroll, context: 'payroll' };

  /** Show a button as busy while a change is saved, then reload from the server. */
  async function mutate(button, action, { reload = loadLedger, context = 'team' } = {}) {
    setBusy(button, true);
    try {
      const result = await action();
      await reload({ quiet: true });
      return { ok: true, result };
    } catch (err) {
      handleApiError(err, { context });
      if (RELOAD_CODES.includes(err?.code)) await reload({ quiet: true });
      return { ok: false, error: err };
    } finally {
      setBusy(button, false);
    }
  }

  function setBusy(button, busy) {
    if (!button) return;
    if (busy) {
      button.dataset.idleHtml = button.innerHTML;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${button.dataset.busyLabel || 'Saving…'}</span>`;
    } else if (button.dataset.idleHtml !== undefined) {
      button.innerHTML = button.dataset.idleHtml;
      delete button.dataset.idleHtml;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  // ==========================================================================
  // PREFERENCES (the only things kept in this browser)
  // ==========================================================================
  function loadPreferences() {
    state.activeAdmin = (storageGet(localStorage, STORAGE_KEY_ADMIN) || '').trim();
    const tab = storageGet(localStorage, STORAGE_KEY_TAB);
    if (['receivable', 'payable', 'split'].includes(tab)) state.activeTab = tab;
    if (storageGet(localStorage, STORAGE_KEY_VIEW) === 'salaries') state.view = 'salaries';
  }

  function saveAdmin(name) {
    const clean = String(name || '').trim();
    if (!clean) return;
    state.activeAdmin = clean;
    storageSet(localStorage, STORAGE_KEY_ADMIN, clean);
    renderAdminChip();
  }

  function setTab(tab) {
    state.activeTab = tab;
    storageSet(localStorage, STORAGE_KEY_TAB, tab);
    renderTabs();
  }

  function setView(view) {
    if (state.view === view) return;
    state.view = view;
    storageSet(localStorage, STORAGE_KEY_VIEW, view);
    closeMenus();
    renderView();
  }

  // ==========================================================================
  // WHATSAPP
  // ==========================================================================
  function whatsappDigits(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('03') && digits.length === 11) digits = '92' + digits.slice(1); // 0300… → 92300…
    if (digits.length === 10 && digits.startsWith('3')) digits = '92' + digits;            // 300…  → 92300…
    return digits.length >= 8 ? digits : '';
  }

  function whatsappUrl(team) {
    const digits = whatsappDigits(team.whatsapp);
    if (!digits) return '';
    const message = team.category === 'RECEIVABLE'
      ? `Assalam-o-Alaikum ${team.name}! A reminder from Zenith Esports: your pending balance is ${formatPKR(team.amount)}. Please clear it at your earliest. JazakAllah!`
      : `Assalam-o-Alaikum ${team.name}! Zenith Esports here about your pending payout of ${formatPKR(team.amount)}. Please share your JazzCash, Easypaisa or bank details so we can send it. Thank you!`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================
  function renderAll() {
    renderOverview();
    renderTables();
    renderTabs();
    renderPayroll();
    renderView();
  }

  function renderView() {
    const salaries = state.view === 'salaries';
    document.querySelectorAll('.view-tab[data-view]').forEach((btn) => {
      const active = btn.dataset.view === state.view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    $('teamFigures').hidden = salaries;
    $('ledgerRoot').hidden = salaries;
    $('payrollFigures').hidden = !salaries;
    $('payrollRoot').hidden = !salaries;
    $('newEntryLabel').textContent = salaries ? 'Log sessions' : 'New entry';
    $('openAddTeamModalBtn').title = salaries ? 'Log today’s sessions (N)' : 'Add a team (N)';
    renderNote();
  }

  /** The line under the title: what's on the books in the open view. */
  function renderNote() {
    const note = $('overviewNote');
    if (state.view === 'salaries') {
      const p = state.payroll;
      if (!p.loaded) {
        note.textContent = 'Loading salaries…';
        return;
      }
      if (p.missing) {
        note.textContent = 'Salaries aren’t set up yet';
        return;
      }
      const { visible, totals } = payrollModel();
      const parts = [`<b>${plural(visible.length, 'person', 'people')}</b> on the register`];
      parts.push(totals.dueSessions ? `<b>${plural(totals.dueSessions, 'session')}</b> unpaid` : 'everyone is paid up');
      const lastPaid = Math.max(0, ...p.staff.map((s) => s.lastPaidAt));
      if (lastPaid) parts.push(`last paid ${relativeTime(lastPaid).toLowerCase()}`);
      note.innerHTML = parts.join(' · ');
      return;
    }
    if (!state.loaded) {
      note.textContent = 'Loading the ledger…';
      return;
    }
    const entries = state.teams.reduce((n, t) => n + t.history.length, 0);
    const lastTs = Math.max(0, ...state.teams.map((t) => t.history[0]?.timestamp || 0));
    const parts = [`<b>${plural(state.teams.length, 'team')}</b> on the books`, `<b>${plural(entries, 'entry', 'entries')}</b>`];
    if (lastTs) parts.push(`last entry ${relativeTime(lastTs).toLowerCase()}`);
    note.innerHTML = parts.join(' · ');
  }

  function renderOverview() {
    let rec = 0, recCount = 0, pay = 0, payCount = 0, collected = 0, paidOut = 0;

    for (const t of state.teams) {
      const life = lifetimeTotals(t);
      if (t.category === 'RECEIVABLE') {
        rec += t.amount;
        collected += life.settled;
        if (t.amount > 0) recCount++;
      } else {
        pay += t.amount;
        paidOut += life.settled;
        if (t.amount > 0) payCount++;
      }
    }

    // Money still owed to us is money we've already spent and not got back, so it counts against us.
    // Payouts we haven't sent yet are money we're still holding.
    const net = pay - rec;

    $('totalReceivableAmount').innerHTML = moneyHTML(rec);
    $('totalPayableAmount').innerHTML = moneyHTML(pay);
    $('netBalanceAmount').innerHTML = moneyHTML(net, true);
    $('receivableTeamsCount').textContent = `${plural(recCount, 'team')} due`;
    $('payableTeamsCount').textContent = `${plural(payCount, 'payout')} due`;
    $('totalCollectedAmount').textContent = formatPKR(collected);
    $('totalPaidOutAmount').textContent = formatPKR(paidOut);

    const netCard = $('netBalanceAmount').closest('.figure');
    const tag = $('netStatusBadge');
    netCard.classList.toggle('is-deficit', net < 0);
    tag.className = 'net-tag' + (net > 0 ? ' is-surplus' : net < 0 ? ' is-deficit' : '');
    tag.textContent = net > 0 ? 'Surplus' : net < 0 ? 'Deficit' : 'Even';
    $('netBalanceSubtext').textContent = net > 0
      ? 'Payouts still to send are more than teams owe us'
      : net < 0
        ? 'Out of pocket until teams pay what they owe'
        : 'What we’re owed and what we owe cancel out';

    const total = rec + pay;
    $('splitIn').style.width = total ? `${(rec / total) * 100}%` : '0%';
    $('splitOut').style.width = total ? `${(pay / total) * 100}%` : '0%';

    $('receivableTableTotalDisplay').textContent = formatPKR(rec);
    $('payableTableTotalDisplay').textContent = formatPKR(pay);
    $('tabReceivableBadge').textContent = recCount;
    $('tabPayableBadge').textContent = payCount;

    renderNote();
  }

  function filtersActive() {
    return Boolean(state.searchQuery.trim()) || state.statusFilter !== 'ALL';
  }

  function getFilteredTeams(category) {
    const q = state.searchQuery.trim().toLowerCase();
    return state.teams
      .filter((t) => {
        if (t.category !== category) return false;
        if (state.statusFilter !== 'ALL' && t.status !== state.statusFilter) return false;
        if (!q) return true;
        const digits = q.replace(/\D/g, '');
        return t.name.toLowerCase().includes(q)
          || t.notes.toLowerCase().includes(q)
          || t.whatsapp.toLowerCase().includes(q)
          || (digits.length >= 3 && t.whatsapp.replace(/\D/g, '').includes(digits));
      })
      .sort((a, b) => {
        switch (state.sortBy) {
          case 'amount-asc': return a.amount - b.amount;
          case 'name-asc': return a.name.localeCompare(b.name);
          case 'recent': return b.updatedAt - a.updatedAt;
          default: return b.amount - a.amount;
        }
      });
  }

  function renderTables() {
    renderSheet('RECEIVABLE', 'receivableTableBody', 'receivableEmptyState', 'receivableFilterNote');
    renderSheet('PAYABLE', 'payableTableBody', 'payableEmptyState', 'payableFilterNote');
  }

  function renderSheet(category, tbodyId, emptyId, noteId) {
    const tbody = $(tbodyId);
    const empty = $(emptyId);
    const table = tbody.closest('table');
    const teams = getFilteredTeams(category);
    const totalInCategory = state.teams.filter((t) => t.category === category).length;

    $(noteId).textContent = filtersActive() && totalInCategory ? `${teams.length} of ${totalInCategory} shown` : '';

    if (!teams.length) {
      tbody.innerHTML = '';
      table.hidden = true;
      empty.hidden = false;
      empty.innerHTML = state.loaded ? emptyStateHTML(category, totalInCategory > 0 && filtersActive()) : loadingStateHTML();
      return;
    }

    table.hidden = false;
    empty.hidden = true;
    tbody.innerHTML = teams.map(rowHTML).join('');
  }

  function loadingStateHTML(title = 'Loading the ledger…', text = 'Fetching the latest balances.') {
    return `
      <span class="empty-glyph"><span class="spinner spinner-lg" aria-hidden="true"></span></span>
      <h3>${title}</h3>
      <p>${text}</p>`;
  }

  function emptyStateHTML(category, filtered) {
    if (filtered) {
      return `
        <span class="empty-glyph">${icon('search')}</span>
        <h3>No teams match</h3>
        <p>Nothing here fits your search or status filter.</p>
        <button class="btn btn-sm btn-ghost" data-action="clear-filters">Clear filters</button>`;
    }
    const isIn = category === 'RECEIVABLE';
    return `
      <span class="empty-glyph">${icon(isIn ? 'inbox' : 'trophy')}</span>
      <h3>${isIn ? 'Nobody owes us right now' : 'No payouts pending'}</h3>
      <p>${isIn ? 'When a team books scrims or enters a tournament, add them here to track the payment.' : 'Add prize money or refunds here when Zenith needs to pay a team.'}</p>
      <button class="btn btn-sm btn-gold" data-action="add" data-category="${category}">${icon('plus')}${isIn ? 'Add team' : 'Add payout'}</button>`;
  }

  function rowHTML(team) {
    const copy = COPY[team.category];
    const open = state.openHistory.has(team.id);
    const settled = team.amount === 0;
    const cycle = cycleTotals(team);
    const pct = Math.round(cycle.progress * 100);
    const last = team.history[0];
    const waUrl = whatsappUrl(team);

    const contact = team.whatsapp
      ? `<div class="contact">
          ${waUrl
            ? `<a class="wa-link" href="${waUrl}" target="_blank" rel="noopener noreferrer" title="Open WhatsApp with a reminder">${icon('message')}<span>${escapeHtml(team.whatsapp)}</span></a>`
            : `<span class="wa-link is-disabled">${escapeHtml(team.whatsapp)}</span>`}
          <button class="icon-btn icon-btn-xs" data-action="copy" title="Copy number" aria-label="Copy number">${icon('copy')}</button>
        </div>`
      : '<span class="muted">No number</span>';

    return `
      <tr class="row${open ? ' is-open' : ''}${settled ? ' is-settled' : ''}" data-id="${escapeHtml(team.id)}">
        <td class="c-team">
          <div class="team">
            <span class="monogram">${escapeHtml(initials(team.name))}</span>
            <div class="team-text">
              <span class="team-name" title="${escapeHtml(team.name)}">${escapeHtml(team.name)}</span>
              ${team.notes ? `<span class="team-note" title="${escapeHtml(team.notes)}">${escapeHtml(team.notes)}</span>` : ''}
            </div>
          </div>
        </td>
        <td class="c-contact">${contact}</td>
        <td class="c-progress">
          <div class="progress" title="${pct}% ${copy.progressVerb}">
            <div class="progress-track"><span style="width:${pct}%"></span></div>
            <span class="progress-text"><b>${formatNumber(cycle.settled)}</b> of ${formatNumber(cycle.charged)}</span>
          </div>
        </td>
        <td class="c-balance"><span class="balance">${formatNumber(team.amount)}</span></td>
        <td class="c-status"><span class="status status-${team.status.toLowerCase()}"><i></i>${STATUS_LABELS[team.status]}</span></td>
        <td class="c-activity">
          ${last
            ? `<span class="activity-time" title="${escapeHtml(stamp(last.timestamp))}">${relativeTime(last.timestamp)}</span><span class="activity-by">by ${escapeHtml(last.adminName)}</span>`
            : '<span class="muted">—</span>'}
        </td>
        <td class="c-actions">
          <div class="row-actions">
            <button class="btn btn-sm btn-settle" data-action="adjust" data-type="DECREMENT" ${settled ? 'disabled' : ''} title="${copy.DECREMENT.tab}">${icon('check')}<span>${copy.settleButton}</span></button>
            <button class="icon-btn" data-action="adjust" data-type="INCREMENT" title="${copy.plusTitle}" aria-label="${copy.plusTitle}">${icon('plus')}</button>
            <button class="icon-btn icon-btn-count${open ? ' is-active' : ''}" data-action="history" aria-expanded="${open}" title="${open ? 'Hide' : 'Show'} history" aria-label="History, ${plural(team.history.length, 'entry', 'entries')}">${icon('history')}<span>${team.history.length}</span></button>
            <button class="icon-btn" data-action="menu" title="More" aria-label="More actions" aria-haspopup="menu">${icon('more')}</button>
          </div>
        </td>
      </tr>
      ${open ? historyRowHTML(team) : ''}`;
  }

  function historyRowHTML(team) {
    const copy = COPY[team.category];
    const life = lifetimeTotals(team);

    const items = team.history.map((h) => {
      const down = entrySign(h) < 0;
      const balance = Number.isFinite(h.resultingBalance) ? formatNumber(h.resultingBalance) : '—';
      return `
        <li class="tl-item ${down ? 'is-down' : 'is-up'}">
          <div class="tl-when"><span>${formatDate(h.timestamp)}</span><small>${formatTime(h.timestamp)}</small></div>
          <span class="tl-node"></span>
          <div class="tl-what">
            <div class="tl-line">
              <span class="tl-amount">${down ? '−' : '+'} ${formatPKR(h.amount)}</span>
              <span class="tl-kind">${entryLabel(h, team.category)}</span>
            </div>
            ${h.note ? `<p class="tl-note">${escapeHtml(h.note)}</p>` : ''}
          </div>
          <div class="tl-meta">
            <span class="tl-admin">${icon('user')}${escapeHtml(h.adminName)}</span>
            <span class="tl-balance">Balance ${balance}</span>
          </div>
        </li>`;
    }).join('');

    return `
      <tr class="history-row">
        <td colspan="7">
          <div class="history">
            <div class="history-head">
              <span class="eyebrow">Track record</span>
              <span class="history-sum">Lifetime ${copy.lifetimeCharged} <b>${formatPKR(life.charged)}</b> · ${copy.lifetimeSettled} <b>${formatPKR(life.settled)}</b></span>
            </div>
            ${items ? `<ol class="timeline">${items}</ol>` : '<p class="history-empty">No entries yet.</p>'}
          </div>
        </td>
      </tr>`;
  }

  function renderTabs() {
    const tab = state.activeTab;
    document.querySelectorAll('.toolbar .seg[data-tab]').forEach((btn) => {
      const active = btn.dataset.tab === tab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    $('sectionReceivable').hidden = tab === 'payable';
    $('sectionPayable').hidden = tab === 'receivable';
  }

  // --- Salaries ---------------------------------------------------------------

  /** The last seven days, today last. */
  function weekDays(today) {
    return Array.from({ length: 7 }, (_, i) => shiftDay(today, i - 6));
  }

  function renderPayroll() {
    const p = state.payroll;
    const model = payrollModel();
    const { totals } = model;

    $('payDueAmount').innerHTML = moneyHTML(totals.due);
    $('payDuePeople').textContent = `${plural(totals.duePeople, 'person', 'people')} due`;
    $('payDueSessions').textContent = plural(totals.dueSessions, 'session');
    $('payMonthLabel').textContent = monthFmt.format(new Date());
    $('payMonthAmount').innerHTML = moneyHTML(totals.monthAmount);
    $('payMonthSessions').textContent = plural(totals.monthSessions, 'session');
    $('payTodaySessions').textContent = plural(totals.todaySessions, 'session');
    $('payPaidMonthAmount').innerHTML = moneyHTML(totals.paidMonth);
    $('payPaidTotal').textContent = formatPKR(totals.paidTotal);
    $('payRateTag').textContent = model.commonRate === null ? 'Rates vary' : `${formatPKR(model.commonRate)} a session`;

    const badge = $('viewSalariesBadge');
    badge.textContent = totals.duePeople;
    badge.hidden = !totals.duePeople;

    const ready = p.loaded && !p.missing;
    $('payrollDueDisplay').textContent = formatPKR(totals.due);
    $('payrollDesc').textContent = ready && p.staff.length ? `Sessions worked each day · ${rateLabel(model.commonRate)}` : 'Sessions worked each day, paid per session';
    $('payAllBtn').disabled = !ready || totals.duePeople === 0;
    document.querySelector('#payrollRoot .sheet-head [data-action="add-staff"]').disabled = !ready;

    const week = weekDays(model.today);
    $('weekHead').innerHTML = week.map((iso) => {
      const d = dayDate(iso);
      return `<button type="button" class="week-day${iso === model.today ? ' is-today' : ''}" data-action="log-day" data-date="${iso}" title="Log sessions for ${formatDay(iso)}"><span>${weekdayFmt.format(d).slice(0, 2)}</span><b>${d.getDate()}</b></button>`;
    }).join('');

    const tbody = $('payrollTableBody');
    const empty = $('payrollEmptyState');
    const notice = payrollNoticeHTML(model);
    $('payrollTable').hidden = Boolean(notice);
    empty.hidden = !notice;
    empty.innerHTML = notice;
    tbody.innerHTML = notice ? '' : model.visible.map((person) => staffRowHTML(person, model, week)).join('');

    if (state.view === 'salaries') renderNote();
  }

  function payrollNoticeHTML(model) {
    const p = state.payroll;
    if (!p.loaded && p.failed) {
      return `
        <span class="empty-glyph">${icon('alert')}</span>
        <h3>Can’t load salaries right now</h3>
        <p>Check your connection. Hisaab keeps trying in the background.</p>
        <button class="btn btn-sm btn-ghost" data-action="retry-payroll">${icon('refresh')}Try again</button>`;
    }
    if (!p.loaded) return loadingStateHTML('Loading salaries…', 'Fetching the register.');
    if (p.missing) {
      return `
        <span class="empty-glyph">${icon('wallet')}</span>
        <h3>Salaries aren’t switched on yet</h3>
        <p>Run <code>supabase/hisaab-payroll.sql</code> once in the Supabase SQL editor, then reload this page.</p>`;
    }
    if (!model.visible.length) {
      return `
        <span class="empty-glyph">${icon('users')}</span>
        <h3>No one on the register</h3>
        <p>Add the people who run sessions to start logging their work.</p>
        <button class="btn btn-sm btn-gold" data-action="add-staff">${icon('plus')}Add person</button>`;
    }
    return '';
  }

  function staffRowHTML(person, model, week) {
    const open = state.openStaff.has(person.id);
    const hasDue = person.dueSessions > 0;
    const name = escapeHtml(person.name);

    const cells = week.map((iso) => {
      const day = person.days.get(iso);
      const total = day?.total || 0;
      const kind = !total ? 'is-empty' : day.paid === total ? 'is-paid' : day.paid ? 'is-part' : 'is-unpaid';
      const status = !total ? 'no sessions' : `${plural(total, 'session')}, ${day.paid === total ? 'paid' : day.paid ? `${day.paid} paid` : 'unpaid'}`;
      const label = escapeHtml(`${person.name} · ${formatDay(iso)}: ${status}`);
      return `<button type="button" class="tally ${kind}${iso === model.today ? ' is-today' : ''}" data-action="log-day" data-date="${iso}" title="${label}" aria-label="${label}"><i aria-hidden="true">${weekdayFmt.format(dayDate(iso)).charAt(0)}</i><b>${total || ''}</b></button>`;
    }).join('');

    const meta = [];
    if (model.commonRate === null || person.rate !== model.commonRate) meta.push(`${formatPKR(person.rate)} a session`);
    meta.push(`${plural(person.sessionsTotal, 'session')} all time`);

    const lastPay = person.payouts[0];
    const lastPayBy = lastPay && lastPay.createdAt === person.lastPaidAt ? `${formatPKR(lastPay.amount)} · ${escapeHtml(lastPay.adminName)}` : '';

    return `
      <tr class="row${open ? ' is-open' : ''}${person.active ? '' : ' is-removed'}" data-staff="${escapeHtml(person.id)}">
        <td class="c-person">
          <div class="team">
            <span class="monogram">${escapeHtml(initials(person.name))}</span>
            <div class="team-text">
              <span class="team-name" title="${name}">${name}</span>
              <span class="team-note">${person.active ? escapeHtml(meta.join(' · ')) : 'Removed from the register'}</span>
            </div>
          </div>
        </td>
        <td class="c-week"><div class="week">${cells}</div></td>
        <td class="c-unpaid">
          <div class="unpaid${hasDue ? '' : ' is-zero'}">
            <b>${hasDue ? plural(person.dueSessions, 'session') : 'Paid up'}</b>
            ${hasDue ? `<small>${formatDayRange(person.dueFrom, person.dueTo)}</small>` : ''}
          </div>
        </td>
        <td class="c-due"><span class="balance${person.due ? '' : ' is-zero'}">${formatNumber(person.due)}</span></td>
        <td class="c-lastpaid">
          ${person.lastPaidAt
            ? `<span class="activity-time" title="${escapeHtml(stamp(person.lastPaidAt))}">${relativeTime(person.lastPaidAt)}</span><span class="activity-by">${lastPayBy}</span>`
            : '<span class="muted">Not yet</span>'}
        </td>
        <td class="c-actions">
          <div class="row-actions">
            <button class="btn btn-sm btn-settle" data-action="pay" ${hasDue ? '' : 'disabled'} title="Mark ${name}’s salary as paid">${icon('check')}<span>Pay</span></button>
            <button class="icon-btn${open ? ' is-active' : ''}" data-action="staff-history" aria-expanded="${open}" title="${open ? 'Hide' : 'Show'} work record" aria-label="Work record for ${name}">${icon('history')}</button>
            <button class="icon-btn" data-action="staff-menu" title="More" aria-label="More actions for ${name}" aria-haspopup="menu">${icon('more')}</button>
          </div>
        </td>
      </tr>
      ${open ? staffHistoryHTML(person) : ''}`;
  }

  /** Days worked and salary payments, newest first. */
  function staffHistoryHTML(person) {
    const items = [];

    person.days.forEach((day, iso) => {
      const unpaid = day.total - day.paid;
      const status = !day.paid ? 'Unpaid' : unpaid ? `${unpaid} unpaid` : 'Paid';
      items.push({
        key: `${iso}|0`,
        html: `
          <li class="tl-item ${unpaid ? 'is-up' : 'is-done'}">
            <div class="tl-when"><span>${formatDate(dayDate(iso))}</span><small>${weekdayFmt.format(dayDate(iso))}</small></div>
            <span class="tl-node"></span>
            <div class="tl-what">
              <div class="tl-line">
                <span class="tl-amount">${plural(day.total, 'session')}</span>
                <span class="tl-kind">${formatPKR(day.amount)} · ${status}</span>
              </div>
            </div>
            <div class="tl-meta">${day.admin ? `<span class="tl-admin">${icon('user')}${escapeHtml(day.admin)}</span>` : ''}</div>
          </li>`
      });
    });

    person.payouts.forEach((pay) => {
      items.push({
        key: `${isoDay(new Date(pay.createdAt))}|1|${String(pay.createdAt).padStart(15, '0')}`,
        html: `
          <li class="tl-item is-down is-payout">
            <div class="tl-when"><span>${formatDate(pay.createdAt)}</span><small>${formatTime(pay.createdAt)}</small></div>
            <span class="tl-node"></span>
            <div class="tl-what">
              <div class="tl-line">
                <span class="tl-amount">${formatPKR(pay.amount)}</span>
                <span class="tl-kind">Salary paid</span>
              </div>
              <p class="tl-note">${plural(pay.sessions, 'session')} · ${formatDayRange(pay.from, pay.to)}</p>
            </div>
            <div class="tl-meta"><span class="tl-admin">${icon('user')}${escapeHtml(pay.adminName)}</span></div>
          </li>`
      });
    });

    items.sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));

    return `
      <tr class="history-row">
        <td colspan="6">
          <div class="history">
            <div class="history-head">
              <span class="eyebrow">Work record · since ${formatDate(dayDate(payrollWindowStart()))}</span>
              <span class="history-sum">All time <b>${plural(person.sessionsTotal, 'session')}</b> · earned <b>${formatPKR(person.earnedTotal)}</b> · paid <b>${formatPKR(person.paidTotal)}</b></span>
            </div>
            ${items.length ? `<ol class="timeline">${items.map((i) => i.html).join('')}</ol>` : '<p class="history-empty">No sessions logged since then.</p>'}
          </div>
        </td>
      </tr>`;
  }

  function renderAdminChip() {
    const chip = $('adminChip');
    const name = state.activeAdmin;
    chip.classList.toggle('is-empty', !name);
    $('adminAvatar').textContent = name ? initials(name) : '?';
    $('adminName').textContent = name || 'Set your name';
  }

  function renderSyncLabel() {
    const label = $('syncLabel');
    const dot = $('syncDot');
    if (!label) return;
    dot.classList.toggle('is-error', state.sync.failing);
    if (state.sync.failing) {
      label.textContent = state.sync.at ? `Offline · last synced ${relativeTime(state.sync.at).toLowerCase()}` : 'Can’t reach the server';
    } else {
      label.textContent = state.sync.at ? `Synced · ${relativeTime(state.sync.at).toLowerCase()}` : 'Connecting…';
    }
  }

  function renderDates() {
    const now = Date.now();
    $('todayLabel').textContent = longDateFmt.format(new Date(now));
    $('statementDate').textContent = formatDate(now);
    $('printDate').textContent = `Printed ${stamp(now)}`;
  }

  // ==========================================================================
  // TOASTS
  // ==========================================================================
  const TOAST_ICONS = { success: 'check-circle', info: 'info', warning: 'alert', danger: 'alert' };

  function showToast(message, type = 'info', action = null) {
    const container = $('toastContainer');
    if (!container) return;

    // Keep at most three on screen so they don't bury the table
    const live = [...container.querySelectorAll('.toast:not(.is-out)')];
    live.slice(0, Math.max(0, live.length - 2)).forEach((t) => t.dismiss?.());

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `${icon(TOAST_ICONS[type] || 'info')}<span class="toast-msg">${escapeHtml(message)}</span>${action ? `<button class="toast-action" type="button">${escapeHtml(action.label)}</button>` : ''}`;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-in'));

    let timer;
    const dismiss = () => {
      clearTimeout(timer);
      el.classList.remove('is-in');
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 220);
    };
    el.dismiss = dismiss;
    if (action) {
      el.querySelector('.toast-action').addEventListener('click', () => {
        dismiss();
        action.onClick();
      });
    }
    timer = setTimeout(dismiss, action ? 8000 : type === 'danger' ? 6000 : 3200);
  }

  // ==========================================================================
  // MODALS
  // ==========================================================================
  const modalStack = [];
  let dialogResolve = null;
  let dialogValidate = null;

  function openModal(id, focusId) {
    const overlay = $(id);
    if (!overlay || overlay.classList.contains('open')) return;
    closeMenus();
    overlay.returnFocus = document.activeElement;
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    modalStack.push(id);
    if (focusId) setTimeout(() => $(focusId)?.focus(), 60);
  }

  function closeModal(id) {
    const overlay = $(id);
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    const idx = modalStack.lastIndexOf(id);
    if (idx >= 0) modalStack.splice(idx, 1);
    if (id === 'dialogOverlay') resolveDialog(null);
    if (id === 'adjustModalOverlay') state.adjust.teamId = null;
    const back = overlay.returnFocus;
    if (back && document.contains(back)) back.focus();
  }

  function closeTopModal() {
    const id = modalStack[modalStack.length - 1];
    if (!id) return false;
    closeModal(id);
    return true;
  }

  function setFieldError(inputId, errorId, message) {
    const input = $(inputId);
    const error = $(errorId);
    if (input) input.classList.toggle('is-invalid', Boolean(message));
    if (error) {
      if (message && typeof message === 'string') error.textContent = message;
      error.classList.toggle('is-visible', Boolean(message));
    }
  }

  // --- Generic confirm / prompt dialog --------------------------------------
  const DIALOG_GLYPHS = { default: 'info', danger: 'alert', success: 'check-circle' };

  /**
   * Resolves with { value } when confirmed, or null when cancelled.
   * Pass `input` to ask for a value (e.g. the admin's name).
   */
  function openDialog({ title, text, tone = 'default', confirmLabel = 'Confirm', input = null }) {
    resolveDialog(null);

    $('dialogTitle').textContent = title;
    $('dialogText').textContent = text || '';
    $('dialogText').hidden = !text;

    const glyph = $('dialogGlyph');
    glyph.className = 'dialog-glyph' + (tone !== 'default' ? ` is-${tone}` : '');
    glyph.innerHTML = icon(DIALOG_GLYPHS[tone] || 'info');

    const confirm = $('dialogConfirm');
    confirm.textContent = confirmLabel;
    confirm.className = `btn ${tone === 'danger' ? 'btn-danger' : 'btn-gold'}`;

    const field = $('dialogField');
    const inputEl = $('dialogInput');
    setFieldError('dialogInput', 'dialogError', '');
    if (input) {
      field.hidden = false;
      $('dialogInputLabel').textContent = input.label;
      inputEl.value = input.value || '';
      inputEl.placeholder = input.placeholder || '';
      dialogValidate = input.validate || null;
    } else {
      field.hidden = true;
      dialogValidate = null;
    }

    openModal('dialogOverlay', input ? 'dialogInput' : 'dialogConfirm');
    if (input) setTimeout(() => inputEl.select(), 70);

    return new Promise((resolve) => { dialogResolve = resolve; });
  }

  function resolveDialog(result) {
    if (!dialogResolve) return;
    const resolve = dialogResolve;
    dialogResolve = null;
    resolve(result);
  }

  function handleDialogSubmit(e) {
    e.preventDefault();
    const field = $('dialogField');
    let value = null;
    if (!field.hidden) {
      value = $('dialogInput').value.trim();
      const problem = dialogValidate ? dialogValidate(value) : '';
      if (problem) {
        setFieldError('dialogInput', 'dialogError', problem);
        $('dialogInput').focus();
        return;
      }
    }
    resolveDialog({ value });
    closeModal('dialogOverlay');
  }

  const requireName = (v) => (v ? '' : 'Enter a name for the record');

  // ==========================================================================
  // ADD / EDIT TEAM
  // ==========================================================================
  function clearTeamFormErrors() {
    ['teamName', 'teamContact', 'teamAmount', 'teamAdminName'].forEach((k) => setFieldError(`${k}Input`, `${k}Error`, ''));
  }

  function openAddTeamModal(category = 'RECEIVABLE') {
    $('teamForm').reset();
    clearTeamFormErrors();
    $('editTeamId').value = '';
    $('teamModalEyebrow').textContent = 'New entry';
    $('teamModalTitle').textContent = 'Add a team to the ledger';
    $('teamAmountLabel').textContent = 'Opening amount';
    $('teamAmountHint').hidden = true;
    $('saveTeamSubmitBtn').textContent = 'Add to ledger';
    $(category === 'PAYABLE' ? 'catPayable' : 'catReceivable').checked = true;
    $('teamAdminNameInput').value = state.activeAdmin;
    openModal('teamModalOverlay', 'teamNameInput');
  }

  function openEditTeamModal(teamId) {
    const team = findTeam(teamId);
    if (!team) return;
    clearTeamFormErrors();
    $('editTeamId').value = team.id;
    $('teamModalEyebrow').textContent = 'Edit details';
    $('teamModalTitle').textContent = team.name;
    $('teamAmountLabel').textContent = 'Current balance';
    $('teamAmountHint').hidden = false;
    $('saveTeamSubmitBtn').textContent = 'Save changes';
    $('teamNameInput').value = team.name;
    $('teamContactInput').value = team.whatsapp;
    $('teamAmountInput').value = team.amount;
    $('teamAmountInput').dataset.original = String(team.amount);
    $('teamAdminNameInput').value = state.activeAdmin;
    $('teamNotesInput').value = team.notes;
    $(team.category === 'PAYABLE' ? 'catPayable' : 'catReceivable').checked = true;
    openModal('teamModalOverlay', 'teamNameInput');
  }

  async function handleTeamFormSubmit(e) {
    e.preventDefault();

    const name = $('teamNameInput').value.trim();
    const whatsapp = $('teamContactInput').value.trim();
    const amountRaw = $('teamAmountInput').value;
    const amount = amountRaw === '' ? 0 : parseAmount(amountRaw);
    const adminName = $('teamAdminNameInput').value.trim();
    const notes = $('teamNotesInput').value.trim();
    const category = document.querySelector('input[name="teamCategory"]:checked')?.value === 'PAYABLE' ? 'PAYABLE' : 'RECEIVABLE';
    const editId = $('editTeamId').value;

    const errors = {
      teamName: name ? (name.length > 120 ? 'Keep the name under 120 characters' : '') : 'Enter the team\'s name',
      teamContact: !whatsapp ? 'Enter a WhatsApp number' : (whatsappDigits(whatsapp) && whatsapp.length <= 40 ? '' : 'That doesn\'t look like a phone number'),
      teamAmount: Number.isFinite(amount) && amount >= 0 ? '' : 'Enter an amount of 0 or more',
      teamAdminName: adminName ? '' : 'Enter your name for the record'
    };

    let firstInvalid = null;
    Object.entries(errors).forEach(([key, msg]) => {
      setFieldError(`${key}Input`, `${key}Error`, msg);
      if (msg && !firstInvalid) firstInvalid = `${key}Input`;
    });
    if (firstInvalid) {
      $(firstInvalid).focus();
      return;
    }

    const duplicate = state.teams.find((t) => t.id !== editId && t.category === category && t.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      setFieldError('teamNameInput', 'teamNameError', `${duplicate.name} is already on this side of the ledger`);
      $('teamNameInput').focus();
      return;
    }

    saveAdmin(adminName);
    const button = $('saveTeamSubmitBtn');

    if (editId) {
      const team = findTeam(editId);
      if (!team) return;
      const original = Number($('teamAmountInput').dataset.original);
      const detailsChanged = team.name !== name || team.whatsapp !== whatsapp || team.category !== category || team.notes !== notes;
      const { ok } = await mutate(button, async () => {
        if (detailsChanged) await api.updateTeam(editId, { name, whatsapp, category, notes });
        if (amount !== original) {
          await api.recordEntry({
            p_team_id: editId,
            p_type: 'CORRECTION',
            p_amount: amount,
            p_admin: adminName,
            p_note: 'Balance edited in team details',
            p_expected_balance: original
          });
        }
      });
      if (!ok) return;
      closeModal('teamModalOverlay');
      showToast(`Saved changes to ${name}`, 'success');
    } else {
      const { ok } = await mutate(button, () => api.addTeam({
        p_name: name,
        p_whatsapp: whatsapp,
        p_category: category,
        p_notes: notes,
        p_amount: amount,
        p_admin: adminName
      }));
      if (!ok) return;
      closeModal('teamModalOverlay');
      const sideTab = category === 'PAYABLE' ? 'payable' : 'receivable';
      if (state.activeTab !== 'split' && state.activeTab !== sideTab) setTab(sideTab);
      showToast(`Added ${name} — ${formatPKR(amount)}`, 'success');
    }
  }

  // ==========================================================================
  // RECORD AN ENTRY (ADJUST)
  // ==========================================================================
  function openAdjustModal(teamId, type = 'DECREMENT') {
    const team = findTeam(teamId);
    if (!team) return;
    state.adjust.teamId = teamId;
    state.adjust.type = team.amount === 0 ? 'INCREMENT' : type;

    $('adjustModalTeamName').textContent = team.name;
    $('adjustAmountInput').value = '';
    $('adjustAdminNameInput').value = state.activeAdmin;
    $('adjustReasonInput').value = '';
    setFieldError('adjustAmountInput', 'adjustAmountError', '');
    setFieldError('adjustAdminNameInput', 'adjustAdminError', '');

    renderAdjustType();
    openModal('adjustModalOverlay', 'adjustAmountInput');
  }

  function renderAdjustType() {
    const team = findTeam(state.adjust.teamId);
    if (!team) return;
    const copy = COPY[team.category];
    const isDown = state.adjust.type === 'DECREMENT';

    $('adjustEyebrow').textContent = `${copy.side} · balance ${formatPKR(team.amount)}`;

    const down = $('adjustTypeDeduct');
    const up = $('adjustTypeAdd');
    down.textContent = copy.DECREMENT.tab;
    up.textContent = copy.INCREMENT.tab;
    down.disabled = team.amount === 0;
    down.classList.toggle('is-active', isDown);
    down.classList.toggle('tone-down', isDown);
    up.classList.toggle('is-active', !isDown);
    up.classList.toggle('tone-up', !isDown);
    down.setAttribute('aria-checked', String(isDown));
    up.setAttribute('aria-checked', String(!isDown));

    $('fullBalanceChip').hidden = !isDown;
    $('methodChips').hidden = !isDown;
    $('adjustReasonInput').placeholder = copy[state.adjust.type].placeholder;
    $('confirmAdjustBtn').textContent = copy[state.adjust.type].cta;
    $('adjustOp').textContent = isDown ? '−' : '+';
    $('methodChips').querySelector('.chips-label').textContent = team.category === 'RECEIVABLE' ? 'Paid via' : 'Sent via';

    updateAdjustPreview();
  }

  /** Returns the validation message for the current amount, or '' if fine. */
  function updateAdjustPreview() {
    const team = findTeam(state.adjust.teamId);
    if (!team) return '';
    const raw = $('adjustAmountInput').value;
    const amount = raw === '' ? 0 : parseAmount(raw);
    const isDown = state.adjust.type === 'DECREMENT';
    const valid = Number.isFinite(amount) && amount >= 0;
    const delta = valid ? amount : 0;
    const result = isDown ? team.amount - delta : team.amount + delta;

    $('adjustCurrentBalance').textContent = formatNumber(team.amount);
    $('adjustDeltaDisplay').textContent = formatNumber(delta);
    $('adjustNewBalance').textContent = result < 0 ? `−${formatNumber(-result)}` : formatNumber(result);

    let problem = '';
    if (!valid) problem = 'Enter a whole number';
    else if (isDown && amount > team.amount) problem = `That's more than the ${formatPKR(team.amount)} outstanding. Use “Full balance” to clear it.`;

    const line = document.querySelector('.sum-line');
    line.classList.toggle('is-error', Boolean(problem));
    line.classList.toggle('is-zero', !problem && result === 0 && amount > 0);

    document.querySelectorAll('.chip[data-amt]').forEach((chip) => {
      chip.classList.toggle('is-active', Number(chip.dataset.amt) === amount);
    });
    $('fullBalanceChip').classList.toggle('is-active', isDown && amount === team.amount && amount > 0);

    return problem;
  }

  async function handleAdjustFormSubmit(e) {
    e.preventDefault();
    const team = findTeam(state.adjust.teamId);
    if (!team) return;

    const amount = parseAmount($('adjustAmountInput').value);
    const adminName = $('adjustAdminNameInput').value.trim();
    const note = $('adjustReasonInput').value.trim();
    const type = state.adjust.type;

    let problem = updateAdjustPreview();
    if (!problem && !(amount > 0)) problem = 'Enter an amount above zero';
    setFieldError('adjustAmountInput', 'adjustAmountError', problem);
    if (problem) {
      $('adjustAmountInput').focus();
      return;
    }
    if (!adminName) {
      setFieldError('adjustAdminNameInput', 'adjustAdminError', true);
      $('adjustAdminNameInput').focus();
      return;
    }

    saveAdmin(adminName);
    const teamId = team.id;
    const { ok, error } = await mutate($('confirmAdjustBtn'), () => api.recordEntry({
      p_team_id: teamId,
      p_type: type,
      p_amount: amount,
      p_admin: adminName,
      p_note: note || entryLabel({ type }, team.category)
    }));

    if (!ok) {
      // Another admin may have changed the balance — refresh the preview against the latest numbers
      if (error?.code === 'ZH002' && findTeam(teamId)) renderAdjustType();
      if (error?.code === 'ZH003') closeModal('adjustModalOverlay');
      return;
    }

    closeModal('adjustModalOverlay');
    const fresh = findTeam(teamId) || team;
    const copy = COPY[fresh.category];
    const verb = type === 'DECREMENT' ? copy.DECREMENT.tab.toLowerCase() : copy.INCREMENT.tab.toLowerCase();
    const tail = fresh.amount === 0 ? ' — fully settled' : ` — ${formatPKR(fresh.amount)} left`;
    showToast(`${fresh.name}: ${formatPKR(amount)} ${verb}${tail}`, 'success');
  }

  // ==========================================================================
  // ROW ACTIONS
  // ==========================================================================
  async function settleTeam(teamId) {
    const team = findTeam(teamId);
    if (!team) return;
    if (team.amount === 0) {
      showToast(`${team.name} is already settled`, 'info');
      return;
    }
    const isIn = team.category === 'RECEIVABLE';
    const cleared = team.amount;
    const result = await openDialog({
      title: isIn ? `Mark ${team.name} as fully paid?` : `Mark ${team.name} as fully paid out?`,
      text: isIn
        ? `This records ${formatPKR(cleared)} received and brings their balance to zero.`
        : `This records ${formatPKR(cleared)} sent and brings the payout to zero.`,
      tone: 'success',
      confirmLabel: isIn ? 'Mark as paid' : 'Mark as paid out',
      input: { label: 'Recorded by', value: state.activeAdmin, placeholder: 'Your name', validate: requireName }
    });
    if (!result) return;

    saveAdmin(result.value);
    const { ok } = await mutate(null, () => api.recordEntry({
      p_team_id: teamId,
      p_type: 'DECREMENT',
      p_amount: cleared,
      p_admin: result.value,
      p_note: 'Settled in full',
      p_expected_balance: cleared
    }));
    if (ok) showToast(`${team.name} settled — ${formatPKR(cleared)} ${isIn ? 'received' : 'paid out'}`, 'success');
  }

  async function deleteTeam(teamId) {
    const team = findTeam(teamId);
    if (!team) return;
    const result = await openDialog({
      title: `Delete ${team.name}?`,
      text: `This removes the team and its ${plural(team.history.length, 'entry', 'entries')} for every admin. You can undo it for a few seconds afterwards.`,
      tone: 'danger',
      confirmLabel: 'Delete team'
    });
    if (!result) return;

    const copy = JSON.parse(JSON.stringify(team));
    const { ok } = await mutate(null, () => api.deleteTeam(teamId));
    if (!ok) return;
    state.openHistory.delete(teamId);
    showToast(`Deleted ${copy.name}`, 'info', {
      label: 'Undo',
      onClick: async () => {
        const undo = await mutate(null, () => api.restore([copy], false));
        if (undo.ok) showToast(`Restored ${copy.name}`, 'success');
      }
    });
  }

  function toggleHistory(teamId) {
    if (state.openHistory.has(teamId)) state.openHistory.delete(teamId);
    else state.openHistory.add(teamId);
    renderTables();
  }

  function copyNumber(teamId) {
    const team = findTeam(teamId);
    if (!team || !team.whatsapp) return;
    const text = team.whatsapp;
    const done = () => showToast(`Copied ${text}`, 'success');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text) && done());
    } else if (fallbackCopy(text)) {
      done();
    }
  }

  function fallbackCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    area.remove();
    if (!ok) showToast(`Copy failed — number is ${text}`, 'warning');
    return ok;
  }

  // --- Row overflow menu ----------------------------------------------------
  function openRowMenu(button, teamId, viaKeyboard = false) {
    const menu = $('rowMenu');
    const team = findTeam(teamId);
    if (!team) return;

    if (!menu.hidden && state.menuTeamId === teamId) {
      closeMenus();
      return;
    }
    closeMenus();
    state.menuTeamId = teamId;

    menu.querySelector('[data-row-action="settle"]').disabled = team.amount === 0;
    menu.querySelector('[data-row-action="remind"]').disabled = !whatsappUrl(team) || team.amount === 0;
    $('rowMenuSettleLabel').textContent = COPY[team.category].settleMenu;
    showFloatingMenu(menu, button, viaKeyboard);
  }

  /** Open a fixed-position menu under (or above) the button that opened it. */
  function showFloatingMenu(menu, button, viaKeyboard) {
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    menu.anchor = button;

    const rect = button.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let top = rect.bottom + 6;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, rect.top - mh - 6);
    const left = Math.min(Math.max(8, rect.right - mw), window.innerWidth - mw - 8);
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    if (viaKeyboard) menu.querySelector('.menu-item:not(:disabled)')?.focus({ preventScroll: true });
  }

  const FLOATING_MENUS = ['rowMenu', 'staffMenu'];

  function openFloatingMenu() {
    return FLOATING_MENUS.map($).find((menu) => menu && !menu.hidden) || null;
  }

  function closeMenus() {
    FLOATING_MENUS.forEach((id) => {
      const menu = $(id);
      if (menu && !menu.hidden) {
        menu.hidden = true;
        menu.anchor?.setAttribute('aria-expanded', 'false');
      }
    });
    state.menuTeamId = null;
    state.menuStaffId = null;
    const tools = $('toolsMenuWrap');
    if (tools?.classList.contains('is-open')) {
      tools.classList.remove('is-open');
      $('toolsDropdownBtn').setAttribute('aria-expanded', 'false');
    }
  }

  function handleRowMenuAction(action) {
    const teamId = state.menuTeamId;
    const team = findTeam(teamId);
    closeMenus();
    if (!team) return;
    switch (action) {
      case 'edit': openEditTeamModal(teamId); break;
      case 'settle': settleTeam(teamId); break;
      case 'remind': {
        const url = whatsappUrl(team);
        if (url) window.open(url, '_blank', 'noopener');
        break;
      }
      case 'delete': deleteTeam(teamId); break;
    }
  }

  // ==========================================================================
  // SALARIES — log a day, pay, keep the register
  // ==========================================================================
  function findPerson(staffId, model = payrollModel()) {
    return model.people.find((p) => p.id === staffId);
  }

  function payrollReady() {
    if (state.payroll.missing) {
      showToast(describeError({ code: 'PGRST202' }, 'payroll'), 'warning');
      return false;
    }
    if (!state.payroll.loaded) {
      showToast('Salaries are still loading', 'info');
      return false;
    }
    return true;
  }

  /** "Haseeb", "Haseeb and Ayan", "Haseeb, Ayan and 3 others" */
  function listNames(people) {
    const names = people.map((p) => p.name);
    if (names.length <= 2) return names.join(' and ');
    if (names.length <= 4) return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    return `${names.slice(0, 2).join(', ')} and ${names.length - 2} others`;
  }

  function toggleStaffHistory(staffId) {
    if (state.openStaff.has(staffId)) state.openStaff.delete(staffId);
    else state.openStaff.add(staffId);
    renderPayroll();
  }

  // --- Log a day ------------------------------------------------------------
  function clampLogDate(iso) {
    const max = todayISO();
    const min = payrollWindowStart();
    if (!isValidDay(iso) || iso > max) return max;
    return iso < min ? min : iso;
  }

  function openLogModal(date = todayISO(), focusStaffId = null) {
    if (!payrollReady()) return;
    if (!state.payroll.staff.some((s) => s.active)) {
      showToast('Add someone to the register first', 'info');
      openStaffModal();
      return;
    }
    $('logAdminNameInput').value = state.activeAdmin;
    setFieldError('logAdminNameInput', 'logAdminError', '');
    loadLogDay(clampLogDate(date));
    openModal('logModalOverlay');
    setTimeout(() => {
      const list = $('logList');
      const row = focusStaffId ? list.querySelector(`.log-row[data-staff="${CSS.escape(focusStaffId)}"]`) : null;
      const input = (row || list).querySelector('input');
      input?.focus();
      input?.select();
    }, 60);
  }

  /** Fill the sheet with what's saved for that day. */
  function loadLogDay(date) {
    const model = payrollModel();
    const log = state.log;
    log.date = date;
    log.people = model.people.filter((p) => p.active || p.days.get(date)?.total);
    log.original = new Map();
    log.counts = new Map();
    log.people.forEach((p) => {
      const total = p.days.get(date)?.total || 0;
      log.original.set(p.id, total);
      log.counts.set(p.id, total);
    });

    const input = $('logDateInput');
    const max = todayISO();
    const min = payrollWindowStart();
    input.value = date;
    input.max = max;
    input.min = min;
    $('logDayName').textContent = weekdayFmt.format(dayDate(date)).toUpperCase();
    $('logPrevDayBtn').disabled = date <= min;
    $('logNextDayBtn').disabled = date >= max;
    $('logTodayBtn').classList.toggle('is-active', date === max);
    $('logEyebrow').textContent = `Salaries · ${rateLabel(model.commonRate)}`;

    $('logList').innerHTML = log.people.map((p) => logRowHTML(p, date, model.commonRate)).join('');
    renderLogTotals();
  }

  function logRowHTML(person, date, commonRate) {
    const paid = person.days.get(date)?.paid || 0;
    const name = escapeHtml(person.name);
    const meta = [];
    if (paid) meta.push(`${paid} paid`);
    if (commonRate === null || person.rate !== commonRate) meta.push(`${formatPKR(person.rate)} each`);
    if (!person.active) meta.push('removed');
    return `
      <li class="log-row" data-staff="${escapeHtml(person.id)}">
        <span class="monogram">${escapeHtml(initials(person.name))}</span>
        <div class="log-who">
          <span class="log-name">${name}</span>
          <span class="log-meta">${escapeHtml(meta.join(' · '))}</span>
        </div>
        <div class="stepper">
          <button type="button" data-step="-1" aria-label="One session less for ${name}">${icon('minus')}</button>
          <input type="number" inputmode="numeric" min="${paid}" max="${MAX_SESSIONS_PER_DAY}" step="1" value="${state.log.counts.get(person.id)}" aria-label="Sessions for ${name}">
          <button type="button" data-step="1" aria-label="One session more for ${name}">${icon('plus')}</button>
        </div>
        <span class="log-amount"></span>
      </li>`;
  }

  /** What a person's day comes to: paid sessions at their rate, the rest at today's rate. */
  function logRowAmount(person, date, count) {
    const day = person.days.get(date);
    if (count === (day?.total || 0)) return day?.amount || 0;
    return (day?.paidAmount || 0) + (count - (day?.paid || 0)) * person.rate;
  }

  function renderLogTotals() {
    const { date, people, counts, original } = state.log;
    let sessions = 0;
    let amount = 0;
    let changed = 0;
    for (const person of people) {
      const count = counts.get(person.id);
      const paid = person.days.get(date)?.paid || 0;
      const value = logRowAmount(person, date, count);
      const isChanged = count !== original.get(person.id);
      sessions += count;
      amount += value;
      if (isChanged) changed++;
      const row = $('logList').querySelector(`.log-row[data-staff="${CSS.escape(person.id)}"]`);
      if (!row) continue;
      row.classList.toggle('is-changed', isChanged);
      row.classList.toggle('has-count', count > 0);
      row.querySelector('[data-step="-1"]').disabled = count <= paid;
      row.querySelector('[data-step="1"]').disabled = count >= MAX_SESSIONS_PER_DAY;
      row.querySelector('.log-amount').textContent = count ? formatNumber(value) : '—';
    }
    $('logTotalSessions').textContent = plural(sessions, 'session');
    $('logTotalAmount').textContent = formatPKR(amount);
    $('logChangesNote').textContent = changed ? `${plural(changed, 'change')} not saved` : '';
  }

  /** Set a count, kept between what's already paid that day and the daily maximum. */
  function setLogCount(staffId, value, { rewrite = true } = {}) {
    const person = state.log.people.find((p) => p.id === staffId);
    if (!person) return;
    const paid = person.days.get(state.log.date)?.paid || 0;
    let n = Math.round(Number(value));
    if (!Number.isFinite(n) || String(value).trim() === '') n = paid;
    n = Math.min(MAX_SESSIONS_PER_DAY, Math.max(paid, n));
    state.log.counts.set(staffId, n);
    const input = $('logList').querySelector(`.log-row[data-staff="${CSS.escape(staffId)}"] input`);
    if (rewrite && input) input.value = n;
    renderLogTotals();
  }

  function logChanges() {
    const { people, counts, original } = state.log;
    return people
      .filter((p) => counts.get(p.id) !== original.get(p.id))
      .map((p) => ({ staff_id: p.id, sessions: counts.get(p.id), expected: original.get(p.id) }));
  }

  async function changeLogDate(next) {
    const date = clampLogDate(next);
    if (date === state.log.date) {
      $('logDateInput').value = date;
      return;
    }
    if (logChanges().length) {
      const discard = await openDialog({
        title: `Discard changes for ${formatDay(state.log.date)}?`,
        text: 'You changed some counts on this day and haven’t saved them yet.',
        tone: 'danger',
        confirmLabel: 'Discard changes'
      });
      if (!discard) {
        $('logDateInput').value = state.log.date;
        return;
      }
    }
    loadLogDay(date);
  }

  async function handleLogSubmit(e) {
    e.preventDefault();
    $('logList').querySelectorAll('.log-row').forEach((row) => setLogCount(row.dataset.staff, row.querySelector('input').value));
    const date = state.log.date;
    const changes = logChanges();
    if (!changes.length) {
      closeModal('logModalOverlay');
      showToast(`No changes for ${formatDay(date)}`, 'info');
      return;
    }
    const adminName = $('logAdminNameInput').value.trim();
    if (!adminName) {
      setFieldError('logAdminNameInput', 'logAdminError', true);
      $('logAdminNameInput').focus();
      return;
    }

    saveAdmin(adminName);
    const { ok, error } = await mutate($('saveLogBtn'), () => api.logSessions(date, changes, adminName), PAYROLL);
    if (!ok) {
      // Someone else changed this day — show the latest counts before they try again
      if (RELOAD_CODES.includes(error?.code) && $('logModalOverlay').classList.contains('open')) loadLogDay(date);
      return;
    }
    closeModal('logModalOverlay');
    const model = payrollModel();
    const sessions = model.people.reduce((n, p) => n + (p.days.get(date)?.total || 0), 0);
    const amount = model.people.reduce((n, p) => n + (p.days.get(date)?.amount || 0), 0);
    showToast(`${formatDay(date)} saved: ${plural(sessions, 'session')}, ${formatPKR(amount)}`, 'success');
  }

  // --- Pay ------------------------------------------------------------------
  async function payPerson(staffId) {
    if (!payrollReady()) return;
    const person = findPerson(staffId);
    if (!person) return;
    if (!person.dueSessions) {
      showToast(`${person.name} is paid up`, 'info');
      return;
    }
    const amount = person.due;
    const result = await openDialog({
      title: `Pay ${person.name} ${formatPKR(amount)}?`,
      text: `This marks ${plural(person.dueSessions, 'session')} (${formatDayRange(person.dueFrom, person.dueTo)}) as paid. Those days lock, and new sessions start a fresh balance.`,
      tone: 'success',
      confirmLabel: 'Mark as paid',
      input: { label: 'Recorded by', value: state.activeAdmin, placeholder: 'Your name', validate: requireName }
    });
    if (!result) return;

    saveAdmin(result.value);
    const { ok, result: ids } = await mutate(null, () => api.payStaff([{ staff_id: person.id, expected: amount }], result.value), PAYROLL);
    if (!ok) return;
    showToast(`${person.name} paid ${formatPKR(amount)}`, 'success', {
      label: 'Undo',
      onClick: () => undoPayments(ids, `${person.name}’s payment undone`)
    });
  }

  async function payEveryone() {
    if (!payrollReady()) return;
    const due = payrollModel().people.filter((p) => p.dueSessions > 0);
    if (!due.length) {
      showToast('Everyone is paid up', 'info');
      return;
    }
    if (due.length === 1) {
      payPerson(due[0].id);
      return;
    }
    const amount = due.reduce((n, p) => n + p.due, 0);
    const sessions = due.reduce((n, p) => n + p.dueSessions, 0);
    const result = await openDialog({
      title: `Pay everyone ${formatPKR(amount)}?`,
      text: `This marks ${plural(sessions, 'session')} as paid for ${due.length} people: ${listNames(due)}. Their days lock.`,
      tone: 'success',
      confirmLabel: 'Mark all as paid',
      input: { label: 'Recorded by', value: state.activeAdmin, placeholder: 'Your name', validate: requireName }
    });
    if (!result) return;

    saveAdmin(result.value);
    const items = due.map((p) => ({ staff_id: p.id, expected: p.due }));
    const { ok, result: ids } = await mutate(null, () => api.payStaff(items, result.value), PAYROLL);
    if (!ok) return;
    showToast(`Paid ${due.length} people ${formatPKR(amount)}`, 'success', {
      label: 'Undo',
      onClick: () => undoPayments(ids, 'Payments undone')
    });
  }

  async function undoPayments(ids, message) {
    const { ok } = await mutate(null, () => api.undoPayouts(ids), PAYROLL);
    if (ok) showToast(message, 'success');
  }

  // --- The register ---------------------------------------------------------
  function openStaffModal(staffId = null) {
    if (!payrollReady()) return;
    const person = staffId ? state.payroll.staff.find((s) => s.id === staffId) : null;
    $('staffForm').reset();
    setFieldError('staffNameInput', 'staffNameError', '');
    setFieldError('staffRateInput', 'staffRateError', '');
    $('editStaffId').value = person?.id || '';
    $('staffModalEyebrow').textContent = person ? 'Edit person' : 'Staff register';
    $('staffModalTitle').textContent = person ? person.name : 'Add a person';
    $('staffNameInput').value = person?.name || '';
    $('staffRateInput').value = String(person ? person.rate : (payrollModel().commonRate ?? DEFAULT_RATE));
    $('staffRateHint').hidden = !person;
    $('saveStaffBtn').textContent = person ? 'Save changes' : 'Add to register';
    openModal('staffModalOverlay', 'staffNameInput');
  }

  async function handleStaffSubmit(e) {
    e.preventDefault();
    const editId = $('editStaffId').value;
    const name = $('staffNameInput').value.trim().replace(/\s+/g, ' ');
    const rateRaw = $('staffRateInput').value;
    const rate = rateRaw === '' ? NaN : parseAmount(rateRaw);

    const errors = {
      staffName: name ? (name.length > 60 ? 'Keep the name under 60 characters' : '') : 'Enter a name',
      staffRate: Number.isFinite(rate) && rate >= 0 && rate <= 1000000 ? '' : 'Enter an amount of 0 or more'
    };
    let firstInvalid = null;
    Object.entries(errors).forEach(([key, msg]) => {
      setFieldError(`${key}Input`, `${key}Error`, msg);
      if (msg && !firstInvalid) firstInvalid = `${key}Input`;
    });
    if (firstInvalid) {
      $(firstInvalid).focus();
      return;
    }

    const clash = state.payroll.staff.find((s) => s.id !== editId && s.name.toLowerCase() === name.toLowerCase());
    if (clash && (clash.active || editId)) {
      setFieldError('staffNameInput', 'staffNameError', clash.active ? `${clash.name} is already on the register` : 'Someone removed from the register has that name');
      $('staffNameInput').focus();
      return;
    }

    let action;
    let message;
    if (editId) {
      const current = state.payroll.staff.find((s) => s.id === editId);
      if (!current) {
        closeModal('staffModalOverlay');
        return;
      }
      const fields = {};
      if (current.name !== name) fields.name = name;
      if (current.rate !== rate) fields.rate = rate;
      if (!Object.keys(fields).length) {
        closeModal('staffModalOverlay');
        return;
      }
      action = () => api.updateStaff(editId, fields);
      message = fields.name === undefined ? `${name} now gets ${formatPKR(rate)} a session` : `Saved ${name}`;
    } else if (clash) {
      // Removed earlier: bring the same person (and their history) back
      action = () => api.updateStaff(clash.id, { active: true, name, rate });
      message = `${name} is back on the register`;
    } else {
      action = () => api.addStaff({ name, rate });
      message = `Added ${name} to the register`;
    }

    const { ok, error } = await mutate($('saveStaffBtn'), action, PAYROLL);
    if (!ok) {
      if (error?.code === '23505') {
        setFieldError('staffNameInput', 'staffNameError', 'Someone with that name is already on the register');
        $('staffNameInput').focus();
      }
      return;
    }
    closeModal('staffModalOverlay');
    showToast(message, 'success');
  }

  async function removePerson(staffId) {
    const person = findPerson(staffId);
    if (!person) return;
    if (person.dueSessions) {
      showToast(`Pay ${person.name}’s ${formatPKR(person.due)} before removing them`, 'warning');
      return;
    }
    const result = await openDialog({
      title: `Remove ${person.name} from the register?`,
      text: 'They won’t appear on the register or the daily sheet any more. Their sessions and payments stay on record, and adding the same name again brings them back.',
      tone: 'danger',
      confirmLabel: 'Remove'
    });
    if (!result) return;

    const { ok } = await mutate(null, () => api.updateStaff(staffId, { active: false }), PAYROLL);
    if (!ok) return;
    state.openStaff.delete(staffId);
    renderPayroll();
    showToast(`Removed ${person.name}`, 'info', {
      label: 'Undo',
      onClick: async () => {
        const undo = await mutate(null, () => api.updateStaff(staffId, { active: true }), PAYROLL);
        if (undo.ok) showToast(`${person.name} is back on the register`, 'success');
      }
    });
  }

  function openStaffMenu(button, staffId, viaKeyboard = false) {
    const menu = $('staffMenu');
    const person = findPerson(staffId);
    if (!person) return;
    if (!menu.hidden && state.menuStaffId === staffId) {
      closeMenus();
      return;
    }
    closeMenus();
    state.menuStaffId = staffId;
    menu.querySelector('[data-staff-action="log"]').disabled = !person.active;
    menu.querySelector('[data-staff-action="remove"]').disabled = !person.active;
    showFloatingMenu(menu, button, viaKeyboard);
  }

  function handleStaffMenuAction(action) {
    const staffId = state.menuStaffId;
    closeMenus();
    if (!staffId) return;
    switch (action) {
      case 'log': openLogModal(todayISO(), staffId); break;
      case 'edit': openStaffModal(staffId); break;
      case 'remove': removePerson(staffId); break;
    }
  }

  // ==========================================================================
  // ACCESS GATE (Supabase login)
  // ==========================================================================
  function isLocked() {
    return !$('adminGateOverlay').classList.contains('unlocked');
  }

  function showGateMessage(message, tone = 'error') {
    const el = $('gateErrorMsg');
    el.textContent = message || '';
    el.classList.toggle('is-visible', Boolean(message));
    el.classList.toggle('is-notice', tone === 'notice');
  }

  function setGateBusy(busy, label) {
    const button = $('gateSubmitBtn');
    $('gatePasscodeInput').disabled = busy;
    if (busy) {
      button.dataset.busyLabel = label || 'Unlocking…';
      setBusy(button, true);
    } else {
      setBusy(button, false);
    }
  }

  function unlockGate() {
    $('adminGateOverlay').classList.add('unlocked');
    const input = $('gatePasscodeInput');
    input.value = '';
    input.blur();
    showGateMessage('');
  }

  function showGate() {
    const gate = $('adminGateOverlay');
    gate.classList.remove('unlocked');
    setTimeout(() => $('gatePasscodeInput')?.focus(), 120);
  }

  /** On page load: reuse a saved session if there is one. */
  async function bootAuth() {
    if (!api.configured()) {
      showGateMessage('Hisaab isn’t connected yet. Add the Supabase key to config.js.');
      $('gatePasscodeInput').disabled = true;
      $('gateSubmitBtn').disabled = true;
      return;
    }
    if (!api.restoreSession()) {
      $('gateSubmitBtn').disabled = false;
      showGate();
      return;
    }
    $('gateRememberCheckbox').checked = api.remembered();
    setGateBusy(true, 'Signing in…');
    try {
      if (!(await api.isAdmin())) {
        await api.signOut();
        showGateMessage('This login doesn’t have access to Hisaab.');
        showGate();
        return;
      }
      unlockGate();
      startSession();
    } catch (err) {
      if (err.code === 'NETWORK') {
        showGateMessage('Can’t reach the server. Check your connection, then enter the passcode.');
      } else {
        api.clear();
        if (err.code === 'SESSION') showGateMessage('Your session has ended. Enter the passcode to continue.', 'notice');
      }
      showGate();
    } finally {
      setGateBusy(false);
    }
  }

  async function handleGateUnlockSubmit(e) {
    e.preventDefault();
    if (!api.configured()) return;
    const input = $('gatePasscodeInput');
    const passcode = input.value;

    const fail = (message) => {
      showGateMessage(message);
      input.classList.remove('is-invalid');
      void input.offsetWidth; // restart the shake animation
      input.classList.add('is-invalid');
      setTimeout(() => { input.focus(); input.select(); }, 0);
    };

    if (!passcode) {
      fail('Enter the passcode.');
      return;
    }

    setGateBusy(true, 'Unlocking…');
    try {
      await api.signIn(passcode, $('gateRememberCheckbox').checked);
      if (!(await api.isAdmin())) {
        await api.signOut();
        setGateBusy(false);
        fail('This login doesn’t have access to Hisaab.');
        return;
      }
      setGateBusy(false);
      input.classList.remove('is-invalid');
      unlockGate();
      startSession();
      if (!state.activeAdmin) setTimeout(promptForAdmin, 450);
    } catch (err) {
      setGateBusy(false);
      if (err.status === 429) fail('Too many attempts. Wait a minute, then try again.');
      else if (err.code === 'NETWORK') fail('Can’t reach the server. Check your connection.');
      else if (err.status === 400 || err.status === 401 || err.code === 'invalid_credentials' || err.code === 'invalid_grant') fail('That passcode isn’t right. Try again.');
      else fail(describeError(err));
    }
  }

  function startSession() {
    state.loaded = false;
    state.payroll = emptyPayroll();
    renderAll();
    loadLedger();
    loadPayroll({ quiet: true });
  }

  function lockLedger(message = '') {
    sessionGeneration++;
    api.signOut();
    while (closeTopModal()) { /* close everything */ }
    closeMenus();
    state.teams = [];
    state.loaded = false;
    state.sync = { at: 0, failing: false };
    state.adjust.teamId = null;
    state.openHistory.clear();
    state.payroll = emptyPayroll();
    state.openStaff.clear();
    state.log = { date: '', people: [], original: new Map(), counts: new Map() };
    renderAll();
    renderSyncLabel();
    const input = $('gatePasscodeInput');
    input.value = '';
    input.classList.remove('is-invalid');
    input.disabled = false;
    showGateMessage(message, 'notice');
    showGate();
  }

  function toggleGatePasswordVisibility() {
    const input = $('gatePasscodeInput');
    const btn = $('toggleGateEyeBtn');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-label', show ? 'Hide passcode' : 'Show passcode');
    btn.innerHTML = icon(show ? 'eye-off' : 'eye');
    input.focus();
  }

  function openChangePasscodeModal() {
    $('changePasscodeForm').reset();
    ['currentPasscode', 'newPasscode', 'confirmPasscode'].forEach((k) => setFieldError(`${k}Input`, `${k}Error`, ''));
    openModal('changePasscodeModalOverlay', 'currentPasscodeInput');
  }

  async function handleChangePasscodeSubmit(e) {
    e.preventDefault();
    const current = $('currentPasscodeInput').value;
    const next = $('newPasscodeInput').value;
    const confirm = $('confirmPasscodeInput').value;

    const errors = {
      currentPasscode: current ? '' : 'Enter the current passcode',
      newPasscode: next.length >= MIN_PASSCODE_LENGTH ? (next === current ? 'Choose a different passcode' : '') : `Use at least ${MIN_PASSCODE_LENGTH} characters`,
      confirmPasscode: next === confirm ? '' : 'The two passcodes don’t match'
    };
    let first = null;
    Object.entries(errors).forEach(([key, msg]) => {
      setFieldError(`${key}Input`, `${key}Error`, msg);
      if (msg && !first) first = `${key}Input`;
    });
    if (first) {
      $(first).focus();
      return;
    }

    const button = $('savePasscodeBtn');
    setBusy(button, true);
    try {
      // Confirm the current passcode by signing in with it again
      try {
        await api.signIn(current, api.remembered());
      } catch (err) {
        if (err.code === 'NETWORK' || err.status === 429) throw err;
        setFieldError('currentPasscodeInput', 'currentPasscodeError', 'That’s not the current passcode');
        $('currentPasscodeInput').focus();
        return;
      }
      await api.updatePassword(next);
      closeModal('changePasscodeModalOverlay');
      showToast('Passcode updated. Share the new one with the other admins.', 'success');
    } catch (err) {
      if (err.status === 422) {
        setFieldError('newPasscodeInput', 'newPasscodeError', err.message || 'Choose a stronger passcode');
        $('newPasscodeInput').focus();
      } else {
        handleApiError(err);
      }
    } finally {
      setBusy(button, false);
    }
  }

  async function promptForAdmin() {
    const result = await openDialog({
      title: state.activeAdmin ? 'Who is recording entries?' : 'Who’s using the ledger?',
      text: 'Your name is saved with every entry so the track record shows who changed what.',
      confirmLabel: 'Save name',
      input: { label: 'Your name', value: state.activeAdmin, placeholder: 'e.g. Hamza', validate: requireName }
    });
    if (result) {
      saveAdmin(result.value);
      showToast(`Recording as ${state.activeAdmin}`, 'success');
    }
  }

  // ==========================================================================
  // EXPORT / BACKUP / RESTORE
  // ==========================================================================
  function csvCell(value) {
    const s = String(value ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const today = () => todayISO();

  function exportCSV() {
    if (!state.teams.length) {
      showToast('There\'s nothing to export yet', 'warning');
      return;
    }
    const header = ['Team', 'Side', 'WhatsApp', 'Balance (PKR)', 'Status', 'Lifetime charged (PKR)', 'Lifetime settled (PKR)', 'Note', 'Entries', 'Last updated'];
    const rows = state.teams.map((t) => {
      const life = lifetimeTotals(t);
      return [t.name, COPY[t.category].side, t.whatsapp, t.amount, STATUS_LABELS[t.status], life.charged, life.settled, t.notes, t.history.length, stamp(t.updatedAt)];
    });
    const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    downloadFile(csv, `Zenith-Hisaab-balances-${today()}.csv`, 'text/csv;charset=utf-8');
    showToast('Balances exported', 'success');
  }

  function exportHistoryCSV() {
    const rows = [];
    state.teams.forEach((t) => {
      t.history.forEach((h) => {
        rows.push({ ts: h.timestamp, cells: [formatDate(h.timestamp), formatTime(h.timestamp), t.name, COPY[t.category].side, entryLabel(h, t.category), entrySign(h) * h.amount, h.resultingBalance ?? '', h.adminName, h.note] });
      });
    });
    if (!rows.length) {
      showToast('There\'s no history to export yet', 'warning');
      return;
    }
    rows.sort((a, b) => b.ts - a.ts);
    const header = ['Date', 'Time', 'Team', 'Side', 'Entry', 'Change (PKR)', 'Balance after (PKR)', 'Recorded by', 'Note'];
    const csv = '﻿' + [header, ...rows.map((r) => r.cells)].map((r) => r.map(csvCell).join(',')).join('\r\n');
    downloadFile(csv, `Zenith-Hisaab-history-${today()}.csv`, 'text/csv;charset=utf-8');
    showToast(`Exported ${plural(rows.length, 'entry', 'entries')}`, 'success');
  }

  /** Every day anyone worked, with what it paid and when it was paid. */
  async function exportSalaryCSV() {
    if (state.payroll.missing) {
      showToast(describeError({ code: 'PGRST202' }, 'payroll'), 'warning');
      return;
    }
    let data;
    try {
      data = payrollFromServer(await api.fetchPayroll(null));
    } catch (err) {
      handleApiError(err, { context: 'payroll' });
      return;
    }
    if (!data.sessions.length) {
      showToast('No sessions have been logged yet', 'warning');
      return;
    }
    const people = new Map(data.staff.map((s, i) => [s.id, { name: s.name, order: i }]));
    const paidOn = new Map(data.payouts.map((p) => [p.id, p.createdAt]));
    const rows = data.sessions
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date) || (people.get(a.staffId)?.order ?? 0) - (people.get(b.staffId)?.order ?? 0))
      .map((r) => {
        const paid = r.payoutId ? paidOn.get(r.payoutId) : 0;
        return [r.date, weekdayFmt.format(dayDate(r.date)), people.get(r.staffId)?.name || '', r.sessions, r.rate, r.sessions * r.rate, r.payoutId ? 'Paid' : 'Unpaid', paid ? formatDate(paid) : '', r.adminName];
      });
    const header = ['Date', 'Day', 'Person', 'Sessions', 'Rate (PKR)', 'Amount (PKR)', 'Status', 'Paid on', 'Logged by'];
    const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    downloadFile(csv, `Zenith-Hisaab-salaries-${today()}.csv`, 'text/csv;charset=utf-8');
    showToast(`Exported ${plural(rows.length, 'row')} of salary records`, 'success');
  }

  function backupJSON() {
    const data = {
      app: 'ZenithHisaab',
      version: 3,
      currency: 'PKR',
      exportedAt: new Date().toISOString(),
      teams: snapshot()
    };
    downloadFile(JSON.stringify(data, null, 2), `Zenith-Hisaab-backup-${today()}.json`, 'application/json');
    showToast('Backup downloaded', 'success');
  }

  function restoreJSON(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      let teams;
      try {
        const json = JSON.parse(e.target.result);
        teams = Array.isArray(json) ? json : json?.teams;
        if (!Array.isArray(teams)) throw new Error('No teams array');
        teams = teams.map(normalizeTeam);
      } catch (err) {
        showToast('That file isn\'t a valid Hisaab backup', 'danger');
        return;
      }
      const result = await openDialog({
        title: 'Restore this backup?',
        text: `This replaces the ${plural(state.teams.length, 'team')} in the ledger, for every admin, with ${plural(teams.length, 'team')} from “${file.name}”.`,
        tone: 'danger',
        confirmLabel: 'Replace ledger'
      });
      if (!result) return;
      const snap = snapshot();
      const { ok } = await mutate(null, () => api.restore(teams, true));
      if (!ok) return;
      state.openHistory.clear();
      showToast(`Restored ${plural(teams.length, 'team')}`, 'success', {
        label: 'Undo',
        onClick: async () => {
          const undo = await mutate(null, () => api.restore(snap, true));
          if (undo.ok) showToast('Previous ledger restored', 'success');
        }
      });
    };
    reader.onerror = () => showToast('Could not read that file', 'danger');
    reader.readAsText(file);
  }

  async function clearAll() {
    if (!state.teams.length) {
      showToast('The ledger is already empty', 'info');
      return;
    }
    const result = await openDialog({
      title: 'Clear the team ledger?',
      text: `All ${plural(state.teams.length, 'team')} and their history will be deleted for every admin. Salaries aren’t touched. Download a backup first if you might need them.`,
      tone: 'danger',
      confirmLabel: 'Clear team ledger'
    });
    if (!result) return;
    const snap = snapshot();
    const { ok } = await mutate(null, () => api.clearAll());
    if (!ok) return;
    state.openHistory.clear();
    showToast('Team ledger cleared', 'warning', {
      label: 'Undo',
      onClick: async () => {
        const undo = await mutate(null, () => api.restore(snap, true));
        if (undo.ok) showToast('Records restored', 'success');
      }
    });
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================
  function initEvents() {
    // Header: the main button adds a team, or logs sessions on the salaries view
    const newEntry = () => {
      if (state.view === 'salaries') openLogModal();
      else openAddTeamModal(state.activeTab === 'payable' ? 'PAYABLE' : 'RECEIVABLE');
    };
    $('openAddTeamModalBtn').addEventListener('click', newEntry);
    document.querySelectorAll('.view-tab[data-view]').forEach((btn) => {
      btn.addEventListener('click', () => setView(btn.dataset.view));
    });
    $('adminChip').addEventListener('click', promptForAdmin);
    $('headerLockBtn').addEventListener('click', () => lockLedger());

    const toolsWrap = $('toolsMenuWrap');
    const toolsBtn = $('toolsDropdownBtn');
    toolsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willOpen = !toolsWrap.classList.contains('is-open');
      closeMenus();
      toolsWrap.classList.toggle('is-open', willOpen);
      toolsBtn.setAttribute('aria-expanded', String(willOpen));
    });
    $('toolsDropdownMenu').addEventListener('click', (e) => {
      if (e.target.closest('.menu-item')) closeMenus();
    });

    $('exportCsvBtn').addEventListener('click', exportCSV);
    $('exportHistoryCsvBtn').addEventListener('click', exportHistoryCSV);
    $('exportSalaryCsvBtn').addEventListener('click', exportSalaryCSV);
    $('printReportBtn').addEventListener('click', () => setTimeout(() => window.print(), 50));
    $('backupDataBtn').addEventListener('click', backupJSON);
    $('clearAllDataBtn').addEventListener('click', clearAll);
    $('changePasscodeBtn').addEventListener('click', openChangePasscodeModal);

    const fileInput = $('restoreFileInput');
    $('restoreDataBtn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) restoreJSON(file);
      e.target.value = '';
    });

    // Tabs
    document.querySelectorAll('.toolbar .seg[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => setTab(btn.dataset.tab));
    });

    // Search & filters
    const search = $('searchInput');
    const clearSearch = $('clearSearchBtn');
    const syncSearchUI = () => {
      clearSearch.hidden = !search.value;
      $('searchKbd').hidden = Boolean(search.value);
    };
    search.addEventListener('input', () => {
      state.searchQuery = search.value;
      syncSearchUI();
      renderTables();
    });
    clearSearch.addEventListener('click', () => {
      search.value = '';
      state.searchQuery = '';
      syncSearchUI();
      renderTables();
      search.focus();
    });
    $('statusFilter').addEventListener('change', (e) => {
      state.statusFilter = e.target.value;
      renderTables();
    });
    $('sortFilter').addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderTables();
    });

    // Ledger: one delegated listener for every row/sheet button
    $('ledgerRoot').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const teamId = btn.closest('tr.row')?.dataset.id;
      switch (btn.dataset.action) {
        case 'add': openAddTeamModal(btn.dataset.category); break;
        case 'adjust': openAdjustModal(teamId, btn.dataset.type); break;
        case 'history': toggleHistory(teamId); break;
        case 'copy': copyNumber(teamId); break;
        case 'menu':
          e.stopPropagation();
          openRowMenu(btn, teamId, e.detail === 0);
          break;
        case 'clear-filters':
          search.value = '';
          state.searchQuery = '';
          state.statusFilter = 'ALL';
          $('statusFilter').value = 'ALL';
          syncSearchUI();
          renderTables();
          break;
      }
    });

    $('rowMenu').addEventListener('click', (e) => {
      const item = e.target.closest('[data-row-action]');
      if (item && !item.disabled) handleRowMenuAction(item.dataset.rowAction);
    });

    // Salaries: one delegated listener for the register
    $('payrollRoot').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || btn.disabled) return;
      const staffId = btn.closest('tr.row')?.dataset.staff;
      switch (btn.dataset.action) {
        case 'add-staff': openStaffModal(); break;
        case 'pay-all': payEveryone(); break;
        case 'pay': payPerson(staffId); break;
        case 'log-day': openLogModal(btn.dataset.date, staffId); break;
        case 'staff-history': toggleStaffHistory(staffId); break;
        case 'staff-menu':
          e.stopPropagation();
          openStaffMenu(btn, staffId, e.detail === 0);
          break;
        case 'retry-payroll':
          state.payroll.failed = false;
          renderPayroll();
          loadPayroll();
          break;
      }
    });

    $('staffMenu').addEventListener('click', (e) => {
      const item = e.target.closest('[data-staff-action]');
      if (item && !item.disabled) handleStaffMenuAction(item.dataset.staffAction);
    });

    // Close menus on outside click / scroll / width change
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu') && !e.target.closest('[data-action="menu"], [data-action="staff-menu"]') && !e.target.closest('#toolsDropdownBtn')) closeMenus();
    });
    // Only a width change can strand a fixed-position menu (mobile URL bars fire height-only resizes)
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth !== lastWidth && openFloatingMenu()) closeMenus();
      lastWidth = window.innerWidth;
    });
    window.addEventListener('scroll', () => { if (openFloatingMenu()) closeMenus(); }, { passive: true });

    // Modals: close buttons + backdrop
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) closeModal(overlay.id);
      });
      overlay.querySelectorAll('[data-close]').forEach((btn) => {
        btn.addEventListener('click', () => closeModal(overlay.id));
      });
    });

    // Team form
    $('teamForm').addEventListener('submit', handleTeamFormSubmit);
    ['teamName', 'teamContact', 'teamAmount', 'teamAdminName'].forEach((k) => {
      $(`${k}Input`).addEventListener('input', () => setFieldError(`${k}Input`, `${k}Error`, ''));
    });

    // Adjust form
    $('adjustForm').addEventListener('submit', handleAdjustFormSubmit);
    $('adjustTypeDeduct').addEventListener('click', () => {
      state.adjust.type = 'DECREMENT';
      renderAdjustType();
      $('adjustAmountInput').focus();
    });
    $('adjustTypeAdd').addEventListener('click', () => {
      state.adjust.type = 'INCREMENT';
      renderAdjustType();
      $('adjustAmountInput').focus();
    });
    $('adjustAmountInput').addEventListener('input', () => {
      setFieldError('adjustAmountInput', 'adjustAmountError', '');
      updateAdjustPreview();
    });
    $('adjustAdminNameInput').addEventListener('input', () => setFieldError('adjustAdminNameInput', 'adjustAdminError', ''));
    document.querySelectorAll('.chip[data-amt]').forEach((chip) => {
      chip.addEventListener('click', () => {
        $('adjustAmountInput').value = chip.dataset.amt;
        setFieldError('adjustAmountInput', 'adjustAmountError', '');
        updateAdjustPreview();
      });
    });
    $('fullBalanceChip').addEventListener('click', () => {
      const team = findTeam(state.adjust.teamId);
      if (!team) return;
      $('adjustAmountInput').value = team.amount;
      setFieldError('adjustAmountInput', 'adjustAmountError', '');
      updateAdjustPreview();
    });
    document.querySelectorAll('.chip[data-method]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const input = $('adjustReasonInput');
        const method = `Via ${chip.dataset.method}`;
        const current = input.value.trim();
        if (!current || /^Via [^—]+$/.test(current)) input.value = method;
        else if (/^Via [^—]+ — /.test(current)) input.value = current.replace(/^Via [^—]+ — /, `${method} — `);
        else input.value = `${method} — ${current}`;
      });
    });

    // Log sessions
    $('logForm').addEventListener('submit', handleLogSubmit);
    $('logPrevDayBtn').addEventListener('click', () => changeLogDate(shiftDay(state.log.date, -1)));
    $('logNextDayBtn').addEventListener('click', () => changeLogDate(shiftDay(state.log.date, 1)));
    $('logTodayBtn').addEventListener('click', () => changeLogDate(todayISO()));
    $('logDateInput').addEventListener('change', (e) => {
      if (isValidDay(e.target.value)) changeLogDate(e.target.value);
      else e.target.value = state.log.date;
    });
    const logList = $('logList');
    logList.addEventListener('click', (e) => {
      const step = e.target.closest('[data-step]');
      if (!step || step.disabled) return;
      const staffId = step.closest('.log-row').dataset.staff;
      setLogCount(staffId, (state.log.counts.get(staffId) || 0) + Number(step.dataset.step));
    });
    // Typing updates the totals as you go; the field is tidied when you leave it
    logList.addEventListener('input', (e) => {
      const row = e.target.closest('.log-row');
      if (row) setLogCount(row.dataset.staff, e.target.value, { rewrite: false });
    });
    logList.addEventListener('change', (e) => {
      const row = e.target.closest('.log-row');
      if (row) setLogCount(row.dataset.staff, e.target.value);
    });
    logList.addEventListener('focusin', (e) => {
      if (e.target.matches('input')) e.target.select();
    });
    $('logAdminNameInput').addEventListener('input', () => setFieldError('logAdminNameInput', 'logAdminError', ''));

    // Add / edit person
    $('staffForm').addEventListener('submit', handleStaffSubmit);
    ['staffName', 'staffRate'].forEach((k) => {
      $(`${k}Input`).addEventListener('input', () => setFieldError(`${k}Input`, `${k}Error`, ''));
    });

    // Dialog & passcode
    $('dialogForm').addEventListener('submit', handleDialogSubmit);
    $('dialogInput').addEventListener('input', () => setFieldError('dialogInput', 'dialogError', ''));
    $('changePasscodeForm').addEventListener('submit', handleChangePasscodeSubmit);
    ['currentPasscode', 'newPasscode', 'confirmPasscode'].forEach((k) => {
      $(`${k}Input`).addEventListener('input', () => setFieldError(`${k}Input`, `${k}Error`, ''));
    });

    // Gate
    $('adminGateForm').addEventListener('submit', handleGateUnlockSubmit);
    $('toggleGateEyeBtn').addEventListener('click', toggleGatePasswordVisibility);
    $('gatePasscodeInput').addEventListener('input', () => {
      showGateMessage('');
      $('gatePasscodeInput').classList.remove('is-invalid');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (isLocked()) return;
      if (e.key === 'Escape') {
        const floating = openFloatingMenu();
        if (floating || $('toolsMenuWrap').classList.contains('is-open')) {
          const anchor = floating?.anchor;
          closeMenus();
          anchor?.focus();
          return;
        }
        if (closeTopModal()) return;
        if (document.activeElement === search && search.value) clearSearch.click();
        return;
      }
      if (modalStack.length || isTyping(document.activeElement) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/' && state.view === 'teams') {
        e.preventDefault();
        search.focus();
        search.select();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        newEntry();
      }
    });

    // Keep in step with other admins: poll while visible, and refresh when the tab comes back
    const canRefresh = () => !isLocked() && state.loaded && document.visibilityState === 'visible' && !modalStack.length && !openFloatingMenu();
    setInterval(() => { if (canRefresh()) refreshAll(); }, POLL_INTERVAL);
    document.addEventListener('visibilitychange', () => { if (canRefresh()) refreshAll(); });
    setInterval(renderSyncLabel, MINUTE);
  }

  // ==========================================================================
  // INIT
  // ==========================================================================
  function init() {
    loadPreferences();
    initEvents();
    renderDates();
    renderAdminChip();
    renderSyncLabel();
    renderAll();
    bootAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
