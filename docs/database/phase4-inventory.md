# Phase 4: repeatable database setup — inventory and proposed design

Date: 2026-10-29. Repository checkpoint: `df82469` on entry.
Status: inventory/capture completed; canonical migrations and isolated verification subsequently completed on 2026-10-30. Latest outcome and boundaries: `phase4-verification.md`; runbook: `setup.md`. Historical checkpoint sections below preserve the discovery sequence.

## Scope and evidence limits

This inventory used repository reads only. No database connection, SQL execution, credential inspection, dependency installation, deployment, commit or push occurred. The initial working tree contained only untracked `docs/evidence/`; keep it untracked. No AGENTS.md was found by the repository search.

The paragraph above describes the initial inventory checkpoint. A subsequently authorized read-only continuation ran the catalog summary described below through the existing Supabase dashboard session. No schema/data writes, installation, deployment, commit or push occurred during that continuation. Existing environment credentials were consumed in-process for a failed direct connection attempt, never printed.

The accompanying `phase4-metadata-readonly.sql` is an unexecuted review artifact, outside automatic migrations. It reads PostgreSQL catalogs in a read-only transaction. It does not establish the current database state until deliberately run through an authorized connection. Do not share raw exports without reviewing them: schema expressions and object names can contain sensitive literals or identifying information.

## SQL inventory

All paths below are relative to the repository root. No additional SQL files were found by a hidden-file-inclusive search excluding Git, node_modules and private evidence.

| File under `supabase/migrations/` | Objects and dependencies |
| --- | --- |
| `20260901000001_add_missing_property_columns.sql` | Adds six properties columns; requires properties. |
| `20260901000002_add_rejection_reason.sql` | Alters agent_profiles before the next file creates it. |
| `20260901000003_agent_schema.sql` | Creates agent_profiles, lead_timeframe/lead_lifecycle, leads, agent_reviews and policies; requires users/properties and Supabase auth functions. Realtime publication statement is commented out. |
| `20260901000004_chat_attachments.sql` | Alters messages; configures chat-attachments bucket and storage policies. Requires storage infrastructure. |
| `20260901000005_chat_updates.sql` | Adds conversations.support_requested; example admin policy is only a comment. |
| `20260901000006_favorites.sql` | Creates favorites, constraints and ownership policies; requires users/properties. |
| `20260901000007_increment_views_rpc.sql` | Creates increment_property_views(uuid); requires properties.views_count. |
| `20260901000008_missing_schema.sql` | Adds users.phone and creates saved_searches plus policies. |
| `20260901000009_profile_updates.sql` | Adds users profile columns; configures avatars bucket and storage policies. |
| `20260901000010_add_missing_indexes.sql` | Indexes property_views.buyer_id, messages.conversation_id and properties.boundary. |
| `20260912170000_add_property_sales_history.sql` | Creates property_sales_history with PostGIS geometry, indexes and policies. |
| `20260913000000_add_virtual_tours_column.sql` | Adds properties.virtual_tours; requests schema-cache reload. |
| `add_saved_search_alerts.sql` | Adds saved_searches.email_alerts_enabled and partial index; missing timestamp prefix. |
| `feasibility_history.sql` | Creates feasibility_history, ownership policies and index; missing timestamp prefix. |

| File under `docs/database/p2-review/` | Purpose |
| --- | --- |
| `inquiries.sql` | contact_inquiries, constraints/index, backend-only grants. |
| `saved-search-filters.sql` | Nullable saved_searches.filters with object check. |
| `crm-offer.sql` | Adds Offer to lead_lifecycle; commit before using new value. |
| `message-receipts.sql` | Legacy marker/default transition and backend-only message_receipts with derived identifier types. |
| `payment-orders.sql` | payment_orders, transactions link, payment_receipt_outbox; create_listing_checkout, settle_listing_checkout, claim_payment_receipts; backend-only grants. |
| `payment-orders-verify.sql` | Transactional test with temporary writes and rollback. It is NOT read-only and must never enter the migration chain or this metadata step. |

There are 20 SQL files: 14 in migrations, five P2 schema scripts, one P2 verification script.

## Reproducibility gaps and conflicts

1. Missing core CREATE TABLE definitions: users, properties, conversations, messages, transactions, property_views, platform_settings and role_requests. Application repositories reference these tables. The historically observed legacy inquiries table also lacks a definition; determine its ownership/use rather than dropping it.
2. Ordering conflict: rejection_reason migration precedes agent_profiles creation. An empty database also fails earlier because properties is absent.
3. PostGIS geometry/index usage has no matching CREATE EXTENSION in the inventoried SQL. Actual extension version, schema and dependent types are unknown.
4. Policies are generally unconditional CREATE POLICY. Replaying them can fail. IF NOT EXISTS on tables/columns does not validate existing type, default, constraint or policy equivalence.
5. The two agent enum CREATE TYPE statements share one duplicate_object exception block. If the first type exists, the second statement can be skipped, leaving a partial state unresolved.
6. P2 changes are outside the automatic migration directory and include non-repeatable CREATE/ALTER statements. Copying them blindly into a chain would replay manually applied work on existing installations.
7. No complete baseline or verified migration-history export is present. No exact duplicate SQL file was identified by content review; overlapping alterations target shared tables and still require state comparison.
8. Actual grants/default privileges, RLS, triggers, views, function overloads/owners, extensions, realtime publication membership, storage policies/configuration and custom roles remain unknown. The Go db_check script references a search_properties function whose creation was not found; whether that function exists or is needed remains unverified.
9. Existing public chat attachment access and auth.uid()/auth.role() policies require explicit review against the app's custom JWT/backend authorization model. Do not silently change access behavior in a baseline.
10. supabase/config.toml is imperative (`schema_paths = []`), enables migrations and declares PostgreSQL 17. Actual server major version is unknown. Seed is enabled and points at missing ./seed.sql. Supabase CLI and psql were not on PATH; Docker executable was found, daemon state not checked.

## Applied-state evidence

Source: chronological `docs/P2-fix-status.md`, particularly its later 2026-10-27 entries. These are historical records, not fresh catalog checks.

| Change | Recorded evidence | Still unknown now |
| --- | --- | --- |
| Contact inquiries | User manual apply; zero-row schema read; authorized UI submission/admin visibility | Exact current constraints, grants, indexes and drift |
| Saved-search filters | User manual apply; zero-row read; subsequent saved/replayed version-1 criteria | Exact current column/check and drift |
| CRM Offer | User manual apply; enum acceptance and direct-lead write/reload | Full current enum definition and drift |
| Recipient receipts | User manual apply; schema reads; per-viewer isolation/idempotency verification | Exact current defaults, constraints, permissions and drift |
| Checkout | User manual apply; rollback-only test reported PASS; later zero test orders/outbox/linked transactions | Exact current RPCs/schema/grants and drift; present counts not checked |
| Original 14 migration files | SQL intent exists in repo | Which versions ran, whether partially applied, and migration-history state |

The P2 README introduction still calls three scripts unapplied, while its later sections and P2 status record their application. Treat the later verification entries as the historical source, and reconcile the stale summary during an approved documentation update. Real PayHere E2E and deployed receipt cron remain unverified. No historical row counts are current-state claims.

## Proposed design and approval gates

### 1. Capture actual metadata (next evidence step)

- Review the companion SQL; run only through an explicitly authorized connection. It is not executed by this document.
- Capture catalog metadata and migration-history existence. If history exists, separately read only version/name as described in the draft; never export its statements column.
- Obtain a reviewed schema-only definition export through existing authorized tooling, without data, credentials, foreign-server options or secrets. This needs a separate tooling/connection decision: no CLI installation is approved here.
- Supplement the baseline capture with application-owned storage configuration (bucket IDs, names, public flags, size/type limits), publication membership and non-system schemas/roles. Catalog fingerprints alone cannot reconstruct definitions. Review function bodies offline before sharing; extension-owned functions are supplied by the matching extension version.
- Build an object comparison with explicit states: matches, missing, diverged, historical-only, unknown. Any unknown dependency blocks baseline adoption.

### 2. Prepare a reviewed baseline after evidence

- Keep the existing imperative Supabase workflow. Generate new migration files using the approved CLI's `migration new` command after checking its version/help; do not install tooling or invent migration version IDs during this step.
- Use dependency order: required extensions/schemas -> enum/domain types -> core tables -> dependent tables/constraints/indexes -> functions/triggers/views -> grants/RLS/default privileges -> application storage/publication configuration. Adjust cycles by adding foreign keys after both tables exist.
- Capture the agreed current schema including applied P2 changes. Preserve enum ordering, identifier types, receipt legacy/default semantics, checkout contracts and grants. Baseline historical message behavior must match existing installations; fresh dummy messages should receive the current true default.
- Propose moving superseded files into a clearly non-executable archive with a source-to-baseline mapping. Do not perform the move until actual history is reviewed; an existing tracked installation may need a different transition that retains its version history.
- Separate schema from reviewed minimal configuration seeds and dummy test fixtures. Do not clone real user data or invent production platform settings.
- Preserve auth/payment behavior. Record security discrepancies as separate decisions rather than folding policy changes into the baseline.

### 3. Track application state and adopt existing installations

- Use `supabase_migrations.schema_migrations` as the runner's applied-version ledger. Add a repository checksum manifest for migration contents and an explicit verification procedure; the CLI history comparison alone checks timestamps, not content equivalence.
- Do not mark the baseline applied until full schema/security comparison succeeds and existing history is reconciled. History repair is itself a live database write and requires separate explicit permission; it does not prove schema equality.
- Never replay the baseline against the current installation. Missing/diverged objects need separately reviewed forward migrations, not unconditional adoption or auto-repair.

### 4. Prove a separate empty setup

- Obtain approval for a separate local Supabase test stack and any tooling installation/downloads. Use a distinct project identity, local endpoint and isolated environment configuration; never load live DATABASE_URL or service keys into it.
- Match the verified PostgreSQL major and required extensions. Supabase-managed schemas may exist, but application schema/data must initially be absent. Never empty the existing database.
- Apply the reviewed chain with failure stopping; verify ledger entries, checksums and normalized catalog equivalence. Create another fresh isolated application database and repeat to establish reproducibility.
- Test effective access for anon, authenticated and backend service roles: private inquiries/receipts/orders/outbox and checkout RPCs denied to public clients; intended service access succeeds. Exercise ownership policies with dummy identities, including cross-user denial; RLS-enabled alone is insufficient proof. Preserve custom app JWT assumptions.
- Validate enum labels, foreign keys, indexes, RPC signatures, storage policy semantics and receipt defaults. Do not call external payment gateways, enable retry workers or send email. Transactional payment verification needs separate explicit approval even in test because it performs writes.
- Add an isolated CI check only after local proof and authorization for its services/dependencies. Existing app tests do not prove database reproducibility.

### 5. Rollback and handoff

- Isolated test setup can be discarded/recreated only after confirming its identity. No remote reset command belongs in the runbook.
- Existing installations use reviewed forward recovery. Retain payment order/outbox/receipt state and in-flight settlement compatibility; do not drop tables, remove enum values, rewrite historical receipt markers or reprice orders.
- Stop on schema drift, partial migrations or failed permission checks. Review the failed transaction boundary before retrying; enum additions and platform-specific operations need explicit transaction review.
- User performs one manual commit after the agreed phase is complete. No commit/push/PR now. Keep docs/evidence/ untracked.

## Acceptance status

- [x] Enumerated repository SQL and major dependency gaps.
- [x] Separated historical applied evidence from unknown current state.
- [x] Proposed baseline, adoption, isolated verification and rollback design.
- [x] Prepared an unexecuted read-only metadata draft.
- [ ] Capture and review actual schema/history evidence.
- [ ] Approve and provision isolated tooling/environment.
- [ ] Implement and verify the migration chain and basic permissions.

Phase 4 is not complete. This document is an inventory/design checkpoint, not permission to execute dependent steps.

## Live read-only checkpoint — 2026-10-29

The configured direct PostgreSQL connection failed with ENOTFOUND inside the sandbox and ECONNRESET on the approved network retry. Connection/error details were suppressed. The already authenticated ThirasaraDB dashboard supplied the successful fallback; a separate query was created without modifying/running the user's existing ALTER TABLE query.

`phase4-metadata-summary.sql` records the exact summary SQL used. The full editor text was compared with the reviewed string after normalizing CRLF and matched before Run. The dashboard returned seven result rows, including `transaction_read_only = on`. The broader `phase4-metadata-readonly.sql` draft has still NOT been executed.

| Area | Fresh observed state | Design consequence |
| --- | --- | --- |
| PostgreSQL | 17.6 | Repo major_version 17 matches the observed major. |
| PostGIS | 3.3.7, schema extensions | Preserve schema/type resolution; choose and verify isolated extension compatibility before claiming parity. |
| Other extensions | pg_stat_statements 1.11 (extensions), pgcrypto 1.3 (extensions), plpgsql 1.0 (pg_catalog), supabase_vault 0.3.1 (vault), uuid-ossp 1.1 (extensions) | Distinguish platform-managed dependencies from application-required extensions; do not export vault contents. |
| Public tables | 19 ordinary tables, all RLS enabled; none FORCE RLS | RLS presence is established, effective permission correctness is still untested. |
| History | to_regclass('supabase_migrations.schema_migrations') returned NULL | No history relation resolved in this dashboard context. Do not invent old applied migration entries or create a ledger yet. |
| Saved filters | saved_searches.filters jsonb, nullable, no default | Matches reviewed P2 column shape; object constraint still requires inspection. |
| Receipts | messages.recipient_receipts boolean NOT NULL DEFAULT true | Matches current insert contract; historical row values were not queried. |
| Checkout link | transactions.payment_order_id uuid, nullable, no default | Column exists; unique/FK definition still requires inspection. |
| Checkout RPCs | create_listing_checkout, settle_listing_checkout, claim_payment_receipts are SECURITY INVOKER; explicit ACL lists postgres/service_role only | Signature/access metadata matches reviewed intent; bodies and effective access still need verification. |
| Extra functions | increment_property_views(uuid), search_properties(search_polygon text), rls_auto_enable() returning event_trigger | search_properties and the event-trigger helper are baseline gaps; determine platform ownership of helper before preserving it as application code. |
| Missing index target | property_views not among public tables | Do not include its legacy index statement in a fresh baseline without resolving intent. No table should be fabricated to satisfy stale SQL. |

Public tables observed: agent_profiles, agent_reviews, contact_inquiries, conversations, favorites, feasibility_history, inquiries, leads, message_receipts, messages, payment_orders, payment_receipt_outbox, platform_settings, properties, property_sales_history, role_requests, saved_searches, transactions, users. No public views/materialized views appeared in the queried relation kinds.

Public enum labels observed, in sort order:

- lead_lifecycle: New, Attempted Contact, Active, Closed, Offer.
- lead_timeframe: ASAP, 1-3 Months, 6+ Months, Browsing.
- payment_status: PENDING, SUCCESS, FAILED.
- property_status: AVAILABLE, PENDING, SOLD, pending, approved, rejected.
- user_role: BUYER, SELLER, ADMIN, PENDING_AGENT, AGENT, REJECTED_AGENT, BANNED.

Preserve mixed-case property_status labels and enum ordering until usage/dependencies are reviewed; the enum names alone do not prove which columns currently use them.

Observed function-definition fingerprints (PostgreSQL pg_get_functiondef output, MD5 comparison only):

| Function | Fingerprint |
| --- | --- |
| claim_payment_receipts(uuid) | bb255a6d28015bbaaf535efeb50b6f82 |
| create_listing_checkout(uuid,uuid,numeric,text,text,text) | 542c8d443af7b92327807c3d20cd0cee |
| increment_property_views(uuid) | 042ec68641d9d5f8b37035921c05424b |
| rls_auto_enable() | 6998ea6b4c2480f5d2e34b5dcf3f8d36 |
| search_properties(text) | a538798c80873fb4019e4ba5784cd95e |
| settle_listing_checkout(uuid,text,numeric,text,text,text) | bba5d6d93c229536cd0ed60e902f5ddc |

increment_property_views, search_properties and rls_auto_enable have explicit EXECUTE ACL entries for PUBLIC, anon, authenticated, service_role and postgres. rls_auto_enable is SECURITY DEFINER; the other two are invoker. An event-trigger function is not an ordinary REST-callable function; do not infer exploitability solely from its ACL. Event-trigger registration/ownership and definition must be inspected separately.

Export CSV was attempted after the successful result, but the browser download wait timed out and subsequent tab access reported an unattached debugger. The export file and screenshot were not verified; this checkpoint is a transcription of the visible seven-row result, not a complete raw catalog export. No further UI actions were taken after failed recovery.

Remaining evidence: full columns/defaults/types, constraints/indexes, grants/default ACLs, RLS expressions, storage configuration, publication membership, triggers including event triggers, and privately reviewed definitions. Baseline implementation and isolated provisioning remain gated on these items and their existing approval boundaries.

### Resumed metadata collection

The owner re-enabled browser access. Detailed and private-definition read-only captures then succeeded; the preceding paragraph describes the earlier interruption and is superseded by `phase4-state-comparison.md`. CSV exports are now verified in untracked docs/evidence/ (including the original summary download). Captured scope includes 182 columns, 65 constraints, 41 valid indexes, 24 policies, default/table/schema ACLs, storage bucket configuration, event triggers, role memberships, actual defaults and six public function definitions. No application data was read or changed.

The comparison identifies a saved_searches unconditional ALL policy that differs materially from repo ownership policies, plus type/nullability/storage/index drift. These differences must be resolved explicitly in the baseline design; no live fixes or baseline adoption were performed.

### Repository-only baseline draft

Following owner approval to continue, `phase4-baseline/` now contains an unexecuted guarded SQL draft, observed/desired manifest, offline verifier and review runbook. It is outside automatic migrations. Offline coverage/negative checks pass; no PostgreSQL parse/execution or isolated setup has occurred. See that directory's README for the proposed saved-search policy deviation, excluded environment helper and unresolved prerequisite versions. Legacy files and the current database remain unchanged.

### Owner pause and next resume

Tooling/local setup was later authorized and started, but the owner paused downloads and Phase 4 because of a temporary data limit. Docker Desktop was stopped; no baseline SQL ran. `phase4-local-status.md` is the authoritative latest checkpoint and exact resume sequence. Do not restart downloads automatically. Earlier statements about unapproved tooling describe prior checkpoints and are superseded there.

## References

- Supabase migration workflow: https://supabase.com/docs/guides/deployment/database-migrations
- CLI migration history and repair: https://supabase.com/docs/reference/cli/supabase-migration-list and https://supabase.com/docs/reference/cli/supabase-migration-repair
- CLI dump behavior (managed schemas and data excluded by default; grants need review): https://supabase.com/docs/reference/cli/supabase-db-dump

Official migration/CLI docs were consulted during inventory. The markdown changelog endpoint could not be fetched by the web tool; the HTML changelog was accessible. Version-specific commands must be rechecked before implementation.
