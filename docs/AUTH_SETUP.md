# Setting up the database and sign-in (Supabase + Google)

This guide takes you from nothing to a working site with Google sign-in. Do the steps in order.
Nothing here touches ZenithHisaab.

You will need:

- the Supabase dashboard (the project the website already uses, `tzxvmmmxxcaiocmeejng`);
- a Google account that can open Google Cloud Console;
- Vercel → the website project → Settings;
- this repository on your computer with `npm install` done.

---

## Part 1 — Database (the existing Supabase project)

The website keeps all of its data in its own schema, `zenith`, inside the existing project. It never
reads or changes `public.*` (the old site's tables, ZenithHisaab's `hisaab_*` tables) or the
Supabase-managed auth schema.

1. **Back up first.** Supabase → Project Settings → Database → *Connection string* → **URI**
   (port 5432, "direct" or "session pooler"). Copy it, then on your computer:
   ```bash
   pg_dump "<that URI>" --format=custom --file=zenith-before-ecosystem.dump
   ```
   Keep the file somewhere safe, outside the repository.

2. **Create the schema.** In this repository:
   ```bash
   DATABASE_URL="<the 5432 URI>" npm run db:status    # lists 4 migrations as PENDING
   DATABASE_URL="<the 5432 URI>" npm run db:migrate   # applies them, each in a transaction
   ```
   (No terminal? Paste the four files in `supabase/migrations/` into Supabase → SQL Editor, in
   filename order, and run each one.)

3. **Create the website's own database login** (recommended — it can only see schema `zenith`).
   Open `supabase/setup/app_role.sql`, replace the password placeholder with a long random password,
   and run it in the SQL Editor. Then check:
   ```sql
   select has_schema_privilege('anon', 'zenith', 'usage');                       -- false
   select has_table_privilege('zenith_app', 'public.hisaab_entries', 'select');  -- false
   ```

4. **Note the two connection strings** for Vercel (Supabase → Connect):
   - `DATABASE_URL` — *Transaction pooler*, port **6543**, user `zenith_app.<project-ref>`.
   - `DATABASE_LISTEN_URL` — *Session pooler*, port **5432**, same user (live console updates).

---

## Part 2 — Sign-in project (a new, separate Supabase project)

**Why a separate project?** The existing project is also ZenithHisaab's login. Turning on Google and
public sign-up there would change *its* authentication settings, and every player who signs up would
appear in Hisaab's user list. (Their access would still be zero — every Hisaab policy checks the
`hisaab_admins` list — but Hisaab is meant to stay exactly as it is.) A small project used only for
sign-in keeps the two completely apart. The website stores player accounts in its own `zenith`
tables, so nothing else needs to move.

1. Supabase → **New project**. Name it `zenith-auth`, pick the region closest to Pakistan (e.g.
   Singapore or Mumbai), set a database password (you will not need it again). Free tier is fine.
2. When it is ready: Project Settings → **API**. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (or the legacy **anon** key) → this is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

   Both are designed to be public. **Never** copy the `service_role` / secret key anywhere.
3. Authentication → **Sign In / Providers** → **Email**: keep it **enabled**, keep **Confirm email**
   on. Leave "Allow new users to sign up" **on** (players create accounts).
4. Authentication → **URL Configuration**:
   - **Site URL:** `https://www.zenithesports.pk`
   - **Redirect URLs** — add each of these:
     ```
     https://www.zenithesports.pk/auth/callback
     https://*.zenithesports.pk/auth/callback
     http://localhost:3000/auth/callback
     ```
     (Add your Vercel preview URL too if you test there, e.g. `https://*-yourteam.vercel.app/auth/callback`.)

---

## Part 3 — Google sign-in

1. Go to <https://console.cloud.google.com/> → create a project named **Zenith Esports** (or reuse
   one you own).
2. **APIs & Services → OAuth consent screen** (called *Google Auth Platform* in newer consoles):
   - User type: **External**.
   - App name **Zenith Esports**, support email, the logo from `G:\ZenithBranding` if you like.
   - Authorised domain: `zenithesports.pk` (and `supabase.co`).
   - Scopes: only the defaults (`email`, `profile`, `openid`).
   - Publish the app (*In production*) so anyone can sign in, not only test users.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**, name `Zenith website`.
   - **Authorised JavaScript origins:** `https://zenithesports.pk`
   - **Authorised redirect URIs:** the callback shown in Supabase. Find it in the `zenith-auth`
     project → Authentication → Sign In / Providers → **Google** — it looks like
     `https://<zenith-auth-ref>.supabase.co/auth/v1/callback`. Paste exactly that.
   - Create, then copy the **Client ID** and **Client secret**.
4. Back in Supabase (`zenith-auth`) → Authentication → Sign In / Providers → **Google**: enable it,
   paste the Client ID and Client secret, save.

### Show "Zenith Esports" on Google's account chooser

With the steps above, Google says *"to continue to <ref>.supabase.co"*, because Google returns to
Supabase. The website can run the Google step itself so Google returns to our own domain instead:

1. Same OAuth client → **Authorised redirect URIs** → add
   `https://www.zenithesports.pk/auth/google` (keep the Supabase one too) → Save.
2. Vercel → project → Settings → Environment Variables (Production), add:
   - `GOOGLE_CLIENT_ID` — the same Client ID as in Supabase
   - `GOOGLE_CLIENT_SECRET` — its Client secret (if it is no longer shown, use **Add secret** on
     the OAuth client and paste the new one into both Vercel and Supabase)
   then redeploy. The chooser now reads *"to continue to zenithesports.pk"*.
3. To show the name **Zenith Esports** instead of the domain, finish the consent screen's
   **Branding** (app name, logo, home page `https://www.zenithesports.pk`, privacy policy
   `https://www.zenithesports.pk/legal/privacy`, authorised domain `zenithesports.pk`) and submit it
   for **brand verification** (Google Auth Platform → Verification centre). With only the default
   scopes this is usually quick.

Without the two variables, sign-in keeps using Supabase's page, so nothing breaks in between.

---

## Part 4 — Vercel environment variables

Vercel → the website project → Settings → **Environment Variables** (Production; also Preview if you
use previews):

| Name | Value |
|---|---|
| `DATABASE_URL` | Part 1 step 4, transaction pooler (6543) |
| `DATABASE_LISTEN_URL` | Part 1 step 4, session pooler (5432) |
| `APP_SECRET` | 48 random characters: `openssl rand -base64 48` |
| `ROOT_DOMAIN` | `zenithesports.pk` |
| `NEXT_PUBLIC_SUPABASE_URL` | Part 2 step 2 — the **zenith-auth** project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Part 2 step 2 — its publishable/anon key |

Leave `LOCAL_DEV_AUTH` and `STAFF_PASSWORD_LOGIN` **unset** in Vercel. Redeploy after saving.

Sign-in cookies are set for `.zenithesports.pk`, so a player who signs in on
`registrations.zenithesports.pk` is also signed in on `anticheat.zenithesports.pk` and the main site.

---

## Part 5 — Your administrator account

There is no public "make me an admin" page. Create the first super administrator once:

```bash
DATABASE_URL="<the 5432 URI from Part 1>" NEXT_PUBLIC_SUPABASE_URL="<zenith-auth URL>" \
  npm run admin:bootstrap -- --email you@yourdomain.com --name "Your Name"
```

Use the **same email as your Google account**. Then open `https://zenithesports.pk/admin/login`,
choose **Sign in with Google**, and press **Enter this console**. The first time, your staff record
links itself to that Google account; after that only that account can use it.

Add other staff from **HQ console → Staff & roles** with their Google (or email) address and roles.
They sign in the same way. Each console — HQ (`/admin`), Registrations, AntiCheat — asks you to enter
it separately; being signed in to one never opens the others.

### Sessions and time-outs

- **Players** are signed out after **2 hours without activity** on any Zenith site, and must sign in
  again. (A signed "last active" cookie is checked on every request; editing it signs you out.)
- **Consoles** end after **1 hour without activity** and after 12 hours in any case.
- The **first** time a staff record is linked to a sign-in it must be **Sign in with Google** with
  the staff email. Google proves the address belongs to that person; an email/password account only
  proves it if *Confirm email* is on in Supabase, which the website cannot check. If your staff do
  not use Google, keep *Confirm email* on and set `STAFF_EMAIL_LINKING=1` in Vercel.

---

## Part 6 — Check it works

1. Open `https://registrations.zenithesports.pk`, pick a tournament → **Register** → you are asked to
   sign in → **Continue with Google** → you come back to the form.
2. Open `https://zenithesports.pk/account` — your entry is listed; you can fix names/IDs until
   registration closes, or withdraw.
3. Create an account with **email** instead: you get a confirmation email; the link signs you in.
4. `https://zenithesports.pk/hisaab/admin` still opens the Hisaab login exactly as before.

---

## Running it on your computer

```bash
npm run db:local          # terminal 1: a local PostgreSQL with the migrations applied
npm run dev               # terminal 2
```

`.env.local` (not committed):

```
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54329/postgres
DATABASE_POOL_MAX=1
REALTIME_LISTEN=off
LOCAL_DEV_AUTH=1          # test sign-in without Supabase (only works with a local database)
```

With `LOCAL_DEV_AUTH=1` and no Supabase variables, `/login` shows a "local test" sign-in that takes
any email. Consoles use passwords locally (`npm run admin:bootstrap` prints a one-time password).
To try real Google sign-in locally, add the two `NEXT_PUBLIC_SUPABASE_*` variables instead and use
`http://localhost:3000`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "redirect_uri_mismatch" from Google | The redirect URI in Google Cloud must be the **Supabase** callback (`…supabase.co/auth/v1/callback`), not the website's. |
| Back on the site with "That sign-in link has expired" | The website URL is missing from Supabase → URL Configuration → Redirect URLs. |
| Signed in on one subdomain but not another | `ROOT_DOMAIN` must be `zenithesports.pk` in Vercel. |
| "This account is not a Zenith staff account" | The email you signed in with is not in Staff & roles, or differs in spelling. |
| Email confirmation never arrives | Supabase's built-in mailer is rate-limited; for real traffic set a custom SMTP server in `zenith-auth` → Authentication → Emails. |
