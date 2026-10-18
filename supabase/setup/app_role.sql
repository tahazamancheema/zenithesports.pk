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

-- Explicitly nothing outside zenith.
revoke all on schema public from zenith_app;
revoke all on all tables in schema public from zenith_app;

-- Then use, in Vercel:
--   DATABASE_URL = postgres://zenith_app.<project-ref>:<password>@<pooler-host>:6543/postgres   (transaction pooler)
--   DATABASE_LISTEN_URL = postgres://zenith_app.<project-ref>:<password>@<pooler-host>:5432/postgres (session pooler, for realtime LISTEN)
