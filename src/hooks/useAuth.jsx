import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/config';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileUidRef  = useRef(null);
  const mountedRef     = useRef(true);
  const userDocRef     = useRef(null);   // mirrors userDoc so closures always see fresh value
  const lastActivityRef = useRef(Date.now());

  const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 hour

  // ── fetch profile row ──────────────────────────────────────────────────────
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

  // ── public helper so profile page can force a refresh ─────────────────────
  const refreshProfile = async () => {
    if (!profileUidRef.current) return;
    const doc = await fetchProfile(profileUidRef.current);
    if (mountedRef.current) { userDocRef.current = doc; setUserDoc(doc); }
  };

  const setUserDocSynced = (doc) => { userDocRef.current = doc; setUserDoc(doc); };

  useEffect(() => {
    mountedRef.current = true;

    // Hard-limit: if nothing resolves in 4 s, stop the loading spinner so
    // at minimum the LOGIN button becomes visible.
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('[auth] safety timeout — forcing loading=false');
        setLoading(false);
      }
    }, 4000);

    // ── Phase 1: read persisted session from localStorage immediately ─────────
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

    // ── Phase 2: subscribe to future changes ──────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        const incomingUid = session?.user?.id ?? null;

        // Token rotations for the same user — just update tokens, keep profile
        if (event === 'TOKEN_REFRESHED' && incomingUid === profileUidRef.current) {
          if (session?.user) setUser(session.user);
          return;
        }

        profileUidRef.current = incomingUid;

        if (incomingUid) {
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

    // ── Phase 3: Re-validate session when tab becomes visible ─────────────────
    // Light check — only re-fetches profile if the user identity actually changed.
    // Avoids a full profile round-trip on every focus event.
    const revalidateSession = async () => {
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
          // Same user — refresh token object, and recover profile if it was lost
          // (e.g. tab opened before initial fetch completed → isAdmin was false)
          setUser(session.user);
          if (!userDocRef.current) {
            const doc = await fetchProfile(uid);
            if (mountedRef.current) setUserDocSynced(doc);
          }
        }
      } catch (err) {
        console.warn('[auth] revalidate:', err.message);
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && mountedRef.current) {
        revalidateSession();
      }
    };
    const handleFocus = () => {
      if (mountedRef.current) revalidateSession();
    };

    // ── Phase 4: Inactivity auto-logout ──────────────────────────────────────
    const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    const updateActivity = () => { lastActivityRef.current = Date.now(); };
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, updateActivity, { passive: true }));

    const inactivityTimer = setInterval(() => {
      if (!mountedRef.current || !profileUidRef.current) return;
      if (Date.now() - lastActivityRef.current >= INACTIVITY_LIMIT) {
        supabase.auth.signOut();
      }
    }, 60 * 1000);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
      clearInterval(inactivityTimer);
      subscription.unsubscribe();
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, updateActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
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
