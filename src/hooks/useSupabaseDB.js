import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/config';

/**
 * useSupabaseDB — generic real-time CRUD hook for any Supabase table.
 *
 * Resilience features:
 *  1. SWR: serves stale localStorage cache while fresh data loads
 *  2. Re-fetches on tab visibility + window focus
 *  3. Heartbeat every 30s: refetches if empty/errored, reconnects dead channels
 *  4. Channel reconnect after Supabase token refresh (TOKEN_REFRESHED event)
 *  5. 401 recovery: silently refreshes session and retries the query once
 */
export function useSupabaseDB(tableName, orderByOption = null, filters = []) {
  const filtersKey = JSON.stringify(filters);
  const orderKey   = JSON.stringify(orderByOption);
  const cacheKey   = `zenith_cache_${tableName}_${filtersKey}_${orderKey}`;

  // Views (e.g. registrations_public) can't emit postgres_changes events:
  // subscribe to the underlying table instead, and poll as a fallback since
  // RLS may withhold realtime rows the view would still expose.
  const isView    = tableName.endsWith('_public');
  const eventsTable = isView ? tableName.replace(/_public$/, '') : tableName;

  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [loading, setLoading] = useState(data.length === 0);
  const [error,   setError]   = useState(null);

  const stateRef     = useRef({ data, error, loading });
  const isFirstFetch = useRef(true);
  const channelRef   = useRef(null);

  useEffect(() => {
    stateRef.current = { data, error, loading };
  }, [data, error, loading]);

  // ── Core fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isRetry = false) => {
    if (stateRef.current.data.length === 0) setLoading(true);

    const runQuery = async () => {
      let query = supabase.from(tableName).select('*');

      if (tableName === 'tournaments') {
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      if (filters && filters.length > 0) {
        filters.forEach(([field, op, value]) => {
          if (op === 'eq') query = query.eq(field, value);
        });
      }

      if (orderByOption) {
        query = query.order(orderByOption.field, { ascending: orderByOption.direction === 'asc' });
      }

      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('QUERY_TIMEOUT')), 8000)
      );

      return Promise.race([query, timeout]);
    };

    try {
      let { data: result, error: fetchErr } = await runQuery();

      // 401 / JWT expired — refresh session and retry once
      if (fetchErr?.status === 401 || fetchErr?.message?.includes('JWT')) {
        const { error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr) {
          ({ data: result, error: fetchErr } = await runQuery());
        }
      }

      if (fetchErr) throw fetchErr;

      // Retry once on empty broad tournament query (race condition on first load)
      const isBroadTournaments = tableName === 'tournaments' && (!filters || filters.length === 0);
      if (isFirstFetch.current && (!result || result.length === 0) && isBroadTournaments && !isRetry) {
        console.warn(`useSupabaseDB [${tableName}]: empty on first fetch, retrying…`);
        setTimeout(() => fetchData(true), 1000);
        return;
      }

      const newData = result || [];
      setData(newData);
      setError(null);
      isFirstFetch.current = false;
      setLoading(false);

      try { localStorage.setItem(cacheKey, JSON.stringify(newData)); } catch {}

    } catch (err) {
      console.error(`useSupabaseDB [${tableName}]:`, err.message);

      if (err.message === 'QUERY_TIMEOUT' && !isRetry) {
        fetchData(true);
        return;
      }

      setError(err.message === 'QUERY_TIMEOUT' ? 'Connection slow. Retrying…' : err.message);
      setLoading(false);
      isFirstFetch.current = false;
    }
  }, [tableName, orderKey, filtersKey, cacheKey]); // eslint-disable-line

  // ── Realtime subscription ──────────────────────────────────────────────────
  const subscribeRealtime = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`public:${eventsTable}:${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: eventsTable }, () => fetchData())
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          // Reconnect after 3s (was 10s) — faster recovery
          setTimeout(() => {
            if (document.visibilityState === 'visible') subscribeRealtime();
          }, 3000);
        }
      });

    channelRef.current = channel;
    return channel;
  }, [tableName, fetchData]);

  useEffect(() => {
    fetchData();
    subscribeRealtime();

    // Heartbeat: every 30s refetch if empty/errored; reconnect dead channels.
    // View-backed tables always refetch — realtime can't be relied on for them.
    const heartbeat = setInterval(() => {
      const { data: cur, error: curErr, loading: curLoading } = stateRef.current;
      if (curLoading) return;
      if (isView || cur.length === 0 || curErr) fetchData();
      const ch = channelRef.current;
      if (!ch || ch.state === 'closed' || ch.state === 'errored') subscribeRealtime();
    }, 30000);

    // Re-fetch + reconnect when tab becomes visible (browser may have suspended WS)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData();
        subscribeRealtime();
      }
    };

    const handleFocus = () => fetchData();

    // Reconnect Realtime channel after a token refresh — the old channel's auth
    // header is stale once the JWT rotates, which can silently break postgres_changes.
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        subscribeRealtime();
      }
    });

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(heartbeat);
      authSub.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchData, subscribeRealtime]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const add = useCallback(async (docData) => {
    const { data: newDoc, error: insertErr } = await supabase
      .from(tableName).insert([docData]).select().single();
    if (insertErr) throw insertErr;
    await fetchData();
    return newDoc;
  }, [tableName, fetchData]);

  const update = useCallback(async (id, docData) => {
    const { data: updatedDoc, error: updateErr } = await supabase
      .from(tableName).update(docData).eq('id', id).select().single();
    if (updateErr) throw updateErr;
    await fetchData();
    return updatedDoc;
  }, [tableName, fetchData]);

  const remove = useCallback(async (id) => {
    const { error: deleteErr } = await supabase
      .from(tableName).delete().eq('id', id);
    if (deleteErr) throw deleteErr;
    await fetchData();
  }, [tableName, fetchData]);

  return { data, loading, error, add, update, remove, refetch: fetchData };
}
