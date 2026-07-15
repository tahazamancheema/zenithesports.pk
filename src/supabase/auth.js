import { supabase } from './config';

export async function signUpWithEmail(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        displayName: displayName,
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email, password) {
  console.log('[auth] Calling supabase.auth.signInWithPassword...');

  const requestPromise = supabase.auth.signInWithPassword({
    email,
    password,
  });
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Network timeout: Supabase did not respond in time. Check your connection or adblocker.')), 10000)
  );

  try {
    const { data, error } = await Promise.race([requestPromise, timeoutPromise]);
    console.log('[auth] signInWithPassword returned', { data, error });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[auth] signInWithPassword threw:', err);
    throw err;
  }
}





/**
 * Send a password-reset email. The link lands on /auth/reset where the
 * recovery session is established and the user sets a new password.
 */
export async function sendPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset`,
  });
  if (error) throw error;
}

/** Set a new password for the currently signed-in (recovery) session. */
export async function updatePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

/**
 * Google OAuth sign-in. Redirects to Google, then back to /auth where
 * detectSessionInUrl completes the session. Requires the Google provider
 * to be enabled in Supabase Dashboard → Authentication → Providers.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth`,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  // Fire network signout but don't wait for it forever
  const requestPromise = supabase.auth.signOut();
  const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout')), 2000));
  
  try {
    await Promise.race([requestPromise, timeoutPromise]);
  } catch (e) {
    console.warn("Sign out network skipped:", e);
  }

  // Forcefully wipe all local storage related to auth keys instantly
  for (const key in localStorage) {
    if (key.startsWith('sb-') || key.startsWith('zenith-')) {
      localStorage.removeItem(key);
    }
  }
}

export function onAuthStateChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return () => data.subscription.unsubscribe();
}
