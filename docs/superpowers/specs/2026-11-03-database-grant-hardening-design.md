# Database grant hardening — proposed design

Status: owner approved the backend-only boundary and rollback-only candidate verification on2026-11-03. Candidate tested; not an applied migration. Scope: public application database privileges only. Existing manual Git and owner-applied schema agreement remains in force.

## Evidence and intended outcome

The guarded stack-c catalog and anonymous endpoint checks are documented in `docs/phase7-database-access-review.md`. Fifteen tables expose unnecessary whole-table privileges; public agent profiles include moderation fields; leads permit anonymous direct INSERT; sales history permits ownership-free authenticated INSERT. Deployed permissions and external clients are not inventoried.

Keep all current application operations through Node's authorized API and its backend service_role client. Go retains its separately configured direct database identity. Anonymous and Supabase authenticated clients must not access application tables or invoke application RPCs directly. This intentionally removes the direct database API interface; external consumers of that interface would need migration to Node endpoints before rollout.

## Approaches

1. **Backend-only application objects — recommended.** Revoke PUBLIC/anon/authenticated table and application RPC access. Smallest authorization surface and consistent with the repository's frontend/API architecture. Requires confirmation that external clients do not depend on direct access.
2. **Selective public reads and ownership policies.** Keep narrowly projected agent/history reads and reviewed per-user writes. Preserves direct clients but adds policy, projection and Supabase identity maintenance that the current frontend does not use.
3. **Remove only non-DML privileges.** Small compatibility impact, but leaves moderation exposure and direct-write bypasses. Suitable only as an interim reduction, not closure of the confirmed findings.

## Exact proposed boundary

Explicit application table allowlist: agent_profiles, agent_reviews, contact_inquiries, conversations, favorites, feasibility_history, inquiries, leads, message_receipts, messages, payment_orders, payment_receipt_outbox, platform_settings, properties, property_sales_history, role_requests, saved_searches, transactions, users.

Remove privileges held by PUBLIC, anon and authenticated on those19 tables, including any column-level grants discovered in preflight. Preserve existing service_role privileges, owners, RLS enablement, policies, data, indexes and constraints. Verify inherited role privileges: if an unexpected parent role still provides access, abort for review rather than altering shared role membership. Do not use an ALL TABLES IN SCHEMA command that could affect extension or future unrelated objects.

Explicit application function allowlist: claim_payment_receipts(uuid), create_listing_checkout(uuid,uuid,numeric,text,text,text), increment_property_views(uuid), search_properties(text), settle_listing_checkout(uuid,text,numeric,text,text,text). Revoke PUBLIC/anon/authenticated EXECUTE and preserve service_role EXECUTE. Use exact signatures, not every function in public. Preserve function bodies and SECURITY INVOKER behavior. No new definer function or view is needed.

Storage/Auth/Realtime/GraphQL schemas, bucket policies, extensions and credentials are outside this change. The existing private chat cutover remains separate. Do not remove database CONNECT or schema USAGE globally.

Local metadata shows broad public-schema defaults for postgres and supabase_admin. Do not silently change the managed supabase_admin role's defaults. Proposed first batch hardens existing explicit application objects only. Future application migrations must explicitly revoke public access in the same transaction; default-privilege hardening requires a separate creator-role inventory and compatibility decision. This residual risk must remain open after this batch.

## Packaging and preflight

Prepare a new owner-reviewed migration using the installed CLI's discovered migration workflow after approval. Never edit the two applied phase4 migrations, their manifests or canonical checksums. Capture exact object existence, owners, table/column ACLs, effective privileges, role inheritance and function signatures before drafting executable SQL. Refuse unknown/missing objects or changed service-role access. Verify Node's configured key is the intended backend service role without printing its value; do not inspect or rewrite real .env files as part of implementation.

Because the retained stack has a fixed two-migration identity, initially exercise candidate ACL changes inside a transaction that always rolls back. Do not add a migration to that database's ledger or weaken the existing ledger guard to make tests pass. Committed-migration testing later needs a separately identified owner-approved disposable environment and corresponding guard design.

## Acceptance criteria

- Before the candidate change, reproduce direct anonymous moderation-field access using synthetic data or metadata without returning existing user content.
- Inside a guarded rollback-only transaction, apply candidate ACLs; assert all19 tables deny the seven collected privileges to anon/authenticated and deny every discovered column privilege. Check PUBLIC grants and inherited privileges as well.
- Assert all five application RPCs deny anon/authenticated EXECUTE and retain service_role EXECUTE. Do not invoke settlement/receipt RPCs with real orders.
- Verify representative service-role reads and synthetic writes still work, including an agent lookup and lead creation; rollback all fixtures and ACL changes on success or failure. Preserve constraints and RLS.
- Verify the complete starting catalog ACLs, application snapshots and canonical ledger are restored after rollback. No TRUNCATE operation is necessary to test its denial.
- Existing guarded application profiles remain the API behavior baseline. HTTP tests against committed hardened permissions are a later environment gate; a single-connection transactional proof cannot establish PostgREST behavior under another connection's uncommitted ACLs.
- Before owner rollout, confirm external direct clients and Go database role compatibility; run affected login/roles, CRM, listings, saved searches and checkout acceptance in the separately approved hardened environment. No real gateway/email/account operations.

## Rollout and recovery

Owner applies only after compatibility and isolated acceptance pass. Read back effective permissions and make anonymous endpoint checks after deployment. Monitor API permission failures without logging keys/tokens or user content. Capture exact prior object ACLs privately; recover only the specific legitimate privilege required by a confirmed dependency. Do not restore broad anonymous grants as a generic rollback or grant moderation-field access to repair an unrelated feature. If the backend key is wrong, correct the owner-managed backend configuration rather than weakening database permissions.

## Approved scope and remaining gates

Owner approved the backend-only boundary for these19 tables and five application RPCs, including loss of direct Supabase client access. Candidate preparation and rollback-only isolated verification are complete. Live application, managed-role default changes and a committed disposable test database remain separately controlled. No commit, push or deployment is included.
