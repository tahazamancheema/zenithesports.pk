-- ════════════════════════════════════════════════════════════════════════════
-- Player accounts (Supabase Auth), visual identity for games and tournaments,
-- sponsors, and AntiCheat reporting for every game.
-- Additive only: no existing row is rewritten except the AntiCheat game list
-- when it still holds the original default.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── accounts ───────────────────────────────────────────────────────────────
-- One row per signed-in person. `id` is the Supabase Auth user id. There is
-- deliberately no foreign key into the Supabase-managed schema: this schema
-- never reaches outside `zenith`, and the row is written by the website after
-- it has verified the session with Supabase.

create table zenith.accounts (
  id              uuid primary key,
  email           text not null check (char_length(email) <= 254),
  email_verified  boolean not null default false,
  display_name    text check (char_length(display_name) <= 80),
  avatar_url      text check (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 500)),
  provider        text check (char_length(provider) <= 40),
  status          text not null default 'active' check (status in ('active', 'disabled')),
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now()
);
create index accounts_email on zenith.accounts (lower(email));

alter table zenith.registrations add column account_id uuid references zenith.accounts (id) on delete set null;
create index registrations_account on zenith.registrations (account_id, created_at desc) where account_id is not null;
alter table zenith.lft_profiles add column account_id uuid references zenith.accounts (id) on delete set null;
create index lft_profiles_account on zenith.lft_profiles (account_id) where account_id is not null;

-- Staff sign in through Supabase Auth as well. A staff row is linked to the
-- Supabase user the first time that person signs in with the same verified
-- email. Passwords stay only for local development (STAFF_PASSWORD_LOGIN).
alter table zenith.staff_users alter column password_hash drop not null;
alter table zenith.staff_users add column auth_user_id uuid;
create unique index staff_users_auth_user on zenith.staff_users (auth_user_id) where auth_user_id is not null;

-- ─── visual identity ────────────────────────────────────────────────────────

alter table zenith.files drop constraint files_purpose_check;
alter table zenith.files add constraint files_purpose_check
  check (purpose in ('evidence', 'registration', 'media', 'branding'));

alter table zenith.games
  add column logo_file_id  uuid references zenith.files (id) on delete set null,
  add column cover_file_id uuid references zenith.files (id) on delete set null,
  add column accent        text check (accent is null or accent ~ '^#[0-9a-fA-F]{6}$');

alter table zenith.tournaments
  add column poster_file_id          uuid references zenith.files (id) on delete set null,
  add column logo_file_id            uuid references zenith.files (id) on delete set null,
  add column organizer_name          text not null default 'Zenith Esports' check (char_length(organizer_name) between 1 and 80),
  add column organizer_logo_file_id  uuid references zenith.files (id) on delete set null,
  add column featured                boolean not null default false;

create table zenith.tournament_sponsors (
  id             uuid primary key default gen_random_uuid(),
  tournament_id  uuid not null references zenith.tournaments (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 80),
  tier           text not null default 'partner' check (tier in ('title', 'presenting', 'partner', 'media')),
  url            text check (url is null or (url ~ '^https://' and char_length(url) <= 300)),
  logo_file_id   uuid references zenith.files (id) on delete set null,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);
create index tournament_sponsors_t on zenith.tournament_sponsors (tournament_id, sort_order);

-- ─── AntiCheat: every game, per-game evidence ───────────────────────────────

alter table zenith.ac_report_evidence drop constraint ac_report_evidence_kind_check;
alter table zenith.ac_report_evidence add constraint ac_report_evidence_kind_check
  check (kind in ('report_confirmation', 'uid_proof', 'scoreboard', 'extra'));

alter table zenith.ac_reports
  add column account_id     uuid references zenith.accounts (id) on delete set null,
  add column video_url      text check (video_url is null or (video_url ~ '^https://' and char_length(video_url) <= 500)),
  add column match_details  text check (char_length(match_details) <= 300);

update zenith.settings
   set value = jsonb_set(value, '{games}', '["pubg-mobile", "free-fire", "valorant", "honor-of-kings", "tekken-8", "ea-fc-26"]'::jsonb)
 where key = 'product.anticheat' and value -> 'games' = '["pubg-mobile"]'::jsonb;

-- ─── lock the new tables down like the rest ─────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array['accounts', 'tournament_sponsors'] loop
    execute format('alter table zenith.%I enable row level security', t);
    execute format('revoke all on zenith.%I from public', t);
    if exists (select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on zenith.%I from anon', t);
    end if;
    if exists (select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on zenith.%I from authenticated', t);
    end if;
  end loop;
end $$;

select zenith.apply_app_role_grants();
