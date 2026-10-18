# Zenith ecosystem — operations runbook

Audience: Zenith administrators and whoever is on call for the website.

## Consoles and roles

| Console | Address | Who |
|---|---|---|
| HQ | `zenithesports.pk/admin` | Senior / super administrators: inquiries, bookings, messages, waitlist, site settings, media, staff, audit |
| Registrations | `registrations.zenithesports.pk/admin` | Tournament administrators: tournaments, forms, registrations, LFT, games |
| AntiCheat | `anticheat.zenithesports.pk/admin` | AntiCheat reviewers: reports, alerts, flags, manual entry, scans |

Each console has its own sign-in; a session on one grants nothing on another. Sessions last 12
hours, or 2 hours idle. Ten failed attempts per account (or twenty per network) in 15 minutes pause
sign-in; eight consecutive failures lock the account for 15 minutes.

**Staff accounts** — HQ → Staff & roles (super administrators only). New accounts and password
resets produce a one-time password shown once; share it privately. Changing roles or disabling an
account signs that person out everywhere. The last active super administrator cannot be removed.
If every super administrator is locked out, run `npm run admin:bootstrap` only after removing the
locked accounts' `super_admin` role directly in the database, and record why.

## Running a tournament

1. Registrations → Form builder: create or copy a template, add only the questions this event
   needs (team, roster, IDs and contact are always collected), preview, **Publish version**.
2. Registrations → Tournaments → New: game & format, schedule (in the tournament's timezone),
   capacity, roster limits, approval/waitlist/phone rules, the published form, rules, prizes, links.
3. Publish. The public page and registration open at the configured time.
4. Review in Registrations → Registrations (live). Rejections and disqualifications require a reason,
   which the team sees. Bulk actions apply to up to 100 entries and skip illegal transitions.
5. Entries with AntiCheat alerts are marked; they are never auto-approved. Reviewers decide in the
   AntiCheat console.
6. Export CSV for brackets or check-in. Cells are escaped against spreadsheet formula injection, and
   every export is logged.
7. Cancelling a tournament requires a public reason and cancels all active entries.

## AntiCheat

- **Reports**: verify the typed UID appears in the evidence. Approval is impossible without ticking
  the UID-match confirmation (enforced by the database too). Unclear evidence → *Ask for
  clarification* or *Reject*.
- **Approving** creates a verified flag and immediately scans all current and historical records.
- **Flags** can also be recorded directly for disciplinary decisions. Phone numbers and shared IDs
  are indicators for review — choose the confidence honestly.
- **Alerts** must be dismissed or resolved with a note. Rescans never duplicate alerts and never
  reopen ones a reviewer closed.
- **Scans & retention**: run a full scan after imports or rule changes; resume failed runs; purge
  expired evidence (unapproved reports keep evidence 180 days).

## Production bookings and inquiries

A booking request is not a booking. Move it through *under review* / *needs info* to *confirmed*
or *declined*; customers are emailed on those changes when email delivery is configured.

## Notifications

Email (Resend) and Discord are optional. Unconfigured providers are shown on the HQ overview and
their notifications are recorded as `skipped`. Discord receives summaries only — never personal data.

## Incidents

| Symptom | Check |
|---|---|
| Pages show "Signal interrupted" | Vercel function logs for the digest shown on the page; database reachability (`DATABASE_URL`). |
| Console "Offline" indicator | `DATABASE_LISTEN_URL` must be a session-mode (5432) connection; updates still arrive via the event cursor within seconds. |
| "Too many submissions" for real users behind one network | Limits are per hashed IP in `zenith.rate_limits`; delete the specific key if needed. |
| Hisaab broken | It is static and independent; check `/hisaab/admin` headers (see DEPLOYMENT §6) and its own Supabase login. Never "fix" it from this repository. |
| Suspected data issue | Audit log (HQ → Audit log) records every privileged and public action; it is append-only. |

## Backups

Supabase daily backups/PITR plus a manual `pg_dump` before any schema change (DEPLOYMENT §1).
Migrations are additive and checksummed; add new files rather than editing applied ones.
