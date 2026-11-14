# Appointment owner identity rollout gates

Prepared2026-11-03. Owner approved code/schema-candidate preparation, then separately approved fresh local committed-schema acceptance. Live application/production migration is not authorized. This is an adoption checklist, not a runnable deployment script.

Local result2026-11-03: [committed-schema HTTP/FK/join acceptance passed](phase7-local-acceptance.md), including account deletion preserving/unbinding the agent lead and email changes retaining ownership. Live application/retention decision/production migration packaging still require owner handling. Original candidate file remains unapplied; separate test-target SQL was used.

## Dependency order

1. Inventory direct database consumers and verify Node uses its backend service role. Apply reviewed backend-only lead write permissions in the separately approved target before relying on server-assigned ownership. Existing permissive direct lead INSERT allows arbitrary client-supplied fields; frontend request filtering alone cannot secure that path. The schema candidate and CRM preflight deliberately refuse anon/authenticated effective INSERT/UPDATE column privileges.
2. In a separately approved disposable environment, validate the candidate nullable leads.buyer_id FK/index, ON DELETE SET NULL and absence of email backfill. Test foreign/missing user IDs and synthetic user deletion preserving agent lead data/unbinding ownership. Confirm intended retention policy before owner application. No candidate SQL has been executed in this batch.
3. Exercise committed-schema HTTP signup/login/guest and authenticated booking, own appointment reads/cancellation, same-email outsider denial, account/contact email changes and historical NULL exclusion. Existing retained stack-c has neither this schema nor hardened ACLs; CRM now refuses before API checks/fixture writes. Its two-file migration ledger guard is unchanged.
4. Owner packages reviewed changes as a new migration using the installed CLI workflow, adds the reviewed checksum manifest entry, and coordinates schema-before-code rollout. Do not copy isolated-guard SQL into a live SQL editor or edit applied baseline files. The current candidate is intentionally not directly applicable to live.
5. Deploy dependent backend only after schema and restricted lead writes are confirmed. No old-schema/email fallback. Verify actual reads/writes/cancellation and user messaging under the new rules; record CI and browser acceptance after owner-managed commit. No agent stage/commit/push/deploy.

## Intentional user-visible differences

New signed-in bookings bind to the authenticated account even when contact email differs. Email changes do not transfer appointment ownership. Anonymous/old guest bookings remain unbound and are not automatically discovered/cancelled by matching account email. Assigned agents continue to manage their own lead records. No verified claim/recovery flow exists yet; communicate agent-assisted historical booking handling before release. Existing frontend endpoints/response shapes remain; actual UI/history acceptance is pending.

## Recovery limits

Do not revert to email-based authorization to repair history visibility. If adoption fails, keep account appointment routes unavailable while preserving data and investigate precise schema/key/permission failures. A downgrade that drops buyer_id destroys binding information; no automatic column drop/reversal is supplied. Preserve the new column/index and private ownership metadata during investigation. New code against old schema fails; guest booking inserts also require the new column even though their owner is NULL. No seamless mixed-version/rolling compatibility is claimed.
