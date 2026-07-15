-- ─────────────────────────────────────────
-- ZENITH ESPORTS SUPABASE SCHEMA (IDEMPOTENT)
-- ─────────────────────────────────────────
-- You can run this script multiple times safely.
-- It will add missing columns and update functions without deleting data.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user',
  display_name text,
  team_name text,
  logo_url text,
  whatsapp_number text,
  city text,
  player_ids text[] default '{}',
  player_igns text[] default '{}',
  captain_discord text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add missing columns to users if they don't exist
alter table public.users add column if not exists whatsapp_number text;
alter table public.users add column if not exists city text;
alter table public.users add column if not exists player_ids text[] default '{}';
alter table public.users add column if not exists player_igns text[] default '{}';
alter table public.users add column if not exists captain_discord text;

-- 2. TOURNAMENTS TABLE
create table if not exists public.tournaments (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  start_date timestamp with time zone,
  registration_deadline timestamp with time zone,
  status text default 'upcoming',
  max_teams integer default 64,
  prize_pool text,
  game text default 'PUBG Mobile',
  poster_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add missing columns to tournaments if they don't exist
alter table public.tournaments add column if not exists registration_open_date timestamp with time zone;
alter table public.tournaments add column if not exists is_completed boolean default false;
alter table public.tournaments add column if not exists briefing text;
alter table public.tournaments add column if not exists schedule jsonb default '[]';
alter table public.tournaments add column if not exists roadmap jsonb default '[]';

-- 3. REGISTRATIONS TABLE
create table if not exists public.registrations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  tournament_id uuid references public.tournaments(id) on delete cascade not null,
  team_name text not null,
  logo_url text,
  whatsapp_number text not null,
  city text,
  player_ids text[] not null,
  status text default 'pending', -- pending, approved, rejected
  group_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add missing columns to registrations if they don't exist
alter table public.registrations add column if not exists real_name text;
alter table public.registrations add column if not exists captain_discord text;
alter table public.registrations add column if not exists player_igns text[] default '{}';
alter table public.registrations add column if not exists screenshot_urls text[] default '{}';

-- 4. ANNOUNCEMENTS TABLE (navbar ticker + landing page intel feed)
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  is_active boolean default true not null,
  is_gold boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now()
);

create index if not exists idx_announcements_active_created
  on public.announcements(is_active, created_at desc);

-- ─────────────────────────────────────────
-- SECURITY (Row Level Security)
-- ─────────────────────────────────────────
alter table public.announcements enable row level security;

drop policy if exists "Active announcements are viewable by everyone." on public.announcements;
create policy "Active announcements are viewable by everyone." on public.announcements
  for select using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert announcements." on public.announcements;
create policy "Admins can insert announcements." on public.announcements
  for insert with check (public.is_admin());

drop policy if exists "Admins can update announcements." on public.announcements;
create policy "Admins can update announcements." on public.announcements
  for update using (public.is_admin());

drop policy if exists "Admins can delete announcements." on public.announcements;
create policy "Admins can delete announcements." on public.announcements
  for delete using (public.is_admin());

alter table public.users enable row level security;
alter table public.tournaments enable row level security;
alter table public.registrations enable row level security;

-- Admin bypass function
create or replace function public.is_admin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─────────────────────────────────────────
-- POLICIES (Drop and Create for idempotency)
-- ─────────────────────────────────────────

-- USERS
drop policy if exists "Users can view their own profile." on public.users;
create policy "Users can view their own profile." on public.users for select using (auth.uid() = id);

drop policy if exists "Admins can view all profiles." on public.users;
create policy "Admins can view all profiles." on public.users for select using (public.is_admin());

drop policy if exists "Users can update their own profile." on public.users;
create policy "Users can update their own profile." on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- SECURITY: block privilege escalation — only admins may change roles/identity
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'You are not allowed to change account roles';
    end if;
    if new.id is distinct from old.id or new.email is distinct from old.email then
      raise exception 'You are not allowed to change identity fields';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists users_prevent_role_escalation on public.users;
create trigger users_prevent_role_escalation
  before update on public.users
  for each row execute procedure public.prevent_role_escalation();

-- Admins can update any profile (role changes still guarded by the
-- prevent_role_escalation trigger, which allows them for admins only).
drop policy if exists "Admins can update all profiles." on public.users;
create policy "Admins can update all profiles." on public.users
  for update using (public.is_admin()) with check (public.is_admin());

-- TOURNAMENTS
drop policy if exists "Tournaments are viewable by everyone." on public.tournaments;
create policy "Tournaments are viewable by everyone." on public.tournaments for select using (true);

drop policy if exists "Admins can insert tournaments." on public.tournaments;
create policy "Admins can insert tournaments." on public.tournaments for insert with check (public.is_admin());

drop policy if exists "Admins can update tournaments." on public.tournaments;
create policy "Admins can update tournaments." on public.tournaments for update using (public.is_admin());

drop policy if exists "Admins can delete tournaments." on public.tournaments;
create policy "Admins can delete tournaments." on public.tournaments for delete using (public.is_admin());

-- REGISTRATIONS
-- NOTE: the old "Anyone can read registrations" policy leaked registrant PII
-- (WhatsApp numbers, real names, player IDs) to the public. Public pages now
-- read from the column-safe view `registrations_public`, and duplicate checks
-- run through the `find_registration_duplicates` RPC below.
drop policy if exists "Anyone can read registrations (for duplication checks)." on public.registrations;

drop policy if exists "Users can view their own registrations." on public.registrations;
create policy "Users can view their own registrations." on public.registrations for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all registrations." on public.registrations;
create policy "Admins can view all registrations." on public.registrations for select using (public.is_admin());

drop policy if exists "Users can insert their own registrations." on public.registrations;
create policy "Users can insert their own registrations." on public.registrations for insert with check (auth.uid() = user_id);

drop policy if exists "Admins can insert registrations." on public.registrations;
create policy "Admins can insert registrations." on public.registrations for insert with check (public.is_admin());

drop policy if exists "Admins can update all registrations." on public.registrations;
create policy "Admins can update all registrations." on public.registrations for update using (public.is_admin());

drop policy if exists "Admins can delete registrations." on public.registrations;
create policy "Admins can delete registrations." on public.registrations for delete using (public.is_admin());

-- Users may edit while pending, and reapply after rejection — nothing else.
drop policy if exists "Users can update their own pending registrations." on public.registrations;
drop policy if exists "Users can edit pending or reapply rejected registrations." on public.registrations;
create policy "Users can edit pending or reapply rejected registrations." on public.registrations
  for update
  using (auth.uid() = user_id and status in ('pending', 'rejected'))
  with check (auth.uid() = user_id and status in ('pending', 'reapplied'));

-- Column-safe public projection for landing/tournament pages (counts, team
-- lists). SECURITY DEFINER on purpose: exposes ONLY these non-PII columns.
drop view if exists public.registrations_public;
create view public.registrations_public as
  select id, tournament_id, user_id, team_name, logo_url, status, group_id, created_at
  from public.registrations;
grant select on public.registrations_public to anon, authenticated;

-- Server-side registration rules: forces status on insert (honours
-- tournaments.auto_approve), validates the registration window, and stops
-- non-admins from reassigning tournament/user/group on update.
create or replace function public.enforce_registration_rules()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  t public.tournaments%rowtype;
begin
  if public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.group_id := null;
    new.rejection_reason := null;
  else
    if new.status not in ('pending', 'reapplied') then
      raise exception 'Invalid status change';
    end if;
    new.tournament_id := old.tournament_id;
    new.user_id := old.user_id;
    new.group_id := old.group_id;
  end if;

  select * into t from public.tournaments where id = new.tournament_id;
  if not found then
    raise exception 'Tournament not found';
  end if;
  if coalesce(t.is_completed, false) then
    raise exception 'This tournament has ended — registration is closed';
  end if;
  if t.registration_open_date is not null and now() < t.registration_open_date then
    raise exception 'Registration has not opened yet';
  end if;
  if t.registration_deadline is not null and now() > t.registration_deadline then
    raise exception 'The registration deadline has passed';
  end if;

  if tg_op = 'INSERT' then
    new.status := case when coalesce(t.auto_approve, false) then 'approved' else 'pending' end;
  end if;

  return new;
end $$;

drop trigger if exists registrations_enforce_rules on public.registrations;
create trigger registrations_enforce_rules
  before insert or update on public.registrations
  for each row execute procedure public.enforce_registration_rules();

-- ─────────────────────────────────────────
-- TRIGGERS & FUNCTIONS
-- ─────────────────────────────────────────

-- OAuth-aware: email signups store `displayName`; Google/OAuth providers
-- supply `full_name` / `name`. Falls back to the email local-part.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'displayName'), ''),
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(new.email, 'player'), '@', 1)
    )
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.users.display_name, excluded.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- STORAGE SETUP
-- ─────────────────────────────────────────

-- Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('ze-posters', 'ze-posters', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('ze-logos', 'ze-logos', true)
on conflict (id) do nothing;

-- ze-proofs is PRIVATE: payment/ID proofs are served to admins via
-- short-lived signed URLs only (see getSignedProofUrl in src/utils/storage.js).
insert into storage.buckets (id, name, public)
values ('ze-proofs', 'ze-proofs', false)
on conflict (id) do nothing;

-- Flip pre-existing deployments to private too (revokes any previously
-- exposed public proof URLs).
update storage.buckets set public = false where id = 'ze-proofs';

-- Enforce size + MIME limits at the storage API level (raster images only)
update storage.buckets
  set file_size_limit = 8388608,  -- 8 MB
      allowed_mime_types = array['image/jpeg','image/jpg','image/png','image/webp']
  where id = 'ze-posters';

update storage.buckets
  set file_size_limit = 5242880,  -- 5 MB
      allowed_mime_types = array['image/jpeg','image/jpg','image/png','image/webp']
  where id in ('ze-logos', 'ze-proofs');

-- ─────────────────────────────────────────
-- STORAGE POLICIES
-- ─────────────────────────────────────────

-- Posters — public buckets serve objects by URL without a SELECT policy;
-- a broad SELECT policy would only enable anonymous listing of every file.
drop policy if exists "Anyone can view posters" on storage.objects;

drop policy if exists "Admins can deploy posters" on storage.objects;
create policy "Admins can deploy posters" on storage.objects for insert with check (bucket_id = 'ze-posters' AND public.is_admin());

drop policy if exists "Admins can alter posters" on storage.objects;
create policy "Admins can alter posters" on storage.objects for update using (bucket_id = 'ze-posters' AND public.is_admin());

drop policy if exists "Admins can purge posters" on storage.objects;
create policy "Admins can purge posters" on storage.objects for delete using (bucket_id = 'ze-posters' AND public.is_admin());

-- Logos — same as posters: no listing policy needed for public URL access.
drop policy if exists "Anyone can view team logos" on storage.objects;

drop policy if exists "Authenticated users can upload logos" on storage.objects;
create policy "Authenticated users can upload logos" on storage.objects for insert with check (bucket_id = 'ze-logos' AND auth.role() = 'authenticated');

drop policy if exists "Users can update their own logos" on storage.objects;
create policy "Users can update their own logos" on storage.objects for update using (bucket_id = 'ze-logos' AND auth.uid() = owner);

drop policy if exists "Admins can delete any logos" on storage.objects;
create policy "Admins can delete any logos" on storage.objects for delete using (bucket_id = 'ze-logos' AND public.is_admin());

-- Proofs (Registration Screenshots) — payment/ID proofs are sensitive:
-- only admins may list/search them via the API (direct URLs stay unguessable).
drop policy if exists "Anyone can view proofs" on storage.objects;
drop policy if exists "Admins can view proofs" on storage.objects;
create policy "Admins can view proofs" on storage.objects for select using (bucket_id = 'ze-proofs' and public.is_admin());

drop policy if exists "Authenticated users can upload proofs" on storage.objects;
create policy "Authenticated users can upload proofs" on storage.objects for insert with check (bucket_id = 'ze-proofs' AND auth.role() = 'authenticated');

drop policy if exists "Admins can delete any proofs" on storage.objects;
create policy "Admins can delete any proofs" on storage.objects for delete using (bucket_id = 'ze-proofs' AND public.is_admin());

-- ─────────────────────────────────────────
-- RPC FUNCTIONS
-- ─────────────────────────────────────────

create or replace function public.get_total_users()
returns integer
language sql
security definer set search_path = public
as $$
  select count(*)::integer from public.users;
$$;

-- Duplicate checks (team name / player ID / IGN) without exposing other
-- teams' registration rows to the client. Case-insensitive. Authenticated only.
create or replace function public.find_registration_duplicates(
  p_tournament_id uuid,
  p_team_name text,
  p_player_ids text[],
  p_player_igns text[],
  p_exclude_reg uuid default null
)
returns jsonb
language plpgsql
stable
security definer set search_path = public
as $$
declare
  v_ids text[];
  v_igns text[];
  v_val text;
begin
  if p_team_name is not null and length(trim(p_team_name)) > 0 then
    if exists (
      select 1 from public.registrations r
      where r.tournament_id = p_tournament_id
        and r.status <> 'rejected'
        and lower(r.team_name) = lower(trim(p_team_name))
        and (p_exclude_reg is null or r.id <> p_exclude_reg)
    ) then
      return jsonb_build_object('type', 'team', 'value', trim(p_team_name));
    end if;
  end if;

  if p_player_ids is not null and array_length(p_player_ids, 1) > 0 then
    select r.player_ids into v_ids from public.registrations r
    where r.tournament_id = p_tournament_id
      and r.status <> 'rejected'
      and r.player_ids && p_player_ids
      and (p_exclude_reg is null or r.id <> p_exclude_reg)
    limit 1;
    if v_ids is not null then
      select pid into v_val from unnest(p_player_ids) pid
      where pid = any(v_ids) limit 1;
      return jsonb_build_object('type', 'id', 'value', v_val);
    end if;
  end if;

  if p_player_igns is not null and array_length(p_player_igns, 1) > 0 then
    select r.player_igns into v_igns from public.registrations r
    where r.tournament_id = p_tournament_id
      and r.status <> 'rejected'
      and exists (
        select 1 from unnest(r.player_igns) x
        join unnest(p_player_igns) y on lower(x) = lower(y)
      )
      and (p_exclude_reg is null or r.id <> p_exclude_reg)
    limit 1;
    if v_igns is not null then
      select ign into v_val from unnest(p_player_igns) ign
      where lower(ign) in (select lower(x) from unnest(v_igns) x) limit 1;
      return jsonb_build_object('type', 'ign', 'value', v_val);
    end if;
  end if;

  return null;
end $$;

revoke all on function public.find_registration_duplicates(uuid, text, text[], text[], uuid) from public, anon;
grant execute on function public.find_registration_duplicates(uuid, text, text[], text[], uuid) to authenticated;

-- Trigger functions must not be callable through the REST RPC surface.
-- (Triggers still fire — EXECUTE is only checked at trigger creation time.)
revoke execute on function public.enforce_registration_rules() from public, anon, authenticated;
revoke execute on function public.prevent_role_escalation() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
-- ─────────────────────────────────────────
-- PERFORMANCE INDEXES (Crucial for Registration Checks)
-- ─────────────────────────────────────────
create index if not exists idx_registrations_user_id on public.registrations(user_id);
create index if not exists idx_registrations_tournament_id on public.registrations(tournament_id);
create index if not exists idx_registrations_team_name on public.registrations(team_name);
create index if not exists idx_registrations_status on public.registrations(status);

-- GIN Indexes for array overlap checks (Duplicate ID/IGN checks)
create index if not exists idx_registrations_player_ids on public.registrations using gin (player_ids);
create index if not exists idx_registrations_player_igns on public.registrations using gin (player_igns);

-- ── ADDITIONAL PERFORMANCE INDEXES ──
create index if not exists idx_tournaments_created_at on public.tournaments(created_at desc);
create index if not exists idx_tournaments_status on public.tournaments(status);
create index if not exists idx_registrations_created_at on public.registrations(created_at desc);

-- ─────────────────────────────────────────
-- REALTIME PUBLICATION
-- ─────────────────────────────────────────
-- postgres_changes subscriptions only deliver events for tables in the
-- supabase_realtime publication (events are RLS-filtered per subscriber).
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['tournaments','registrations','tournament_results','announcements','users']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
