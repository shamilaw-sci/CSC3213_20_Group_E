# Admin write confirmation and seller request preservation

Owner approved and implemented2026-11-04. This is prepared batch24, not a
production deployment or closure of Phase7.

## Changed behavior

Ban, unban and direct role editing validate target UUIDs. Role editing keeps the
existing allowlist and accepts only optional null/string reasons up to2000
characters, trimming whitespace before persistence. Invalid input stops before
writes. User updates select id/role and require a matching returned row. Missing
rows yield fixed404; malformed/mismatched results and unknown failures yield the
shared fixed500. Required agent profile updates also confirm agent_id and the
intended reason. If the user role was confirmed but that second write cannot be
confirmed, the owned fixed409 says the role changed and instructs the Admin to
refresh before retrying. The recovery event includes only validated user UUID
and a fixed stage, never the underlying error/reason.

Seller request creation no longer deletes pending records. A confirmed new
pending SELLER insert returns201. Only a returned23505 triggers lookup of the
same user's pending request: a matching pending SELLER returns200 with an
already-pending message and preserves existing ID/timestamps/reason/history.
Missing/mismatched conflict results yield fixed409; other errors or uncertain
transport failures remain generic failures. Every success requires a matching
UUID row. The server-selected SELLER target and current-BUYER precheck remain.
BuyerDashboard's existing Axios success path accepts both200 and201; no frontend
source changed. Existing Admin policies and unban-to-BUYER behavior are retained.

## Verification

- Offline actual-source synthetic probes reproduced zero-row ban200, ignored
  profile failure200 and pending deletion before a failed insertion. No live
  account, environment or DB was used.
- New tests initially38 failed/7 passed; implementation produced45/45. An added
  malformed array-ID regression then failed as expected and was fixed with an
  explicit string check. An installed-SDK mocked-fetch test confirms an empty
  PATCH result follows404, with exact method/body/filter/select and no network.
- Focused compatibility109/109 passed. Legacy Admin controller fixtures now use
  valid UUIDs, preserving their role/reason/message assertions.
- A sandbox HTTP run hit connect EACCES; the permitted full backend rerun passed
  **1257/1257 across84 suites,26.045s**. One command was initially launched from
  repository root (no package.json); verification was rerun from backend-node.
- Independent bounded read-only review found no actionable P1/P2 issues.
  Frontend's earlier305/305/lint/build result remains historical; no frontend
  rerun for this backend-only batch. Earlier Docker/local SQL acceptance predates
  this code. No new live DB/Storage/browser/production acceptance is claimed.

Supabase's current [update documentation](https://supabase.com/docs/reference/javascript/update)
and [maybeSingle documentation](https://supabase.com/docs/reference/javascript/maybesingle)
were consulted. The changelog Markdown endpoint could not be fetched by the web
tool (unsupported content type); the installed PostgREST source and mocked-fetch
test additionally verified zero-row handling for this exact dependency version.
No library changes were made.

## Limits and operations

Role/profile writes remain non-atomic. Partial409 is an observation after a
confirmed role write, not a compensating rollback, durable recovery queue or
guarantee that another Admin has not changed state afterward. Generic failure
also does not prove a write did not commit. Request creation does not lock the
user across the BUYER precheck; concurrent bans/resolutions and later changes
remain possible. Prepared seller-resolution SQL checks current BUYER at approval
time, but still requires separate owner adoption. History uniqueness is unchanged.
No automatic retry, deletion, overwrite or role reversion was added.

No schema/env/credential change, real account/provider/mail/payment operation,
Docker operation, dependency install/upgrade, staging/commit/push or deployment.
Seven substantial packages remain in [the tracker](phase7-remaining-work.md).
