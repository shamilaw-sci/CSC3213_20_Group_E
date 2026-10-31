# Phase 5 Saved searches design

Status: testing scope approved by the owner's 2026-10-30 `ok Continue` after the four-flow description. This document makes that scope concrete using the inspected API. Continue within that authorization; production changes require a reproduced defect and bounded proposal. Owner keeps commit/push.

## Goal and approach

Prove the existing saved-search lifecycle, criteria persistence/replay, ownership and matching coordination with repeatable controlled-data success/failure tests. Recommended approach: real isolated DB/API tests plus rendered frontend tests. Mock-only tests miss persistence/join behavior; full browser/deployed-service E2E would add external dependencies outside this increment. Use the retained stack-c DB/REST and existing harness. Storage/PayHere/ngrok are unnecessary here.

## Actual supported behavior

Routes are POST/GET `/api/saved-searches`, DELETE `/:id`, PATCH `/:id/alerts`. No criteria-edit endpoint exists; update coverage means alert preference persistence, not a new edit feature. DELETE currently returns200 for missing/foreign IDs while owner-qualified predicates must preserve the row. Alert toggle returns404 for missing/foreign IDs. Duplicate saves are separate records; no schema uniqueness guarantee is asserted. Repeat listing approval must not repeat matching coordination.

Persist and retrieve full version1 filters, zero rooms, types, price range and polygon; preserve legacy filters/default title. Reject malformed UUIDs, invalid filter versions/ranges/types and malformed alert bodies without DB changes. Ignore client-supplied owner identity. Verify anonymous/banned rejection and isolation for multiple authenticated roles/users using actual login sessions.

## Matching and delivery boundary

Keep actual `checkSavedSearchMatches`, `searchMatcher`, repositories, Supabase joins and admin approval behavior. Capture only emailService exports as inert spies: saved-search alert and seller-status calls. No SMTP, queues, cron or worker activation. Use unique run-tagged searches/properties and prove recipient/title/property arguments, disabled alerts, nonmatches (location/full filters/legacy), toggled preferences and deleted searches. Test one failing email promise without breaking other deliveries/approval. Repeat approval must produce no second alert. Poll boundedly for fire-and-forget completion; do not use fixed long sleeps. Expected counts must be scoped to unique fixture search titles, not depend on unrelated baseline search matches. Validate baseline preservation before/after every run.

## Isolation and cleanup

Add fixed `saved-searches` profile; only add `saved_searches:id` to the snapshot allowlist. Snapshot complete users, properties, saved_searches, transactions, payment_orders and payment_receipt_outbox. Existing DB/API identity, migration checksums/ledger, dotenv suppression and numeric loopback network restrictions remain mandatory. No caller-provided test target, no Storage port or5000 permission. No application environment changes, migrations, dependencies or external writes.

Seed UUID/example.test users, synthetic image-free properties and uniquely titled searches. Cleanup searches only for exact run-owned user IDs, then owned properties and exact UUID/email users; recover API inserts by owner IDs after failed responses. Check cleanup ownership before destructive fixture SQL. Never bulk-delete, reset, alter baseline rows or remove Docker resources. Parent full snapshots and ledger checks run after failures too. Start/stop only inspected retained DB/REST; keep Storage stopped.

## Frontend proof

Render MapTopBar save success/failure/cancel/no-boundary paths; assert serialized full criteria and effective price cap. Render ProfileSettings with controlled API responses to prove alert toggle persistence/rollback, delete success/failure and saved-search replay navigation. Keep existing map-hook full/legacy replay tests. No frontend redesign or product changes; no real maps/geocoding calls. These are rendered component/hook tests, not browser E2E.

## Acceptance and limits

Run real profile twice with unique fixtures and full state preservation; focused rendered tests twice; Login/roles and Listings regressions, full backend/frontend, lint/build sequentially. Review tests and harness changes, scan changed/new non-evidence files for credentials/whitespace and keep index empty. Record actual results, defects and limits in `docs/phase5-saved-searches.md`. Local custom-auth/service-role integration does not establish a complete RLS audit. No persistent email retry/outbox, malformed legacy geometry repair, new criteria editor or historical data cleanup is included.
