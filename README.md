# Zenith Esports — ecosystem

The website and platforms of Zenith Esports, a Pakistani multi-gaming organisation: one Next.js 16
application serving the ecosystem hub and four platforms on their own subdomains.

| Surface | Production | Local |
|---|---|---|
| Ecosystem hub + HQ console | `zenithesports.pk` | `/`, `/admin` |
| Zenith Registrations (+ console) | `registrations.zenithesports.pk` | `/registrations`, `/registrations/admin` |
| ZenithProduction | `production.zenithesports.pk` | `/production` |
| ZenithAntiCheat (+ console) | `anticheat.zenithesports.pk` | `/anticheat`, `/anticheat/admin` |
| ZenithPoints | `points.zenithesports.pk` | `/points` |

ZenithHisaab (`public/hisaab/admin`) is a separate private app that is only *served* from this
repository. Do not edit those files here.

## Run it locally

Requires Node 20.9+. No Docker or cloud account needed: the local database is real PostgreSQL 18
running in-process (PGlite).

```bash
npm install
cp .env.example .env.local        # then uncomment the "local development" lines
npm run db:local                  # terminal 1 — starts PostgreSQL on :54329 and applies migrations
npm run dev                       # terminal 2 — http://localhost:3000
npm run admin:bootstrap -- --email you@example.com --name "You"   # with DATABASE_URL set
```

Sign in at `/admin/login`, `/registrations/admin/login` or `/anticheat/admin/login` with the
one-time password printed by the bootstrap command (you will be asked to change it).

## Checks

```bash
npm run lint -- src tests scripts
npm run typecheck
npm test                          # unit + database tests against a throwaway PostgreSQL
npm run test:e2e                  # browser flows; needs db:local + dev/start running and
                                  # E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
```

CI (`.github/workflows/ci.yml`) runs all of these, including the end-to-end flows against a
production build.

## Documentation

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — audit findings, system design, data model, security.
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — backups, migrations, Vercel, DNS, bootstrap, rollback.
- [RUNBOOK.md](RUNBOOK.md) — day-to-day operations.
- [BRAND_GUIDELINES.md](BRAND_GUIDELINES.md) — the Zenith Meridian design system.

## Stack

Next.js 16 (App Router, React 19, Turbopack) · Tailwind CSS 4 · PostgreSQL on Supabase (schema
`zenith`, accessed server-side with `postgres.js`) · zod · sharp · Vitest + PGlite · Playwright.

Proprietary. All rights reserved by Zenith Esports.
