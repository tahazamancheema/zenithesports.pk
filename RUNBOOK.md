# Zenith Esports Platform — Operations Runbook

## Deployment Architecture
- **Frontend / API**: Vercel (Next.js Edge Network)
- **Database / Auth**: Supabase (PostgreSQL, GoTrue, PostgREST)
- **Email Delivery**: Resend
- **DNS / WAF**: Cloudflare

## Routine Operations

### Database Backups
Supabase performs automatic daily backups on the Pro plan. PITR (Point in Time Recovery) is available for 7 days.
- **Restore Procedure**: Navigate to Supabase Dashboard -> Database -> Backups. Select the desired restore point.

### Tournament Lifecycle Management
1. **Creation**: Navigate to `/admin/tournaments` and click "Create Tournament". Set dates, prize pool, and capacity.
2. **Registration Window**: Teams register via `/tournaments/[slug]`. Registration relies on atomic DB locking to prevent over-subscription.
3. **Payment Verification**: Admins review uploaded screenshots in `/admin/payments`. Approved teams are moved to `approved` status.
4. **Check-in Phase**: Exactly 1 hour before start time, the "Check In" button activates on the Player Dashboard. Teams must check in to confirm attendance.
5. **Bracket Generation**: (Future Scope / Third Party) Export confirmed teams to standard tournament platforms (Challonge/Faceit).

## Incident Response

### High Database Latency or Connection Limits
- **Symptom**: "Too many clients" errors or slow API response times.
- **Action**: Check Supabase connection pooler (PgBouncer) metrics. Ensure `NEXT_PUBLIC_SUPABASE_URL` is pointing to the IPv4 pooler URL in production, not the direct DB connection.

### Registration Concurrency Issues (Oversell)
- **Symptom**: More teams registered than the `capacity_teams` limit.
- **Action**: Check the `register_for_tournament` Postgres function. It utilizes `SELECT ... FOR UPDATE` row-level locks. Ensure this function has not been modified to bypass locking.

### Webhook Failures
- **Symptom**: Staff not receiving Discord notifications.
- **Action**: Verify `DISCORD_WEBHOOK_URL` in environment variables. Check Vercel function logs for `fetch` errors. Discord rate limits webhooks to 5 requests per 2 seconds.

## Security Practices
- **Row Level Security (RLS)**: All tables are strictly protected by RLS. Only authenticated users can insert records tied to their `user_id`. Only `is_admin = true` users can mutate global state.
- **Environment Variables**: Never commit `.env.local`. Always use Vercel's secure environment variable manager.
