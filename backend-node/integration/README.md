# Local critical-flow integration

These are explicit real-database test commands. Ordinary `npm test` includes pure isolation/network/state guard tests and existing mocked API suites. It does not discover `login-roles.integration.cjs` or `listings.integration.cjs`.

Current appointment-owner change: CRM now requires nullable UUID `leads.buyer_id` and denied anon/authenticated direct lead writes before any API/fixture work. Retained stack-c has not received these changes and the profile must refuse there; do not weaken its existing guards or apply the candidate to make it pass. Earlier CRM10/10 is historical evidence preceding this change. Committed-schema acceptance needs a separately approved target/guard; see [adoption prerequisites](../../docs/phase7-appointment-owner-rollout.md).

The separately approved Phase7 target now passed58/58 real-local cases (new7, CRM10, listings32, saved5, checkout4), all19 table/catalog/ledger preservation and final empty-data verification. Dedicated guards use only59322/59321; original stack-c guards remain unchanged. The new pair is stopped with volume/networks retained. See [commands, bootstrap/provisioning evidence and scope limits](../../docs/phase7-local-acceptance.md). This is not production schema adoption or Storage/browser acceptance.

From `backend-node`, with existing dependencies and the checked local stack running:

```powershell
node integration/run-login-roles.cjs --preflight
node integration/run-login-roles.cjs
node integration/run-listings.cjs --preflight
node integration/run-listings.cjs
node integration/run-saved-searches.cjs --preflight
node integration/run-saved-searches.cjs
node integration/run-crm.cjs --preflight
node integration/run-crm.cjs
node integration/run-receipts.cjs --preflight
node integration/run-receipts.cjs
```

Preflight is read-only. Login/roles seeds seven synthetic users, runs the actual Express auth endpoints through Supertest and deletes only those run-specific UUID/email pairs. It checks the complete starting users snapshot and canonical migration ledger. Each invocation creates a fresh Jest process and fixture IDs, retaining real auth rate limits.

Phase7 update (2026-11-03): Login/roles now has40 scenarios, including legacy-session refusal, real password-reset CAS revocation, cookie/Bearer password-change refresh and dedicated Admin refresh. Reset purpose tokens are created only for exact synthetic fixtures; no forgot-password email delivery is enabled. Changed fixture hashes are restored by exact UUID/email before final owned-user cleanup. Application token fixtures use the shared version2 issuer and known server-side fixture hashes; this does not change Supabase infrastructure JWTs or permit credential export to browser fixtures.

Combined Phase7 follow-up on2026-11-03: guarded CRM10/10, listings32/32, saved searches5/5 and checkout4/4 passed sequentially, including complete starting/ending table snapshots and canonical ledger checks after exact fixture cleanup. These use retained stack-c permissions, not committed candidate ACL hardening. External delivery remained disabled; browser/Storage/receipt-worker profiles were not rerun in that batch.

Listings 2A seeds eight synthetic users and its own moderation properties, then exercises actual creation, ownership, validation, visibility, editing, moderation and deletion. It cleans only properties belonging to those exact run-owned users, before deleting fixture users. This includes recovery of an insert whose API response failed. The shared launcher checks full starting/ending users, properties, transactions, payment_orders and payment_receipt_outbox snapshots plus the ledger, even if the child suite fails. It reports drift without printing table contents. Normal assertion/setup failures run cleanup; abrupt termination may prevent hooks and must be investigated without reset or broad deletion.

The launcher accepts no database URL or credentials from the command line. It derives generated local credentials in memory from exactly `supabase_db_thirasara-phase4-c` and `supabase_rest_thirasara-phase4-c`; it never loads the application `.env`. It refuses missing/wrong container identities, images, networks, bindings, CLI project, remote link, approval marker, file checksums, migration ledger or API/DB read cross-check. An unavailable stack is a failure, not a skipped green test.

Saved searches uses the same verified DB/REST and five synthetic UUID/example.test users. It covers actual full/legacy persistence, ownership/validation, alert preferences/deletion and real joined matching/admin approval. Email delivery is replaced with inert spies; a call-through coordinator spy records and awaits the real detached approval promise, proving retry does not invoke it again. Cleanup removes exact owner searches before owned properties/users. Parent preservation checks all six complete app tables: users, properties, saved_searches, transactions, payment_orders and payment_receipt_outbox, plus the canonical ledger. This profile does not permit Storage or external delivery. It tests existing alert updates; there is no saved-criteria edit endpoint or save uniqueness guarantee.

## Local prerequisites

Payment receipts uses the same verified DB/REST and all ten CRM snapshot tables. It executes real local settlement/outbox RPCs,queue claims/acknowledgements and email rendering for exact registered synthetic sandbox orders. Nodemailer captures mail only;no SMTP occurs. A dedicated scope rejects unregistered/null/foreign claim/settle order IDs,unrelated RPCs and unregistered recipients. Worker.start,other email exports and real unscoped drain remain forbidden. Retry-endpoint authorized sweep is tested only with a unit MOCK. Cleanup removes exact owner outbox/transactions/orders before fixture properties/users. Tests explicitly show at-least-once delivery can repeat after uncertain acknowledgement;SMTP exactly-once is not guaranteed. This profile does not exercise PayHere/ngrok/cards or message read receipts.

CRM uses the same verified DB/REST with eight UUID/example.test accounts and actual guest-booking/direct-lead plus property-conversation fixtures. Its ten real scenario tests cover five stage mappings for both sources,metadata/partial update persistence,joined/latest-message/order behavior,roles/ownership/validation and owned deletion/cascades. Base setup keeps all email/workers forbidden;Storage is not enabled. Parent snapshots all six prior app tables plus leads,conversations,messages and composite-key message_receipts. Cleanup checks ownership and removes exact fixture children before conversations/leads,property and UUID/email users. No signed-in booking conversation-link repair,new notes editor or receipt API is included in this profile.

See `../../docs/database/setup.md` for the Phase 4 isolated environment. No Docker resources are created, started, reset or removed by the test command. Inspect retained containers before restarting them. Do not use native Supabase CLI start: the documented original default bindings were unsafe on this Docker Desktop setup.

The owner approved publishing the retained stack-c PostgREST service at `127.0.0.1:58321`; DB remains `127.0.0.1:58322`. The original stopped REST container is retained as `supabase_rest_thirasara-phase4-c-before-phase5-port`. Private generated Compose configuration is in `docs/evidence/phase4-local/stack-c-phase5-rest.private.json`; keep it and all generated credentials untracked. This local test setup does not repoint the existing application or ngrok backend.

On the existing prepared machine, inspect the exact two containers and verify their configured loopback bindings before starting those containers:

```powershell
docker inspect --format '{{.Name}} {{json .HostConfig.PortBindings}}' supabase_db_thirasara-phase4-c supabase_rest_thirasara-phase4-c
```

Only after confirming DB 5432 -> 127.0.0.1:58322 and REST 3000 -> 127.0.0.1:58321, with no other published addresses, restart those retained containers:

```powershell
docker start supabase_db_thirasara-phase4-c supabase_rest_thirasara-phase4-c
```

Then run preflight, which independently checks the remaining identity requirements and readiness before permitting fixture writes. A startup/readiness refusal is not a reason to bypass the guard. Do not start auth, storage, mail, receipt workers or unrelated services. A different/fresh machine first needs its own explicitly authorized isolated setup; copying hosted keys or data is forbidden.

The two test services were stopped after this batch's verification; all containers/volumes/configuration remain available. Stop only these two again when finished:

```powershell
docker stop --timeout 20 supabase_rest_thirasara-phase4-c supabase_db_thirasara-phase4-c
```

The retained REST endpoint is direct PostgREST, not Kong. Test-only fetch transport removes Supabase JS's `/rest/v1` prefix and permits only this checked origin; redirects fail. The real application Supabase client, queries, repositories, bcrypt, JWT and middleware remain in use. Login/roles refuses email calls; listings uses controlled listing-status email and saved-search-coordination spies. Receipt delivery is always forbidden. Dotenv is disabled inside the child, and TCP is restricted to `127.0.0.1` on the verified DB/REST ports plus the explicitly registered ephemeral app listener. Port 5000 is always blocked. Expected HTTP 2xx/4xx access logs are filtered narrowly; other warnings/errors remain visible.

## Scope and limits

- Password login/session/role assertions are in the integration suite. Google/Apple/Facebook, browser cookie/CORS rules, password reset delivery and registration are outside this batch.
- Logout verifies cookie clearing, not revocation of a copied JWT.
- Frontend provider/router integration uses controlled API responses and is not full browser E2E.
- Listings 2A API creation uses no successful file transfer; the frontend synthetic File tests stop at the controlled API/payment boundary. Real Storage upload/rollback/removal and the full AddProperty wizard remain listings 2B. No Storage service is started by these commands.
- Moderation uses directly seeded Paid properties; this is not evidence of checkout settlement or enforcement of payment eligibility by the approval endpoint. Unpaid approval rules require a separate decision.
- PayHere sandbox checkout and ngrok webhook verification belong to the later checkout batch. No payment endpoints are called here.
- Failure during normal setup/assertions runs exact fixture cleanup in `afterAll`. Abrupt process termination can prevent hooks; preserve the environment for investigation instead of using reset or broad cleanup.
- Windows sandbox restrictions may require approval for Docker pipe and loopback access. Resource-heavy verification should run sequentially if Windows paging/commit memory is constrained.

Run pure safety checks without Docker or network:

```powershell
npm test -- --runInBand tests/localStackGuard.test.js tests/integrationNetworkGuard.test.js
npm test -- --runInBand tests/integrationState.test.js
```

## Listings 2B Storage profile

`node integration/run-storage.cjs --preflight` is read-only. `node integration/run-storage.cjs` verifies real uploads/bytes/rollback, seller/admin photos-and-tours deletion, shared-reference retention and DB foreign-key failure preservation. The two initially failing deletion assertions were kept and turned green after the owner-approved Option A fix. It deletes the DB row first, then awaits validated, unshared managed-file removal; it is not a DB/Storage transaction or durable retry mechanism. Logs contain validated recovery paths if a lookup/removal fails after DB deletion. Legacy unmanaged URLs are skipped, and concurrent reference changes/crashes remain separate resilience limits.

The owner approved reusing the cached Storage image v1.84.19 and existing volume with only `127.0.0.1:58323 -> 5000` published. The stopped original is `supabase_storage_thirasara-phase4-c-before-phase5-port`; original private configuration remains retained. Private corrected configuration is `docs/evidence/phase4-local/stack-c-phase5-storage.private.json`, with `DB_MIGRATIONS_FREEZE_AT=unlock-object-versioning`. Before startup, the 74 tenant migration filename+SQL hashes matched the cached image's loader algorithm and current native ledger; startup preserved full native schema/ACL/owners and metadata. Do not run a different image or native CLI start.

For the existing prepared workspace, inspect the exact DB/REST/Storage configured bindings before restarting. Only the recorded `127.0.0.1:58322/58321/58323` bindings are acceptable. Then restart the three retained normal container names and run Storage preflight, which verifies image/project/network/volume/DB/key/freeze provenance before fixture writes. No mail/auth/worker/other services are needed.

The Storage profile alone permits port58323 and maps the SDK's `/storage/v1` prefix to direct Storage. Earlier profiles retain their narrower transports. It snapshots all native Storage tables, full native schema including ACL/owners, persisted file paths/bytes, five app tables and app migration ledger. Exact-prefix fixture cleanup uses the actual Storage removal API, verifies file/metadata absence, then removes fixture properties/users. No direct Storage SQL/file deletion is used. A failing product assertion still fails the explicit command after fixture cleanup/state checks.

The rendered wizard uses controlled HTTP/payment/browser boundaries; it is not full browser-to-Storage E2E. Real PNG bytes/metadata/download/hash and rollback are verified independently by the backend suite. Partial-upload fault injection requires proof of the first real successful upload before rejecting the second targeted request.

When finished, stop only the started test containers, preserving originals and volumes:

```powershell
docker stop --timeout 20 supabase_storage_thirasara-phase4-c supabase_rest_thirasara-phase4-c supabase_db_thirasara-phase4-c
```

## Checkout profiles

From backend-node, `node integration/run-checkout.cjs --preflight` is read-only; `node integration/run-checkout.cjs` exercises actual local checkout/order/settlement handlers using dummy signing terms and no gateway or email delivery. The parent compares all eleven application tables, including platform_settings, and the canonical ledger after exact fixture cleanup. Ordinary Jest excludes this explicit integration profile.

`node integration/run-checkout-browser.cjs` launches the separately approved manual PayHere sandbox profile. It verifies the exact retained local DB/REST, API identity, existing HTTPS ngrok tunnel to localhost5000 and free5000/5173 listeners. It reads only existing sandbox merchant credentials into memory; it does not inherit hosted DB or SMTP configuration. The child has a bounded Node heap and one native Rayon worker for this memory-constrained machine. No services are started automatically.

The minimal page uses the actual usePayhere hook with controlled auth/private API transport, and explicit VITE_PAYHERE_NOTIFY_URL pointing to a random per-run ngrok callback. The public bridge permits only its health sentinel and known-order/merchant form callbacks; actual signature validation and settlement remain authoritative. Order response tracking captures originalUrl before mounted Express routers shorten request paths. Verify the public sentinel against the private session journal before opening a gateway payment. Receipt outbox creation is real; delivery is disabled.

Use official sandbox cards only. Gateway completion alone is insufficient: success requires an accepted genuine signed callback, Paid local property/order, exactly one transaction and one pending receipt outbox. Cancellation/decline must leave unpaid state and no transaction/outbox. In the observed Chrome environment frames remained blank; the in-app browser rendered the actual embedded SDK dialog and nested card form. Opening observed gateway URLs directly can validate settlement but does not exercise parent-window dismissal/completion; record that distinction.

The browser process accepts `status` and `stop`. Stop closes ingress/listeners, removes exact owned fixture children/properties/users, then compares eleven complete snapshots and the ledger. Preserve private journals if interrupted. `node integration/recover-checkout-browser.cjs` requires listeners5000/5173 closed, exact local identity, all eleven saved baseline hashes and exact journal ownership. Seller-mode bcrypt hashes must match the separately retained disposable password. An optional created-property journal must belong to the same run. Recovery refuses uncertainty and rolls back if baseline comparison fails; never reset or broadly delete data. Original journals and all evidence remain untracked.

The unfinished `--seller-ui` mode is separate from the verified minimal checkout harness. Full photo-required seller wizard/browser-to-Storage flow is not established by these checkout checks. No actual .env changes, hosted cleanup, deployment or git operations are performed. After successful cleanup stop only the retained DB/REST services as documented above.
