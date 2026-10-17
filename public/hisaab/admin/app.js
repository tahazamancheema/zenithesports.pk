/**
 * ZENITH HISAAB — private ledger for Zenith Esports
 * Tracks what teams owe Zenith (scrim fees, entries) and what Zenith owes teams (prizes, refunds) in PKR.
 * Data lives in Supabase (see supabase/hisaab.sql); every change is logged with the admin's name.
 * Only UI preferences (your name, the open tab) are kept in this browser.
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
  const MIN_PASSCODE_LENGTH = 8;
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
  const state = {
    teams: [],
    loaded: false,
    activeAdmin: '',
    activeTab: 'receivable', // 'receivable' | 'payable' | 'split'
    searchQuery: '',
    statusFilter: 'ALL',
    sortBy: 'amount-desc',
    openHistory: new Set(),
    adjust: { teamId: null, type: 'DECREMENT' },
    menuTeamId: null,
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
      clearAll: () => rpc('hisaab_clear_all', {})
    };
  })();

  function describeError(err) {
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
  function handleApiError(err, { quiet = false } = {}) {
    console.error(err);
    if (err?.code === 'SESSION' || (err?.status === 401 && err?.code !== 'NETWORK')) {
      lockLedger('Your session has ended. Enter the passcode to continue.');
      return;
    }
    if (!quiet) showToast(describeError(err), 'danger');
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

  /** Show a button as busy while a change is saved, then reload the ledger from the server. */
  async function mutate(button, action) {
    setBusy(button, true);
    try {
      const result = await action();
      await loadLedger({ quiet: true });
      return { ok: true, result };
    } catch (err) {
      handleApiError(err);
      // The server knows something we don't (another admin's change) — pull the latest numbers
      if (['ZH001', 'ZH002', 'ZH003', '23505'].includes(err?.code)) await loadLedger({ quiet: true });
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
  }

  function renderOverview() {
    let rec = 0, recCount = 0, pay = 0, payCount = 0, collected = 0, paidOut = 0, entries = 0, lastTs = 0;

    for (const t of state.teams) {
      const life = lifetimeTotals(t);
      entries += t.history.length;
      if (t.history[0]) lastTs = Math.max(lastTs, t.history[0].timestamp);
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

    const net = rec - pay;

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
      ? 'More is owed to us than we owe'
      : net < 0
        ? 'We owe more than is owed to us'
        : 'Incoming and outgoing balance out';

    const total = rec + pay;
    $('splitIn').style.width = total ? `${(rec / total) * 100}%` : '0%';
    $('splitOut').style.width = total ? `${(pay / total) * 100}%` : '0%';

    $('receivableTableTotalDisplay').textContent = formatPKR(rec);
    $('payableTableTotalDisplay').textContent = formatPKR(pay);
    $('tabReceivableBadge').textContent = recCount;
    $('tabPayableBadge').textContent = payCount;

    if (!state.loaded) {
      $('overviewNote').textContent = 'Loading the ledger…';
      return;
    }
    const parts = [`<b>${plural(state.teams.length, 'team')}</b> on the books`, `<b>${plural(entries, 'entry', 'entries')}</b>`];
    if (lastTs) parts.push(`last entry ${relativeTime(lastTs).toLowerCase()}`);
    $('overviewNote').innerHTML = parts.join(' · ');
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

  function loadingStateHTML() {
    return `
      <span class="empty-glyph"><span class="spinner spinner-lg" aria-hidden="true"></span></span>
      <h3>Loading the ledger…</h3>
      <p>Fetching the latest balances.</p>`;
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

  function closeMenus() {
    const menu = $('rowMenu');
    if (menu && !menu.hidden) {
      menu.hidden = true;
      menu.anchor?.setAttribute('aria-expanded', 'false');
      state.menuTeamId = null;
    }
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
    renderAll();
    loadLedger();
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

  const today = () => new Date().toISOString().slice(0, 10);

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
      title: 'Clear every record?',
      text: `All ${plural(state.teams.length, 'team')} and their history will be deleted for every admin. Download a backup first if you might need them.`,
      tone: 'danger',
      confirmLabel: 'Clear everything'
    });
    if (!result) return;
    const snap = snapshot();
    const { ok } = await mutate(null, () => api.clearAll());
    if (!ok) return;
    state.openHistory.clear();
    showToast('All records cleared', 'warning', {
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
    // Header
    $('openAddTeamModalBtn').addEventListener('click', () => {
      openAddTeamModal(state.activeTab === 'payable' ? 'PAYABLE' : 'RECEIVABLE');
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

    // Close menus on outside click / scroll / width change
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.menu') && !e.target.closest('[data-action="menu"]') && !e.target.closest('#toolsDropdownBtn')) closeMenus();
    });
    // Only a width change can strand the fixed-position row menu (mobile URL bars fire height-only resizes)
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth !== lastWidth && !$('rowMenu').hidden) closeMenus();
      lastWidth = window.innerWidth;
    });
    window.addEventListener('scroll', () => { if (!$('rowMenu').hidden) closeMenus(); }, { passive: true });

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
        if (!$('rowMenu').hidden || $('toolsMenuWrap').classList.contains('is-open')) {
          const anchor = $('rowMenu').anchor;
          closeMenus();
          anchor?.focus();
          return;
        }
        if (closeTopModal()) return;
        if (document.activeElement === search && search.value) clearSearch.click();
        return;
      }
      if (modalStack.length || isTyping(document.activeElement) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') {
        e.preventDefault();
        search.focus();
        search.select();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openAddTeamModal(state.activeTab === 'payable' ? 'PAYABLE' : 'RECEIVABLE');
      }
    });

    // Keep in step with other admins: poll while visible, and refresh when the tab comes back
    const canRefresh = () => !isLocked() && state.loaded && document.visibilityState === 'visible' && !modalStack.length && $('rowMenu').hidden;
    setInterval(() => { if (canRefresh()) loadLedger({ quiet: true }); }, POLL_INTERVAL);
    document.addEventListener('visibilitychange', () => { if (canRefresh()) loadLedger({ quiet: true }); });
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
