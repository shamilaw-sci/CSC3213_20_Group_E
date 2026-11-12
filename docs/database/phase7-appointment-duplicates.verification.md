# Appointment slot SQL adoption and verification

These files are reviewed owner-run candidates; no hosted SQL was executed.

1. Confirm the intended project and adopt the existing account ownership / backend-only lead grants first. Run `phase7-appointment-duplicates.preflight-readonly.sql`; retain its output privately. It returns table/ACL metadata and problematic booking IDs/groups, excluding contact details and raw notes.
2. Resolve every reported unparseable or duplicate group deliberately. No script deletes or merges bookings or assigns accounts by email. Short historic `Morning`, invalid dates, unknown windows and account-bound `Direct Profile Booking` strings require owner review. They are not silently adopted.
3. Pause appointment creation. Run the entire `phase7-appointment-duplicates.hosted-review.sql` as the dashboard postgres connection. The script locks leads and repeats data/ACL validation, preventing writes between inspection and index creation. Lock timeout is 2 seconds and statement timeout is 30 seconds; a timeout aborts the transaction. For large datasets, review the maintenance window and timeout with the owner first.
4. Only after successful SQL adoption, start the dependent backend and run the user-operated booking acceptance cases. A PostgreSQL schema error is not a duplicate-booking conflict.

The backfill recognizes the exact full displayed windows and strict ISO calendar dates. Notes are optional; both the normal bullet and the existing repository's literal mojibake bullet delimiter are recognized. The display source is never rewritten. Non-booking CRM rows and guest/unbound rows remain outside the backfill. `lead_source` becomes text so the supported 2000-character notes fit. Paired slot fields and supported windows are checked in SQL; account-bound recognizable booking rows require complete slots. Partial uniqueness applies to account-bound complete slots, independently of notes, source format or agent on property bookings.

All adoption DDL/backfill is one transaction. On failure, issue ROLLBACK if the client keeps the failed transaction open. Do not run fragments or delete conflicting records automatically. After successful adoption, rollback needs coordinated backend rollback: dropping the two named indexes, the two named slot checks and the two slot columns removes enforcement/backfilled slots. Keep `lead_source` as text; narrowing to varchar(100) could destroy/reject subsequently entered notes. Review and back up before any post-adoption rollback.

## Local evidence, 2026-11-12

- Python syntax compilation passed for `phase7-appointment-duplicates.verify.py`.
- PostgreSQL execution is blocked: `psql`/`initdb` are absent, and Docker reports that `//./pipe/dockerDesktopLinuxEngine` does not exist. The installed Docker Desktop executable was started hidden; its process appeared but the engine remained unavailable. An elevated invocation of the harness failed before container creation or SQL execution. This is an environment limitation, not a SQL test pass.
- Reproduce when Docker's Linux engine is available: `python docs/database/phase7-appointment-duplicates.verify.py`. The harness creates a uniquely named disposable PostgreSQL 17 container without host ports, project environment files or hosted credentials, then removes that container in finally.
- Harness cases: invalid legacy windows/dates and Direct Profile Booking refusal; duplicate group/ID inventory and preservation; failed transaction rollback preserving varchar and rows; successful transaction rollback; backfill/display/guest/CRM preservation; two independent concurrent sessions and one persisted slot; named property/consultation conflicts; cross-agent property identity; cancellation/rebooking; consultation agent independence; DB slot completeness/window checks; long display notes.

SQL runtime correctness and concurrency remain unverified until that harness runs successfully. Owner adoption is a separate gate even after disposable tests pass.

References: PostgreSQL partial unique indexes https://www.postgresql.org/docs/current/indexes-partial.html and Supabase changelog https://supabase.com/changelog.md (checked during implementation; no relevant SQL breaking change identified).

Owner chose manual verification instead of Docker execution on 2026-11-12. Backend baseline regression passed 1372/1372 across 91 suites with auth feature flags disabled for baseline fixtures; feature tests manage their own flags. Frontend modal tests 3/3, lint/build passed. Independent review completed after guest partial-slot correction. SQL runtime/concurrency and hosted adoption remain unverified. Do not restart backend before schema adoption.
