# Frontend live traffic audit

Automatic traffic now requires a real, unexpired login session, a visible tab, and a live route. Mock/demo logins do not start automatic backend traffic.

| Location | Before | After |
| --- | --- | --- |
| Dashboard layout | Air-gap status every 5s; latest report every 3s; socket reconnect every 4s on every dashboard subpage | Air-gap status every 45s only on live routes; latest report every 45s only as socket fallback; scoped socket with 30s/60s reconnect backoff |
| Triage | Summary and paginated reports every 4s plus report events | Serialized snapshots every 45s plus rate-limited report event invalidation |
| Control room | Reports, summary and heatmap every 3s plus events | Serialized snapshots every 45s plus rate-limited event invalidation |
| Heatmap | Every 4s plus events | Every 45s plus rate-limited event invalidation |
| Emergency | Latest reports every 3s | Every 45s plus rate-limited event invalidation |
| Graph | Layout traffic plus selected-node evidence fetch | Live layout subscription; evidence fetched on selection and aborted on selection change/unmount |
| Settings | Own status poll every 4s plus layout traffic | One authenticated visible load; explicit mode switches still refresh status |
| Worker | Air-gap every 5s and history every 4s | One authenticated visible load of each; submissions and their local history remain user-triggered |
| Homepage/login | No recurring API traffic | Unchanged; login requests remain user-triggered |
| Replay/report detail/voice | Persistent layout polling and socket | No recurring layout traffic; detail fetches and user actions remain available |

The five live routes are /dashboard, /dashboard/control-room, /dashboard/heatmap, /dashboard/emergency, and /dashboard/graph. Root layout has no API provider or connection. No frontend EventSource, network heartbeat, or health keep-alive was found.

Polling uses completion-based 45-second scheduling. It never starts another polling request batch while its current batch is unresolved. Hidden tabs, logout (including other tabs), session expiry, route cleanup and pagehide abort requests and remove timers; socket callbacks are detached before close. pageshow/visibility return refresh live snapshots immediately. Abort guards prevent late polling responses from writing state. Event invalidations have a 30-second minimum spacing so event bursts cannot create rapid cold-start retries. Manual refresh and writes are not rate-limited by that automatic scheduler.

Healthy WebSockets suppress the layout's latest-report HTTP fallback. The backend pushes new reports and critical alerts; it does not push complete paginated queues, summary/heatmap aggregates, or every acknowledgement/status change. These snapshots retain 45-second reconciliation for correct dashboard state. No client heartbeat is sent. A socket handshake has a 90-second deadline; failed connections retry at 30 seconds, then 60 seconds. Live critical alert banners and sounds still use immediate WebSocket messages.

Remaining timers drive local clocks, playback, animation/progress, recording, sirens or toast dismissal, not network keep-alives. Worker submission classification retrieval is a bounded, user-triggered loop (up to three attempts); voice submission has a one-time delayed result fetch. Uploads, AI/swarm requests, manual refresh, feedback, acknowledgements, mode switches and emergency actions remain user-triggered.

## Validation

- npm run test: 16 tests passed, covering visibility, auth, expiry, route changes, abort/stale response behavior, long cold starts, fallback suppression, retry backoff, pagehide/pageshow, query changes, unmount, five-second React rerenders, response-driven state updates and request source labels.
- npm run typecheck: passed.
- npm run lint -- --quiet: passed (the normal lint command reports existing application warnings).
- npm run build: passed; all routes generated successfully.

Tests use mocked browser activity, timers, and transports. They do not establish Render usage savings or inspect hosted request logs.

## Deployment and external traffic

Deploy the frontend, including package.json/package-lock.json and the new lifecycle modules. No backend changes or backend redeployment are required. Existing loaded frontend tabs must reload to receive this fix; older bundles can continue polling.

The backend exposes GET/HEAD / and /health, and /ws/alerts supports client heartbeat pings. No recurring external monitor configuration or backend self-ping was found in this repository. Check external uptime monitors, cron jobs, CI/API test scripts, bots/crawlers, other clients and old tabs. Requests through Next.js /api rewrites reach the backend too. Active live dashboards and explicit user actions intentionally generate traffic.

Render documents a 15-minute idle period without inbound HTTP traffic or WebSocket messages, with HTTP requests and new socket connections waking the service: https://render.com/docs/free . Verify quiet request logs and actual instance-hour usage after deployment. No hour savings have been measured.

## Investigating five-second status requests

Automatic status reads now carry `client=sanket-live-v2` and `view` query parameters in the access-log URL. The view is a static frontend route, not a username or token. For example: `/api/system/airgap?client=sanket-live-v2&view=%2Fdashboard`.

In the current source, only the dashboard layout schedules repeated status reads, using the shared 45-second controller. Settings and worker status reads are once-only. A regression test recreates the callback and rerenders every five seconds, including state updates from responses: it produces requests only at initial activation and 45 seconds, then none while hidden. This does not identify the source of already observed production traffic.

After the diagnostic version deploys and tabs reload, recurring unlabelled `/api/system/airgap` reads are not from these three automatic callers. Manual mode-switch refreshes remain unlabelled. Check the exact Vercel URL: old immutable preview/deployment URLs can continue serving old code even after the main production alias updates. Multiple active clients can also interleave otherwise slower polling in combined backend logs. Determine the actual caller from labelled URLs and browser Network initiators before attributing it to an old tab or external monitor.
