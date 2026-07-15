import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../supabase/config';
import { signOut } from '../supabase/auth';

const AuthContext = createContext();

// ── Inactivity policy ─────────────────────────────────────────────
// Sessions expire after 3 hours without any user interaction.
const ACTIVITY_KEY = 'zenith-last-activity';
const INACTIVITY_LIMIT_MS = 3 * 60 * 60 * 1000; // 3 hours
const ACTIVITY_WRITE_THROTTLE_MS = 30 * 1000;   // persist at most every 30s
const INACTIVITY_CHECK_MS = 60 * 1000;          // evaluate every minute

function stampActivity() {
  try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch {}
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileUidRef = useRef(null);
  const mountedRef    = useRef(true);
  const userDocRef    = useRef(null);

  async function fetchProfile(uid) {
    if (!uid) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', uid)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.warn('[auth] profile fetch:', error.message);
        return null;
      }
      return data || null;
    } catch (err) {
      console.warn('[auth] profile threw:', err.message);
      return null;
    }
  }

  const setUserDocSynced = (doc) => { userDocRef.current = doc; setUserDoc(doc); };

  const refreshProfile = useCallback(async () => {
    if (!profileUidRef.current) return;
    const doc = await fetchProfile(profileUidRef.current);
    if (mountedRef.current) setUserDocSynced(doc);
  }, []);

  // Silently refresh the Supabase access token. Called proactively so the
  // 1-hour JWT never actually hits its expiry while the app is open.
  const proactiveRefresh = useCallback(async () => {
    if (!profileUidRef.current) return;
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.warn('[auth] proactive refresh failed:', error.message);
      } else if (data?.user && mountedRef.current) {
        setUser(data.user);
      }
    } catch (err) {
      console.warn('[auth] proactive refresh threw:', err.message);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Fail-safe: stop the loading spinner after 4s no matter what
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) setLoading(false);
    }, 4000);

    // ── Phase 1: read persisted session ──────────────────────────────────────
    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.warn('[auth] getSession error:', error.message);
        if (!mountedRef.current) return;

        const currentUser = session?.user ?? null;
        profileUidRef.current = currentUser?.id ?? null;

        if (currentUser) {
          setUser(currentUser);
          const doc = await fetchProfile(currentUser.id);
          if (mountedRef.current) setUserDocSynced(doc);
        } else {
          setUser(null);
          setUserDocSynced(null);
        }
      } catch (err) {
        console.warn('[auth] init error:', err.message);
      } finally {
        clearTimeout(safetyTimer);
        if (mountedRef.current) setLoading(false);
      }
    }

    initSession();

    // ── Phase 2: subscribe to auth state changes ──────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        const incomingUid = session?.user?.id ?? null;

        // Token rotated — just update the user object, no profile re-fetch needed
        if (event === 'TOKEN_REFRESHED' && incomingUid === profileUidRef.current) {
          if (session?.user) setUser(session.user);
          return;
        }

        profileUidRef.current = incomingUid;

        if (incomingUid) {
          if (event === 'SIGNED_IN') stampActivity(); // fresh session → fresh clock
          setUser(session.user);
          const doc = await fetchProfile(incomingUid);
          if (mountedRef.current) setUserDocSynced(doc);
        } else {
          setUser(null);
          setUserDocSynced(null);
        }

        clearTimeout(safetyTimer);
        if (mountedRef.current) setLoading(false);
      }
    );

    // ── Phase 3: revalidate + proactive refresh on tab focus / visibility ─────
    // Proactively refresh the access token when the tab comes back into view so
    // the 1-hour JWT never quietly expires while the tab is in the background.
    const revalidateAndRefresh = async () => {
      if (!mountedRef.current) return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mountedRef.current) return;

        const uid = session?.user?.id ?? null;

        if (uid !== profileUidRef.current) {
          // Identity changed (signed out in another tab, or new login)
          profileUidRef.current = uid;
          if (uid) {
            setUser(session.user);
            const doc = await fetchProfile(uid);
            if (mountedRef.current) setUserDocSynced(doc);
          } else {
            setUser(null);
            setUserDocSynced(null);
          }
        } else if (uid && session?.user) {
          setUser(session.user);
          if (!userDocRef.current) {
            const doc = await fetchProfile(uid);
            if (mountedRef.current) setUserDocSynced(doc);
          }
          // Proactively refresh if token expires within the next 10 minutes
          const expiresAt = session.expires_at; // Unix seconds
          if (expiresAt) {
            const secsLeft = expiresAt - Math.floor(Date.now() / 1000);
            if (secsLeft < 600) proactiveRefresh();
          }
        }
      } catch (err) {
        console.warn('[auth] revalidate:', err.message);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') revalidateAndRefresh();
    };
    const handleFocus = () => revalidateAndRefresh();

    // ── Phase 4: Periodic proactive refresh every 45 minutes ─────────────────
    // Supabase JWTs expire in 1 hour. Refreshing every 45 min ensures we always
    // have a valid token even if the tab is left open and untouched.
    const refreshInterval = setInterval(() => {
      if (profileUidRef.current && mountedRef.current) proactiveRefresh();
    }, 45 * 60 * 1000);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      clearInterval(refreshInterval);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
    };
  }, [proactiveRefresh]);

  // ── Inactivity expiry: force sign-out after 3h without interaction ────────
  useEffect(() => {
    let lastWrite = 0;
    const markActivity = () => {
      if (!profileUidRef.current) return;
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_WRITE_THROTTLE_MS) return;
      lastWrite = now;
      stampActivity();
    };

    let expiring = false;
    const expireIfIdle = async () => {
      if (!profileUidRef.current || expiring) return;
      let last = 0;
      try { last = Number(localStorage.getItem(ACTIVITY_KEY)) || 0; } catch {}
      if (!last) { stampActivity(); return; } // first check of this session — start the clock
      if (Date.now() - last > INACTIVITY_LIMIT_MS) {
        expiring = true;
        try {
          await signOut(); // clears zenith-* keys incl. the activity stamp
          toast('Your session expired after 3 hours of inactivity. Please sign in again.', { icon: '🔒', duration: 8000 });
        } catch (err) {
          console.warn('[auth] inactivity sign-out failed:', err.message);
        } finally {
          expiring = false;
        }
      }
    };

    const activityEvents = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((ev) => window.addEventListener(ev, markActivity, { passive: true }));

    const checkTimer = setInterval(expireIfIdle, INACTIVITY_CHECK_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') expireIfIdle(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, markActivity));
      clearInterval(checkTimer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const isAdmin = userDoc?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, isAdmin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
