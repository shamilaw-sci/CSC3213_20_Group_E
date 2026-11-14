# Phase 4 latest checkpoint

Date: 2026-10-30. Status: canonical isolated migration/reproducibility verification passed; final review/manual commit handoff. The authoritative runbook is setup.md and detailed evidence is phase4-verification.md.

## Completed

- Read-only repository and actual-schema inventory, including historical versus fresh evidence and drift.
- Pinned Supabase CLI 2.122.0 package/lock in tools/database; application dependencies unchanged.
- Archived fourteen legacy fragments byte-for-byte with original-path/SHA256 source map.
- Two CLI-generated canonical migrations and immutable-content manifest, with LF checkout policy.
- Independent empty setups, exact resulting-state comparisons, dummy rollback permissions, guard rejection checks, standard ledger and no-op repeated migration apply.
- Existing-installation adoption/rollback procedure; no automatic live adoption or policy repair.

## Local resources

Official images are cached. Private logs/configuration/credentials and data volumes remain under the isolated Docker projects and docs/evidence/phase4-local; keep evidence untracked. Do not print raw startup/status logs or private Compose files. Unrelated stopped containers/images were never modified.

The original CLI custom-network setup published broadly on this Docker Desktop engine. Its empty services were stopped before application SQL, then recreated with explicit loopback bindings. Test scripts reject unsafe bindings. Do not use native CLI start to recreate these corrected containers. Use the recorded private Compose files for this workspace and the runbook's identity checks.

Validated canonical proof environments are stack-c and fresh stack-b ledger-proof. Earlier a/b draft volumes and stopped backups are retained rather than deleted. Test services are stopped at final handoff to free resources; Docker Desktop itself and cached artifacts may remain available. Inspect actual status before restarting anything.

## Resume and boundaries

Start from setup.md and phase4-verification.md, not the earlier paused-download instructions. The owner resumed with an unmetered connection; no recurring downloads are scheduled. Reuse cached images/tooling. No application schema SQL needs to be replayed on the proved environments; migration up should be a no-op.

All phase changes are uncommitted. The owner performs every commit/push and prefers one commit after the full phase. Never stage docs/evidence/. No PR or deployment is requested.

Live DB/schema/data remain untouched. The saved_searches unrestricted live policy is still a separate explicit-permission follow-up. Existing installation history/adoption is not authorized. Real payment/E2E/email/cron activation remain outside this phase's validation.
