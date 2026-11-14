# Phase 4: observed database state and baseline decisions

Date: 2026-10-29. Status: read-only inspection checkpoint; no baseline migration implemented or applied.

Subsequent outcome (2026-10-30): canonical isolated migrations and verification are recorded in phase4-verification.md and setup.md. This document preserves the source-state comparison; the hosted database has not been changed.

## Collection and limits

An existing authenticated ThirasaraDB dashboard session was used after direct PostgreSQL access failed. Catalog/configuration queries ran inside `BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY` with 30-second statement and 3-second lock timeouts. Full editor text matched each reviewed query string after CRLF normalization before execution. Summary, detail and definition captures were separate snapshots, not one atomic snapshot; all six public function fingerprints agree between summary and definition captures.

The summary returned seven sections. The detail query returned eleven aggregate sections. The private definition query returned six aggregate sections. They selected catalog metadata and storage bucket configuration only: no application records, auth user records, storage objects, vault values, payment operations or emails. No SET ROLE probes, application RPC calls, DDL, DML or migration-history repair were executed. Dashboard query snippets/history are normal inspection artifacts; the current application schema/data were preserved.

The broad `phase4-metadata-readonly.sql` file remains an unexecuted reference draft. The executed summary is recorded in `phase4-metadata-summary.sql`. Detail capture selected the same core catalog families with JSON aggregation plus event triggers, role flags and storage configuration; column defaults were initially fingerprints. Private definition capture subsequently selected actual defaults, public non-extension function definitions, schema ACLs, role memberships, publication flags and effective table privilege predicates.

Downloaded CSVs were copied byte-for-byte into untracked `docs/evidence/`. Copies were verified with SHA256. Do not commit them; function bodies/default expressions require private review before sharing. The earlier export timeout did download the summary file; its presence and contents were confirmed during this continuation.

| Local private evidence | SHA256 |
| --- | --- |
| `docs/evidence/phase4-summary-2026-10-29.csv` | A34616488464F34B3987812D4F289A56EDC620FC478B89C8B088AB87C048D01A |
| `docs/evidence/phase4-details-2026-10-29.csv` | 049AE640CE41485E7F0407921D55314B4285A180AA58021CFC734CFC07C62687 |
| `docs/evidence/phase4-definitions-2026-10-29.csv` | F0DF3484EDE00BF039A6C68132F968D542510362A8A5393E8A173BEFAA73E7B6 |

## Coverage

| Metadata | Observed count/result |
| --- | --- |
| Public tables / columns | 19 / 182 |
| Public constraints | 65, all captured with definitions/validation flags |
| Public indexes | 41, all valid and ready |
| Public/storage policies | 24 (18 public, six storage) |
| Public table ACLs | 19; table owner postgres throughout |
| Relevant default ACL entries | 12, public/storage/extensions and global scope |
| Non-internal public row triggers | Zero |
| Event triggers | Seven |
| Public publication memberships | Zero |
| Publication flags | supabase_realtime exists, not all-tables; insert/update/delete/truncate enabled |
| Selected role flags | anon/authenticated/postgres/service_role |
| Role memberships | 18 relevant non-pg-only membership rows |
| Non-system schemas | Eight: auth, extensions, graphql, graphql_public, public, realtime, storage, vault |
| Storage buckets | Four configuration rows; no object contents |
| Actual column default expressions | 73 |
| Public non-extension function definitions | Six |
| Effective P2 table privilege checks | Five tables; SELECT/INSERT predicates for anon/authenticated/service_role |

PostgreSQL 17.6 and PostGIS 3.3.7 in extensions match the earlier summary. No public views/materialized views were observed by the summary's relation-kind query. No sequences appeared in the public table/sequence ACL query. The app's custom JWT authorization is separate from native Supabase authenticated identities; the catalog inspection does not prove end-to-end authorization behavior.

## P2 state compared with reviewed intent

- contact_inquiries exists with its primary key, four validated length checks and created_at/id index. anon/authenticated SELECT and INSERT privileges are false; service_role SELECT/INSERT are true. No public policy exposes it in the captured policy set.
- saved_searches.filters is nullable jsonb, with validated saved_search_filters_object check. Other saved-search permissions have a separate important discrepancy below.
- lead_lifecycle includes Offer after Closed, as recorded by the manual application history. Existing label ordering must be preserved.
- messages.recipient_receipts is boolean NOT NULL DEFAULT true. message_receipts has UUID message/user IDs, timestamptz read_at, composite primary key, both cascading foreign keys and its user/message index. Historical marker values and legacy shared timestamps were not read.
- payment_orders and payment_receipt_outbox have the reviewed checks, keys and indexes. transactions.payment_order_id has both unique and foreign-key constraints. The one-pending-order partial unique index is present and valid.
- anon/authenticated SELECT/INSERT privileges are false for message_receipts, payment_orders and payment_receipt_outbox; service_role privileges are true. These four private tables including contact_inquiries have table ACL entries for postgres and service_role only. Actual service_role ACLs contain more privileges than the explicit narrow GRANT statements because existing default privileges also apply; do not claim exact least-privilege equivalence.
- create_listing_checkout, settle_listing_checkout and claim_payment_receipts remain SECURITY INVOKER with postgres/service_role-only explicit EXECUTE ACLs. Extracted live function bodies match the reviewed payment-orders.sql bodies after whitespace/comment normalization. This verifies source agreement, not transaction concurrency, gateway behavior or effective HTTP authorization.
- All six public function definition fingerprints are stable between the summary and definition captures. No full payment verification was rerun.

## Material discrepancies and missing repository definitions

### Saved-search ownership policy requires a separate decision

Actual policy named `Users can insert their own saved searches` is PERMISSIVE, command ALL, roles PUBLIC, with NULL USING and WITH CHECK expressions. A separate ownership SELECT policy also exists, but permissive policies combine with OR, so it does not narrow the unconditional ALL policy. Repo `20260901000008_missing_schema.sql` instead specifies an INSERT ownership check and a separate DELETE ownership policy; the latter was not observed live.

Catalog checks also establish public schema USAGE for anon/authenticated, table SELECT/INSERT privileges for both, and broad table ACLs. Together these describe an unrestricted native database-role policy path for saved_searches. HTTP access and real user rows were deliberately not exercised; no data exposure test is claimed. Treat this as a high-priority confirmed policy/configuration discrepancy. Do not copy it silently into a desired baseline or silently repair the live database.

Proposed handling: keep an observed-state manifest separate from desired permissions. Prepare a separately reviewed ownership policy correction with appropriate app/Supabase identity assumptions and isolated cross-user tests. Applying it live requires explicit authorization. Baseline adoption must report this drift rather than declaring the existing installation equivalent to a corrected baseline.

Policy interpretation was checked against PostgreSQL 17 CREATE POLICY documentation: omitted expressions grant access to all rows, and applicable permissive policies combine with OR. Reference: https://www.postgresql.org/docs/17/sql-createpolicy.html

### Schema and index drift

| Area | Actual observation | Consequence |
| --- | --- | --- |
| agent_profiles.agency_name | Nullable; repo agent schema declares NOT NULL | Do not strengthen it blindly; existing null data was not inspected. |
| Agent profile additions | service_areas varchar(500), specialization varchar(50) with default, cover_image_url text | Missing from inventoried migration definitions. |
| users.theme_preference | varchar(50); repo profile update adds TEXT | Preserve actual type unless a type change is separately reviewed. |
| properties.listing_type | varchar(50) with default; repo missing-columns script adds TEXT without default | IF NOT EXISTS would hide this difference. |
| properties.contact_number | varchar(20); repo script adds TEXT | Type/length equivalence cannot be assumed. |
| messages.sender_id | text; users.id is uuid | Do not invent a UUID FK while reconstructing messaging. |
| messages.sender_role | Check allows BUYER/SELLER/ADMIN | Preserve actual contract; no auth-role behavior change is included. |
| transactions | status/payment_status-related actual types must be preserved; transaction status is text, properties.payment_status is text, properties.status uses property_status | Do not assign types based only on similarly named enums. |
| Transaction relationships | Captured FK exists for buyer_id and payment_order_id; no property_id/seller_id FK in captured constraints | Do not fabricate missing relationships. |
| Core extra columns | users.provider/provider_id; properties.address/views_count; conversations lead_status/timeframe/pre_approved; transaction currency/payment_method/seller_id | Full captured column map, not old migration fragments, must drive reconstruction. |
| messages conversation index | messages_conversation_idx already covers conversation_id | Avoid adding the equivalent idx_messages_conversation_id blindly. |
| property_views | No public table in summary | Its legacy index statement cannot enter an empty setup as-is. |
| Realtime | supabase_realtime exists with no public members | Commented leads publication statement is not an applied change. Do not enable publication implicitly. |

### Access and platform configuration

- Public table default privileges grant broad privileges to anon/authenticated/service_role. A fresh restore that adds only service_role grants without revoking defaults can expose new private tables. Explicit current table/function ACLs and RLS must be restored and tested, not inferred from CREATE TABLE statements.
- P2 private tables have no public policies in the captured set. Core tables such as users, properties, messages and conversations also have no public policies in this capture despite broad table ACLs and RLS enabled; native public roles therefore face default row denial for ordinary DML. Backend service_role bypasses RLS. Do not introduce generic auth.uid policies to make local tests pass.
- Leads retains a PUBLIC INSERT policy with WITH CHECK true. Public sales-history SELECT and authenticated-role-based INSERT policies remain as captured. These existing policy choices require explicit review if changed.
- PostgreSQL UPDATE policies with omitted WITH CHECK normally reuse USING; do not infer an ownership-transfer vulnerability from NULL WITH CHECK alone. The saved-search finding above is different because its ALL policy has neither predicate.
- Bucket configuration: avatars, chat-attachments and properties are public; logo is private. All four have NULL bucket-level size/MIME limits. This captures bucket configuration, not all application upload validation.
- Six storage policies exist. Avatar upload policy checks owner, and the live avatar UPDATE policy has a plural name; the repo uses different names/upload predicate and also includes an avatar DELETE policy absent from this capture. Storage policy reconciliation must prevent duplicate permissive policies on restore.
- Event trigger ensure_rls is owned by postgres, enabled for CREATE TABLE/CREATE TABLE AS/SELECT INTO and invokes public.rls_auto_enable(). Its definition was privately captured and includes RLS enabling and a function search_path setting. Its source/ownership as app versus platform configuration remains a baseline decision. The other six observed event triggers are owned by supabase_admin; do not recreate platform-managed triggers from an application baseline.
- Native role flags confirm service_role/postgres bypass RLS; anon/authenticated do not. Role membership and schema USAGE metadata were captured, but no role/security settings were modified.

## Concrete next design

1. Build a repository-only object manifest from the private evidence: all 19 table definitions, actual column types/nullability/defaults, enums in observed order, constraints/indexes, six public function definitions and explicit permissions. Treat managed schemas/extensions/event triggers as environment prerequisites; separately classify ensure_rls before emitting it. Review definitions for sensitive literals before any source file becomes tracked.
2. Record observed-vs-desired security differences explicitly, especially saved_searches. A safe desired baseline must not silently reproduce the unrestricted ALL policy, and an existing installation must not be marked equivalent while it remains divergent. This requires a reviewed decision before implementation.
3. Generate baseline migration files with approved, version-checked Supabase tooling only after tooling authorization. Archive/supersede legacy fragments with an explicit source map; do not replay them on the current installation. No historical migration ledger was found, so no history repair/adoption is authorized or implied.
4. After separate approval, provision a distinct local Supabase stack without live credentials or application data. Use dummy fixtures only. Verify two independent empty setups, exact schema/permission comparisons, private table/RPC denial, ownership isolation and schema-history checksums. Do not start payment/email workers or enable new realtime publication behavior.
5. Existing live installation remains untouched. Any later security correction, migration-history initialization/adoption or other live change needs its own reviewed SQL, rollback approach and explicit approval.

Inventory evidence is sufficient to prepare the next baseline draft, but implementation, isolated provisioning and permission tests have not occurred. Phase 4 remains open. No commit/push is requested at this checkpoint; the owner prefers one commit after the full phase.

## Subsequent draft checkpoint

The owner authorized continuation. `phase4-baseline/` contains the repository-only draft and its review manifest. The SQL is outside supabase/migrations and has not been executed. Static checks cover captured structure and the explicit desired policy deviation; four deliberate corruptions were rejected. Isolated tooling/provisioning, PostgreSQL validation, permission testing, migration tooling and existing-installation adoption remain pending. Docker's Linux engine was not running when inspected; it was not started.
