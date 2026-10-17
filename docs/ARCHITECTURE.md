# Zenith Ecosystem — Architecture

Audience: engineers and operators maintaining zenithesports.pk.

## 1. Audit findings (2026-10-18)

| Area | Finding | Consequence |
|---|---|---|
| Website repo | `rebuild/v2` held an uncommitted Next.js 16 + Supabase rewrite of the old Vite SPA (Mark47 sub-brand, payment-proof flow). | Snapshotted as commit `86ae235`, then superseded by this architecture. |
| Deployed site | `origin/main` is the legacy Vite SPA plus the static ZenithHisaab ledger at `public/hisaab/admin/`. | Hisaab files are merged in byte-for-byte from `origin/main` and must never be edited from this repo. |
| Database | Legacy site **and** ZenithHisaab share Supabase project `tzxvmmmxxcaiocmeejng` (`public.users`, `public.tournaments`, `public.registrations`, … and `public.hisaab_*`). Hisaab also uses `auth.users`. | **No destructive migration is possible.** All new objects live in a separate `zenith` schema. Nothing in `public` or `auth` is altered or dropped. |
| Credentials | No `.env`, no Supabase CLI link, no Vercel CLI, no Docker, no GitHub CLI login in this environment. | Production DB, DNS and hosting cannot be touched from here. Everything is verified locally against PGlite (real PostgreSQL 18 in WASM). |
| ZenithHisaab | Static page + Supabase RLS keyed to one auth user. Fonts: Michroma, Geist, Geist Mono. | Read-only. Served unchanged at `/hisaab/admin`; `hisaab.zenithesports.pk` may redirect there. |
| ZenithProduction | Local Node/Express desktop tool (command center + OBS overlays) for PUBG Mobile, driven by the PCOB observer. | Marketed only. No binaries, code, paths, ports or protocols are published. |
| ZenithAntiCheat | Empty directory. | Built new inside this repo as the `anticheat` surface (shares the identity graph with Registrations, which is the point of the product). |
| ZenithPoints | No path supplied; `Projects/PointZenith` is an empty git repo with no commits. | Marketing showcase + waitlist only. No claims of shipped functionality. |

## 2. Shape of the system

One Next.js 16 application, several **surfaces**:

| Surface | Production host | Local path |
|---|---|---|
| `hq` (ecosystem hub + HQ console) | `zenithesports.pk` | `/` , `/admin` |
| `registrations` | `registrations.zenithesports.pk` | `/registrations` |
| `production` | `production.zenithesports.pk` | `/production` |
| `anticheat` | `anticheat.zenithesports.pk` | `/anticheat` |
| `points` | `points.zenithesports.pk` | `/points` |
| Hisaab alias | `hisaab.zenithesports.pk` → 307 → `zenithesports.pk/hisaab/admin` | — |

`src/proxy.ts` maps the host to a surface and rewrites to the internal path. On the production root domain, path-style URLs (`/registrations/...`) are 308-redirected to their canonical subdomain. On any other host (localhost, previews) path mode is used.

## 3. Data layer

- **PostgreSQL schema `zenith`** in the existing Supabase project, created by additive migrations in `supabase/migrations/`. The app connects server-side only through `postgres.js` (`DATABASE_URL`). The schema is **not** exposed via PostgREST; RLS is enabled with no policies and all privileges are revoked from `anon`/`authenticated`, so the public anon key (which Hisaab ships in its `config.js`) cannot read it.
- Recommended: a dedicated `zenith_app` login role that has privileges on `zenith` only — the website then cannot read `hisaab_*` even if compromised (`supabase/setup/app_role.sql`).
- Identity graph shared by Registrations and AntiCheat: `players`, `player_identifiers` (normalised game UIDs), `phone_numbers` + `player_phone_links`, `teams`, `team_memberships` (historical).
- Flexible forms: `form_templates` → immutable published `form_versions` (JSON schema). Every registration stores the `form_version_id` it was validated against.
- Integrity: partial unique indexes (one active entry per UID / team name / phone per tournament), `SELECT … FOR UPDATE` on the tournament row for capacity, legal status transitions enforced by trigger, append-only audit log.
- Files (evidence, uploads) are stored in `zenith.files` (bytea) behind authorised routes, with content sniffing and size caps.

## 4. Auth

Staff accounts live in `zenith.staff_users` (scrypt hashes), **not** in the shared `auth.users`. Sessions are opaque random tokens (SHA-256 stored), host-only `__Host-` cookies, **one cookie per surface** — logging into the Registrations console grants nothing on AntiCheat or HQ. Roles: `super_admin`, `senior_admin`, `tournament_admin`, `anticheat_reviewer`. No public sign-up; the first admin is created by `npm run admin:bootstrap`.

Participants do not need accounts: a registration returns a private manage link (random token, hashed at rest) that lets the captain view status, and withdraw.

## 5. Realtime

Triggers write to `zenith.events` and `pg_notify('zenith_events')`. Authorised SSE endpoints per console stream new events (LISTEN when the connection supports it, plus a durable cursor over `zenith.events` for reconnects/`Last-Event-ID`). Payloads carry ids and kinds only — never personal data.

## 6. Security posture

Server-side authorisation on every action and route; explicit Origin check on mutations; zod validation; DB-backed rate limits keyed by HMAC-hashed IP; honeypot + signed form-timing tokens; CSV export formula-escaping; CSP, HSTS, frame-ancestors none; evidence served with `nosniff` and a sandbox CSP; audit log for every privileged action.
