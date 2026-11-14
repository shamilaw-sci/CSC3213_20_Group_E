# Search-demand recording contract

Implementation is source-reviewed only. No database migration, automated test, build, lint, or manual search mutation was run by the assistant. Apply `phase7-search-demand.hosted-review.sql` before checking this feature. The Node Supabase client needs server-only service-role credentials; the Go database connection needs the listed privileges or its existing trusted postgres role.

The Admin-protected `GET /api/admin/analytics/heatmap` accepts optional `from` and `to` calendar dates (`YYYY-MM-DD`). The default is today and the previous 29 days in `Asia/Colombo`. The inclusive maximum is 366 days; reversed, invalid and future windows return 400. A storage failure returns 503, never a credible zero. Payload: `districts: [{district, count}]`, `total`, `window: {from,to,days,timezone}`, `trackingStartedAt`, `explanation`. Tracking starts when the schema is applied, not at an inferred historical date.

## Recorded event boundary

- Smart Search form: successful Node keyword search, only when the submitted text exactly names a supported district.
- Buy page Search action: successful Node listing fetch following an explicit submission with an exact district text. This records requested district intent; the existing Buy page continues applying its text filters locally.
- Home hero Search: sends an opaque event UUID through navigation state to its successful Go map request. A bare map URL or normal page load creates no event.
- Map Search action: successful Go request for an exact district text. Explicit map district selection also creates one event; map navigation, viewport refreshes, restored saved searches and arbitrary freehand geometry do not create events.
- The server normalizes case/whitespace against all 25 districts. It does not infer demand from returned listings or invent district coordinates. The Admin visual uses the existing district GeoJSON; the accessible table contains the exact counts.

One random UUID identifies a submitted event. A SQL transaction inserts that ID once and increments one district/day aggregate; retries and concurrent calls across Node and Go cannot increment the same UUID twice. The Go hook runs after search success, including cache hits. Event metadata is removed from the result-cache key. Successful map requests clear pending metadata; automatic requests cannot create a fresh event.

## Privacy and limitations

Persistent analytics contains only day/district counts, opaque UUIDs with server recording timestamps, and the tracking-start timestamp. It does not persist free text, user identity, IP, precise coordinates, or request bodies. All tables have RLS enabled and browser grants revoked; functions are security invoker and executable only by the trusted server role.

Recording is best effort, with an 800 ms database timeout, and cannot fail an otherwise successful search. Browser environments without secure `crypto.randomUUID` skip recording. Non-district text, direct legacy clients without metadata, failed/aborted requests, limited traffic and storage outages can undercount. Counts describe recorded submissions, never unique people or exhaustive demand.

Each Node/Go process accepts at most 20 analytics attempts per minute per IP-derived in-memory key, with bounded bucket storage. This is a basic spam bound, not global bot prevention; multiple processes and IPs can increase counts. UUID deduplication is shared in the database. UUID retention is indefinite to prevent replay across dates; review capacity/retention before large-scale deployment.

## Pending manual acceptance

After applying SQL and restarting both backends: submit `Kandy` once on each search entry point and confirm only Kandy grows once per explicit submission; refresh/pan the map and confirm no extra growth. Resubmit the same UUID and confirm no duplicate. Check an empty date window and a storage-unavailable state separately. Confirm invalid/reversed/future/>366-day windows fail clearly and a nonadmin cannot read the aggregate. Verify the real district fill and table reconcile. None of these outcomes is claimed as observed.
