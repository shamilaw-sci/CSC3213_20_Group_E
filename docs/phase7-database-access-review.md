# Phase 7 database access review

2026-11-03. Source review only; current deployed permissions and remote exploitability are not verified. No schema, policy, grants, data or baseline manifest changed.

## Confirmed baseline observations

Source: `supabase/migrations/20261030045416_phase4_current_schema_baseline.sql`.

| Surface | Observation | Consequence / next verification |
| --- | --- | --- |
| Broad table ACLs, lines 621–755 | Fifteen public tables grant anon/authenticated INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER and MAINTAIN. Four private tables are service_role only. | RLS does not constrain TRUNCATE/REFERENCES. This is excess privilege, not proof that PostgREST exposes TRUNCATE. Check effective inherited privileges and alternate SQL/RPC access before assigning remote exploit severity. |
| `leads`, line 821 | PUBLIC INSERT policy has `WITH CHECK (true)` and anon has INSERT. | Direct Data API insertion can bypass backend validation/rate limits if the schema/table is exposed. Verify with a rolled-back synthetic insert in the guarded stack, not a live request. |
| `agent_profiles`, line 795 | PUBLIC SELECT policy accepts every row; table includes `rejection_reason`. | Direct table reads may disclose moderation text and unapproved profiles if exposed. Backend public agent projection omits rejection_reason; that projection does not restrict direct Data API reads. |
| `property_sales_history`, line 825 | INSERT checks only authenticated role. | A valid Supabase authenticated identity could insert unrelated history if Data API exposure/auth issuance permit it. The application's custom JWT is not by itself evidence of a valid Supabase authenticated identity. |
| Public RPCs, lines 546–575, 768–786 | `increment_property_views` and `search_properties` allow PUBLIC EXECUTE; neither declares SECURITY DEFINER. | They run as invoker. Baseline properties RLS has no policy, so execute permission alone does not establish a row-read/write bypass. Inspect actual policies, grants, function ownership/security and exposure before testing. |
| Payment RPCs | All three revoke PUBLIC/anon/authenticated EXECUTE and grant service_role. | Preserve these restrictions; existing permission tests check them. No public payment RPC exposure found in this baseline. |

No SECURITY DEFINER function or CREATE VIEW appears in this application baseline. This does not cover extension functions, later drift, other exposed schemas or deployed configuration. Source search found no Supabase client/direct RPC use in frontend src. Node uses its server-side Supabase client; Go map search uses a direct database connection with an approved-status predicate. External clients and operator integrations remain unknown.

## Proposed boundary for a later owner-applied change

Concrete options, explicit object scope, compatibility risks, rollback-only test design and rollout gates are in the proposed grant-hardening design (development document archived locally). Recommendation: backend-only access for existing application objects; no managed-role default changes in the first batch.

Prefer backend-only writes for application tables, and narrowly projected public reads where required. Remove unneeded non-DML grants and explicitly restrict RPC execution. Confirm external clients first; do not blindly revoke all access or rewrite the applied baseline. Review default privileges separately so future objects do not reintroduce broad access. Public agent data needs a projection that excludes moderation fields and an approved-agent filter.

No corrective SQL is supplied as ready to apply: a compatible change requires effective-permission evidence, direct-access inventory, a separate reviewed migration and guarded acceptance tests. Existing phase4 checksums must remain unchanged.

## Read-only evidence collection

`database/phase7-access-metadata-readonly.sql` collects only catalog metadata in a read-only transaction. It does not select application rows, invoke business RPCs, truncate, change roles or execute corrective grants. A catalog result cannot prove endpoint reachability.

### Guarded isolated results — 2026-11-03

Executed the collector against verified stack-c after existing container/workdir/checksum/marker/ledger/DB/API preflight passed. Nineteen public relations,25 policies and27 default-ACL entries were collected. Effective anon TRUNCATE exists on the15 tables identified above. Only the two application public functions are executable by anon; neither is SECURITY DEFINER. Private raw catalog evidence is under `docs/evidence/phase7-database-access-metadata.json` and must remain untracked.

Using a short-lived locally signed anon token, GET `/agent_profiles?select=agent_id,rejection_reason&limit=0` returned200 with an empty array. This establishes local anonymous endpoint/column permission without returning moderation values. Together with the all-row SELECT policy it confirms the local exposure boundary; it does not establish that any actual rejection text exists. OPTIONS `/leads` returned200 and advertised POST (along with the other table methods). Together with the effective INSERT grant and unconditional INSERT policy this supports direct insertion risk, but no insertion was attempted and method advertising alone does not prove constraint-valid insertion.

No business RPC, application write, live target, schema change or corrective grant was executed. Read-only collector completed and marker/ledger identity was rechecked. Only retained DB/REST containers were started; both were stopped again after collection. Storage/Auth and persisted volumes were untouched. Current deployed exposure and compatibility of narrower grants still require separate verification.

References checked on 2026-11-03: [PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html), [Supabase roles](https://supabase.com/docs/guides/database/postgres/roles). The Supabase changelog markdown endpoint was attempted but the web tool rejected its content type; no Supabase implementation/API change is made here.

## Approved candidate verification — 2026-11-03

Owner approved the backend-only boundary and rollback-only testing. [Candidate SQL](database/phase7-application-grants.candidate.sql) remains outside applied migrations and refuses execution without the isolated runner flag/marker/postgres17 identity. [Guarded runner](../backend-node/integration/run-database-grants.cjs) validates the existing container/workdir/checksum/DB guard before opening the write transaction.

Baseline test failed on the intended direct-access assertion and passed rollback preservation. Candidate run passed denial of eight table privileges (including MAINTAIN), four column privileges and five RPCs for anon/authenticated, plus raw PUBLIC table/function ACL checks. Existing service-role table privileges matched exactly, all five service RPC permissions remained, and synthetic agent lookup/lead creation worked. Additional negative missing-runner-flag case and explicit moderation-column grant cleanup passed.

All19 full table snapshots, catalog metadata (relations/columns/functions/policies/default ACLs/role memberships) and database identity/ledger matched after mandatory rollback. No persistent grant/data changes occurred. Both DB/REST containers stopped again; Storage/Auth/volumes untouched. Independent bounded review and follow-up found no actionable defects. Node syntax and both applied migration SHA256 checks passed; index empty. Full backend/frontend suites were not rerun for this SQL/test-tool-only batch.

This verifies a transactional SQL candidate, not a committed migration or hardened PostgREST HTTP behavior: other connections cannot observe these uncommitted grants. External direct consumers, Go database-role compatibility, future defaults and owner-managed live application remain open. Source for REVOKE behavior: [PostgreSQL17 REVOKE](https://www.postgresql.org/docs/17/sql-revoke.html).

Subsequent owner-approved [fresh committed-schema acceptance](phase7-local-acceptance.md) now verifies local hardened HTTP behavior: all19 table read denials with service positives, full eight-table/four-column catalog privilege checks, direct lead INSERT/PATCH and five RPC denials with42501, plus actual application flows. Separate test-target SQL committed on new DB only; rollback candidates/baseline files unchanged. Production permissions/Go compatibility/defaults and owner migration adoption remain open.

## Consumer clarification — 2026-11-03

Owner reports only the Admin Dashboard and Gemini chat integration are known, while expressing uncertainty about the current implementation. This is not confirmation that every external consumer has been inventoried.

Source verification: Admin `frontend-react/src/pages/admin/api/adminApi.js` calls Node `/api` using the application Bearer token. FloatingAIChat calls Node `/ai/chat`; `backend-node/controllers/aiController.js` invokes Gemini and executes two fixed search tools through the server-side shared Supabase client. Gemini does not receive a database connection/key in this implementation. The backend sends chat context (including authenticated name/role) and selected property/agent tool results to Gemini. It does not expose arbitrary SQL or general database read access to the model. Both known flows therefore use the intended backend boundary; actual committed hardening acceptance is still outstanding.

Go remains a separate direct PostgreSQL consumer through DATABASE_URL; its deployed role/effective privileges have not been inspected. Compose passes SUPABASE_KEY to Node, and all three source createClient sites use that key. SUPABASE_SERVICE_ROLE_KEY being present in Compose alone does not prove that SUPABASE_KEY is correct. Do not print or edit either key to establish compatibility. No runtime/configuration changes or provider API calls were made during this clarification.

The [Go compatibility review](phase7-map-database-compatibility.md) now documents exact runtime requirements and a read-only same-role diagnostic. That diagnostic passed under isolated local service_role (16 required columns and PostGIS query planning), without returning application rows. Actual deployed Go role and committed-hardened acceptance remain unverified.

The hosted ThirasaraDB catalog query found 19 public tables. Both anon and
authenticated have effective SELECT, INSERT and TRUNCATE grants on 15
tables each. Service_role has all three grants on all 19. These are table
privileges. The query did not test direct API operations or inspect application
rows. The localhost Node configuration has separately been verified to use
the project's service-role credential. Admin and Gemini search operations use
that Node client. The Go map service remains a separate PostgreSQL connection.

The localhost Go runtime passed readiness and a spatial search before any
grant change. A hosted catalog check matched the ownership and RLS
requirements for all 19 target tables and the ownership, invoker mode and
service execution requirements for all five target functions. The
[hosted review SQL](database/phase7-application-grants.hosted-review.sql)
uses the tested revoke scope and checks each required backend grant
individually before applying changes. The owner approved the transaction
and the hosted editor reported success. Follow-up catalog results showed
zero accessible target tables or functions for anon and authenticated.
Service_role retained access to all 19 tables and five functions in the
catalog check. The configured Node credential returned HTTP 200 for a
zero-row hosted REST read. The running Go service returned HTTP 200 for
readiness and search, with 12 results as before.
