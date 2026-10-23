# Zenith ecosystem — architecture

Audience: engineers maintaining zenithesports.pk. Last updated 18 October 2026.

## 1. Audit findings

| Area | Finding | Consequence |
|---|---|---|
| Website repo | `rebuild/v2` held an uncommitted Next.js 16 + Supabase rewrite of the Vite SPA (Mark47 sub-brand, payment-proof flow). | Snapshotted as commit `86ae235`; that source is kept only in git history. |
| Deployed site | `origin/main` = legacy Vite SPA + the static ZenithHisaab ledger at `public/hisaab/admin`. | Merged into this branch; Hisaab blobs are identical to `origin/main`. |
| Database | Legacy site **and** ZenithHisaab share Supabase project `tzxvmmmxxcaiocmeejng` (`public.*`, `public.hisaab_*`, `auth.users`). | All new objects live in schema `zenith`. Nothing in `public`/`auth` is created, altered or dropped. The legacy WIP migrations, which would have created `public.teams` etc. in the shared DB, were removed. |
| Credentials | No `.env`, Supabase/Vercel CLI, Docker or GitHub CLI login in the build environment. | Production DB, hosting and DNS were not touched; see `DEPLOYMENT.md`. Local verification uses PGlite (real PostgreSQL 18). |
| ZenithHisaab | Static page + Supabase RLS keyed to one auth user; fonts Michroma/Geist/Geist Mono. | Read-only. Served unchanged with its original headers; `hisaab.` alias only redirects. Its path appears nowhere in the public site, robots or sitemaps. |
| ZenithProduction | Local Node/Express command centre + OBS overlays for PUBG Mobile driven by the PCOB observer. | Marketed from its user-facing README only. No binaries, code, ports, endpoints or file paths are published. Visuals are labelled illustrations; an admin can publish approved screenshots. |
| ZenithAntiCheat | Empty directory. | Built inside this app (it must share the identity graph with Registrations). |
| ZenithPoints | No path supplied; `Projects/PointZenith` is an empty repository. | Marketing showcase + consented waitlist only; the site claims no shipped functionality. |

## 2. Surfaces and routing

One Next.js 16 app. `src/proxy.ts` maps hosts to surfaces on the production root domain and uses
path prefixes elsewhere (localhost, previews):

| Surface | Host | Internal prefix |
|---|---|---|
| hq | `zenithesports.pk` | `/` |
| registrations | `registrations.zenithesports.pk` | `/registrations` |
| production | `production.zenithesports.pk` | `/production` |
| anticheat | `anticheat.zenithesports.pk` | `/anticheat` |
| points | `points.zenithesports.pk` | `/points` |

Path-style URLs on the wrong host are 308-redirected to the canonical subdomain; `www` → apex;
`hisaab.` → 307 to `zenithesports.pk/hisaab/admin`; `/hisaab/*` on any other subdomain → 307 to the
root. The proxy also issues a per-request CSP nonce (`script-src 'nonce-…' 'strict-dynamic'`).
`ZLink` writes same-surface links as relative paths and cross-surface links as absolute subdomain
URLs (verified with Host-header requests against a production build).

Route groups: `src/app/(site)` (public chrome) and `src/app/(console)` (three consoles).

## 3. Data layer

- **Schema `zenith`**, three additive migrations (`supabase/migrations/`), applied by
  `scripts/db.ts` with checksums in `zenith.schema_migrations`.
- Server-only access through `postgres.js` (`src/server/db.ts`). The schema is not exposed to
  PostgREST; RLS is on with no public policies and all privileges are revoked from
  `anon`/`authenticated`. Optional `zenith_app` login role has rights on `zenith` only.
- **Identity graph** shared by Registrations and AntiCheat: `players` (one per game + UID via
  `player_identifiers`), `player_ign_history`, `phone_numbers` + `player_phone_links`, `teams`,
  `team_memberships` (historical; ended, never deleted).
- **Forms**: `form_templates` → `form_versions` (JSON schema validated by zod). Published versions
  are immutable (trigger); every registration stores the `form_version_id` it was validated against.
- **Registrations**: `registrations` + `registration_members` + `registration_status_history`.
  Concurrency: the tournament row is locked `FOR UPDATE` for each submission; partial unique indexes
  enforce one active entry per UID / team name / phone per tournament as a backstop. Legal status
  transitions are enforced by trigger.
- **AntiCheat**: `ac_reports` (+ evidence), `ac_flags` + `ac_flag_identifiers` (kind, normalised
  value, confidence), `ac_alerts` (deduplicated by key; re-detection bumps a counter and never
  reopens a closed alert), `ac_scan_runs` (batched, resumable), `ac_notes`, disciplinary records.
  Matching is set-based SQL (`zenith.ac_candidates`, `ac_scan_flag`, `ac_scan_registration`) over
  roster rows, players, phones, team names, IGNs, LFT listings and team history.
- **Intake**: `product_inquiries`, `production_bookings` (+ history; "confirmed" requires a named
  administrator by check constraint), `waitlist_signups` (consent text stored; removal deletes),
  `contact_messages`.
- **Platform**: `staff_users`, `staff_roles`, `sessions`, `rate_limits`, `audit_events`
  (append-only by trigger), `notifications` (outbox), `events` (realtime outbox), `settings`,
  `files` (private bytea store), `product_media`, `org_members`.

## 4. Services (`src/server/services`)

| Module | Responsibility |
|---|---|
| `registrations.ts` | Validation (shared form engine), transactional submission, captain self-service, transitions, admin roster correction |
| `anticheat.ts` | Reports, reviews, flags, scans, alerts, manual entry, notes, evidence retention |
| `identity.ts` | Player/team/phone upserts used by every ingestion path |
| `admin-tournaments.ts` | Tournament CRUD and lifecycle, form templates/drafts/publishing, games & formats |
| `intake.ts` | Inquiries, bookings, waitlist, contact |
| `lft.ts` | Looking-for-team listings and consent-based contact requests |
| `staff.ts`, `content.ts`, `catalog.ts` | Accounts and roles; media and team profiles; read models |

Server actions live in `src/app/actions/{public,console}.ts`; they validate input, enforce origin and
permissions, and delegate to services.

## 5. Auth and authorisation

- Staff accounts in `zenith.staff_users` (scrypt N=2¹⁵), separate from the shared `auth.users`.
- Opaque session tokens (SHA-256 stored), `__Host-` HttpOnly SameSite=Strict cookies, **one per
  console** and bound to that surface in the database. 12 h absolute / 2 h idle.
- Roles → permissions (`src/lib/permissions.ts`); every action and route handler checks a permission,
  never a role name, and never relies on hidden UI.
- No public sign-up. First account via `npm run admin:bootstrap` (refuses once a super admin exists);
  bootstrap/reset passwords must be changed before anything privileged works.
- Participants need no account: unguessable manage links (hashed at rest) for registrations, LFT
  listings and requests.

## 6. Realtime

Triggers write to `zenith.events` and `pg_notify`. A per-instance hub (`src/server/realtime.ts`)
LISTENs where the connection allows it and reads the event table by cursor, fanning out to
authorised SSE endpoints (`…/admin/live`). Clients refresh server data on each event and resume with
`Last-Event-ID`. Payloads carry ids and kinds only.

## 7. Security controls

| Control | Where |
|---|---|
| Origin check on every mutation (Next lets Origin-less actions through) | `assertSameOrigin` |
| Input validation, no mass assignment | zod + form engine drop unknown keys |
| SQL injection | parameterised `postgres.js` templates only |
| XSS | React escaping; no `dangerouslySetInnerHTML`; nonce CSP |
| Upload safety | magic-byte sniffing, full decode with sharp, size/dimension caps, private storage, `nosniff` + sandbox CSP on serve, evidence views logged |
| Spam | honeypot, HMAC form-timing token, DB-backed per-IP rate limits (IP stored only as HMAC) |
| Exports | permission + same-origin fetch check, formula-injection escaping, audit entry |
| Errors | generic messages; driver errors never shown; digest for log lookup |
| Secrets | server-only env (no `NEXT_PUBLIC_` vars); no production browser source maps |
| Privacy | masked IDs/phones on captain pages; event links only after approval; LFT contact only after consent; no public flag lists |

## 8. Verification

- `npm test` — 49 Vitest tests against PGlite: migration safety (no `public.`/`auth.`, API roles see
  nothing, audit append-only), form engine, normalisation, timezone conversion, registration
  duplicates/capacity/waitlist/concurrent race/transitions/withdrawal/cancellation, AntiCheat
  historical + ingestion matching, dedup, manual entry, report approval rule, identity preservation.
- `npm run test:e2e` — 6 Playwright flows: console session isolation and forced password change,
  tournament creation/publication, the five-step public registration, duplicate rejection,
  console approval, and a public report with evidence reviewed into a flag that matches history.
- Production build, lint and typecheck clean; Host-header routing matrix verified against
  `next start`; no horizontal overflow on any public page at 390 px.

## 9. Known limitations

- Production deployment, DNS, Supabase migration and the database backup were **not performed**
  (no credentials). Follow `DEPLOYMENT.md`.
- No real email/Discord delivery was tested (no keys); outbox behaviour was.
- Live updates via LISTEN/NOTIFY were exercised only through the event-cursor path locally (PGlite
  cannot deliver cross-connection NOTIFY).
- No ZenithProduction screenshots are published: the desktop app holds real team data, so capturing
  "sanitised" screenshots needs a human decision. Upload approved images via HQ → Media & team.
- Captains cannot edit their own roster; changes go through organisers (admin correction is
  implemented with full re-checking).
- Image recognition to locate UIDs in evidence is not implemented; reviewers verify manually.
- Evidence and uploads are stored in Postgres (≤ 4 MB each); move to object storage if volume grows.
