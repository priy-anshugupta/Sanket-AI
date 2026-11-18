# Database availability and monitoring

## Production configuration

Set `DB_MODE=supabase` and the PostgreSQL `DATABASE_URL` in Render environment settings. A Supabase connection failure must not redirect production requests to local SQLite. `DB_MODE=auto` retains automatic SQLite fallback only outside Render/Railway; `DB_MODE=sqlite` and explicit operator switches retain intentional offline operation.

## Monitor setup (external account setting)

Change the uptime monitor to **GET https://sanket-ai-13ld.onrender.com/ready**, expected status **200**, interval **10 minutes**. Both GET and HEAD execute an actual read of the reports table, including for an empty table. The probe has a four-second database deadline and returns **503**, `Retry-After: 10`, and `Cache-Control: no-store` on failure. It never returns records or connection credentials.

`/health` remains process liveness and makes no database query. Keep Render's process health check on `/health` so an upstream database outage does not trigger repeated server restarts. Use `/ready` for the external monitor that must detect database outages. Repointing an existing monitor requires access to its dashboard; deploying this code does not change that account setting.

## Recovery behavior

Startup initialization has a deadline. If Supabase is unavailable, the server starts with readiness failing, retains its PostgreSQL engine, and retries initialization in the background with delays of 2, 4, 8, 16, then 30 seconds between attempts. Shutdown cancels the recovery task.

Normal database requests retry connection acquisition at most three times, each with a four-second deadline and 0.25/0.5-second backoff, before returning 503. Failed sessions are closed. Pool pre-ping and recycling refresh stale connections. Application operations and commits are never replayed: a lost connection during a write can leave its result uncertain, so retrying writes blindly can duplicate observations.

The dashboard UI is unchanged. Database-backed endpoints return a clear 503 response during connection outages. `/api/system/db-status` also reports actual connectivity as `connected`.

## Platform limits

This improves monitoring and application recovery; it cannot resume an already-paused Supabase project or repair an upstream platform incident. If Supabase reports Unhealthy repeatedly, inspect the specific failing service and database logs. Monitor traffic is not an availability guarantee on either free tier.
