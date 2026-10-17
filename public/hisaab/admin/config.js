/**
 * Zenith Hisaab — connection settings.
 *
 * supabaseKey: Supabase Dashboard → Project Settings → API Keys → the "anon public"
 * (or "publishable") key. It is meant to be public — the main site already ships it.
 * The ledger itself is protected by the Hisaab login and row-level security
 * (see supabase/hisaab.sql). Never put the service_role / secret key here.
 */
window.HISAAB_CONFIG = {
  supabaseUrl: 'https://tzxvmmmxxcaiocmeejng.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eHZtbW14eGNhaW9jbWVlam5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzExMjMsImV4cCI6MjA5MTk0NzEyM30.z2rAj3HbpGTaY9mWpxPrjrYVlFPNd7zEA02BMcbjg_0',
  loginEmail: 'hisaab@zenithesports.pk'
};
