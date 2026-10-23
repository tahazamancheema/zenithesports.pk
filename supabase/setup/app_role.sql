-- ════════════════════════════════════════════════════════════════════════════
-- OPTIONAL, RECOMMENDED: a least-privilege login for the website.
--
-- Run once in the Supabase SQL editor AFTER the zenith migrations, replacing
-- the password placeholder. The role can read/write schema `zenith` only, so
-- the website cannot read public.hisaab_* (ZenithHisaab) or the legacy tables
-- even if its credentials leak. Never commit the real password.
-- ════════════════════════════════════════════════════════════════════════════

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'zenith_app') then
    create role zenith_app login password 'REPLACE-WITH-A-LONG-RANDOM-PASSWORD' noinherit;
  end if;
end $$;

-- Grants + RLS policies for every zenith table (safe to re-run after new migrations).
select zenith.apply_app_role_grants();

-- Fail fast instead of hanging serverless requests: a stuck statement or lock wait ends in
-- seconds, and a transaction left open by a frozen function instance releases its locks.
alter role zenith_app set statement_timeout = '15s';
alter role zenith_app set lock_timeout = '8s';
alter role zenith_app set idle_in_transaction_session_timeout = '20s';

-- Explicitly nothing outside zenith.
revoke all on schema public from zenith_app;
revoke all on all tables in schema public from zenith_app;

-- Then use, in Vercel:
--   DATABASE_URL = postgres://zenith_app.<project-ref>:<password>@<pooler-host>:6543/postgres   (transaction pooler)
--   DATABASE_LISTEN_URL is optional and only used with REALTIME_LISTEN=on (session pooler, port 5432).
