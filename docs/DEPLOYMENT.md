# Deploying the Zenith ecosystem

Audience: whoever holds the Supabase, Vercel and DNS credentials for zenithesports.pk.

None of these steps were run against production when this was built: the build environment had no
database credentials, no Vercel/DNS access and no GitHub CLI login. Everything below was verified
locally (real PostgreSQL 18 via PGlite, a production `next build`, Host-header routing tests and
Playwright end-to-end flows). Do the steps in order.

## 0. What must not change

- **ZenithHisaab** lives at `zenithesports.pk/hisaab/admin` as static files in `public/hisaab/` and
  uses the same Supabase project. This branch carries those files byte-for-byte from `origin/main`
  and reproduces their headers (CSP, `noindex`, `no-store`) in `next.config.ts`. Never edit them here.
- The shared database holds legacy website tables in `public` and Hisaab's `public.hisaab_*` plus
  its login in `auth.users`. The new migrations touch **only** the new `zenith` schema
  (`tests/unit/migrations.test.ts` fails the build if a migration references `public.` or `auth.`).

## 1. Back up the database first

From any machine with `pg_dump` (PostgreSQL 15+ client), using the **direct** connection string
from Supabase → Project Settings → Database:

```bash
# Full logical backup (keep it off the repository)
pg_dump "$SUPABASE_DIRECT_URL" --format=custom --no-owner --file="zenith-backup-$(date +%F).dump"

# Confirm what exists before touching anything
psql "$SUPABASE_DIRECT_URL" -c "\dt public.*" -c "\dn"
```

Expected: legacy tables (`users`, `tournaments`, `registrations`, `announcements`, …) and
`hisaab_*` tables in `public`; **no** `zenith` schema yet. If a `zenith` schema already exists,
stop and find out why.

Supabase Pro also keeps daily backups / PITR (Dashboard → Database → Backups). A manual dump is
still required because it is portable and you control it.

## 2. Create the schema

```bash
DATABASE_URL="$SUPABASE_DIRECT_URL" npm run db:status    # all PENDING
DATABASE_URL="$SUPABASE_DIRECT_URL" npm run db:migrate   # applies 3 migrations in transactions
```

Each migration runs in its own transaction and is recorded with a checksum in
`zenith.schema_migrations`; editing an applied migration is refused. Alternatively paste the three
files from `supabase/migrations/` into the SQL editor in order.

Then create the least-privilege login (recommended), after replacing the password placeholder:

```sql
-- supabase/setup/app_role.sql
```

Check isolation:

```sql
select has_schema_privilege('anon', 'zenith', 'usage');          -- false
select has_table_privilege('zenith_app', 'public.hisaab_entries', 'select'); -- false
```

**The legacy tables are not migrated or deleted.** The new site does not read them. Once the team
has confirmed nothing is needed from them, they can be archived in a separate, reviewed step — after
checking with the Hisaab owner that none are shared.

## 3. Vercel environment variables

Project → Settings → Environment Variables (Production and Preview). See `.env.example`.

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supavisor **transaction** pooler, port 6543, user `zenith_app.<project-ref>` |
| `DATABASE_LISTEN_URL` | Supavisor **session** pooler (port 5432), same user — enables instant console updates |
| `APP_SECRET` | `openssl rand -base64 48` |
| `ROOT_DOMAIN` | `zenithesports.pk` |
| `RESEND_API_KEY`, `NOTIFY_FROM_EMAIL` | optional, for emails (verified sender domain in Resend) |
| `DISCORD_WEBHOOK_URL` | optional, staff channel summaries (no personal data is sent) |

Preview deployments run in path mode (`/registrations`, `/production`, …) on their `*.vercel.app`
host. Point previews at a separate database if you do not want test data in production.

## 4. Domains and DNS

Vercel → Project → Settings → Domains. Add all of these to **this** project:

```
zenithesports.pk
www.zenithesports.pk            (redirects to apex — also handled in src/proxy.ts)
registrations.zenithesports.pk
production.zenithesports.pk
anticheat.zenithesports.pk
points.zenithesports.pk
hisaab.zenithesports.pk         (optional alias → 307 to zenithesports.pk/hisaab/admin)
```

DNS records (at the DNS host — Cloudflare per the runbook). Use the exact values Vercel shows for
your project; the standard ones are:

| Type | Name | Value | Proxy (Cloudflare) |
|---|---|---|---|
| A | `@` | `76.76.21.21` | DNS only |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only |
| CNAME | `registrations` | `cname.vercel-dns.com` | DNS only |
| CNAME | `production` | `cname.vercel-dns.com` | DNS only |
| CNAME | `anticheat` | `cname.vercel-dns.com` | DNS only |
| CNAME | `points` | `cname.vercel-dns.com` | DNS only |
| CNAME | `hisaab` | `cname.vercel-dns.com` | DNS only (optional) |

Keep Cloudflare proxying off ("DNS only") so Vercel can issue certificates; if you proxy, set SSL to
Full (strict). HTTPS certificates are issued automatically by Vercel per domain.

The `hisaab` alias only redirects. Hisaab itself is still served from
`zenithesports.pk/hisaab/admin`, so its Supabase session storage and login are unchanged. The alias
is not linked anywhere and not in `robots.txt` or sitemaps.

## 5. Deploy and bootstrap

1. Merge `rebuild/v2` → `main` (or promote a preview). Vercel builds with `next build`.
2. Create the first super administrator (only works while none exists):
   ```bash
   DATABASE_URL="$SUPABASE_DIRECT_URL" npm run admin:bootstrap -- --email you@zenithesports.pk --name "Your Name"
   ```
   It prints a one-time password once. Sign in at `https://zenithesports.pk/admin/login`; you must
   change it immediately. Create other staff from HQ console → Staff & roles.
3. Each console has its own sign-in: `zenithesports.pk/admin` (HQ),
   `registrations.zenithesports.pk/admin`, `anticheat.zenithesports.pk/admin`.
4. Fill in HQ console → Site settings: contact details, verified social URLs, product statuses.

## 6. Verify

```bash
for h in zenithesports.pk registrations.zenithesports.pk production.zenithesports.pk anticheat.zenithesports.pk points.zenithesports.pk; do
  curl -sI "https://$h/" | head -1
done
curl -sI https://www.zenithesports.pk/ | grep -i location             # → https://zenithesports.pk/
curl -sI https://zenithesports.pk/registrations | grep -i location   # → https://registrations.zenithesports.pk/
curl -sI https://hisaab.zenithesports.pk/ | grep -i location         # → https://zenithesports.pk/hisaab/admin
curl -sI https://zenithesports.pk/hisaab/admin | grep -iE "x-robots|cache-control"   # noindex…, no-store
```

Then sign in to Hisaab as usual and confirm it works exactly as before.

## 7. Rollback

- **Website:** Vercel → Deployments → promote the previous production deployment (the legacy SPA
  with Hisaab). Instant, no data change.
- **Database:** the new objects are confined to `zenith`. To remove them completely:
  `drop schema zenith cascade;` — this deletes only data created by the new site (registrations,
  reports, staff accounts). Restore from the step-1 dump if anything else is ever in doubt.
- **zenith_app role:** `drop owned by zenith_app; drop role zenith_app;`
