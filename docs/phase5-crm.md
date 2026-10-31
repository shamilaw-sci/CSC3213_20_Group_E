# Phase5 CRM checkpoint

Date2026-10-30,Asia/Colombo. Baselineversion-3.0/8625cbb with earlier uncommitted Phase5 work retained. One CRM test/fix batch only;owner keeps staging/commit/push.

## Status

Complete within the agreed CRM pipeline scope. Direct-lead metadata persistence and open-detail recovery defects are corrected with bounded production changes. Focused checks,real repeats,aggregate verification and review passed. Receipts/checkout remain separate sessions;four of six Phase5 flows now have scoped acceptance.

## Initial evidence and diagnosis

| Check | Observed result |
| --- | --- |
| New snapshot guard before mappings | Intended unsupported-table red;1failed/11passed |
| Snapshot guard after four static mappings | 12/12pass |
| Read-only CRM preflight | Pass;verifiedlocalDB/REST/API/marker/checksums/ledger |
| Initial real CRM | 8passed/2failed of10;14.401s;tencompleteapp snapshots/ledger preserved after cleanup |
| Initial rendered AgentDashboard | 8passed/2failed of10;10.11s |

Real API errors:

```text
direct metadata and partial updates preserve omitted values
Expected: lead_status=Offer,timeframe=1-3 Months,pre_approved=true
Received: lead_status=Offer,timeframe=ASAP,pre_approved=false

invalid direct timeframe
Expected status >=400;received200
```

The direct-lead repository updated lifecycle and timestamp only,discarding supplied timeframe/pre-approval fields. It also defaulted omitted lifecycle to New. Existing full/partial metadata assertions are retained;the bounded correction maps only supplied values and preserves omitted fields/owner predicates. No new API status/role/schema policy is introduced.

The corrected direct update conditionally maps timeframe to timeframe_to_move and pre_approved to pre_approval_status,including false,and only maps lifecycle when lead_status is supplied. Approved-agent/row ownership predicates remain unchanged. PostgreSQL enum rejection leaves the row unchanged;the generic error-handler500 contract is retained rather than introducing a new status policy.

Rendered failure:after rejected stage PUT and successful authoritative reload,the pipeline card recovered but the open details selector kept the attempted Closed stage instead of New. Its separate selectedLeadDetail state was not reconciled. A second initial test failure was an ambiguous Delete Lead query matching both card and modal buttons;that is a test selector issue,not a reproduced deletion defect.

The dashboard now restores previous card/detail stage immediately when mutation fails,including when the recovery refresh also fails. Successful reload synchronizes open detail with authoritative returned lead data. The deletion test selects the visible modal text button without changing deletion behavior. Production changes are confined to agentRepository.updateLeadMetadata and these dashboard recovery/synchronization lines;no controller/role/schema/dependency changes.

## Verification after bounded fixes

| Check | Observed result |
| --- | --- |
| Focused repository regressions | 8/8pass;1.399s |
| Focused rendered AgentDashboard | 11/11pass;includes mutation+refresh double failure |
| Bounded CRM-only review | Spec match;quality clear;no actionable findings;no tests rerun by reviewer |
| Migration filename/checksum guard | 2ordered versions/checksums pass |
| Full backend permitted run | 35suites,399/399pass;8.716s |
| Final real CRM run1 | 10/10pass;8.526s;ten full snapshots/ledger preserved |
| Final real CRM run2 | 10/10pass;6.676s;ten full snapshots/ledger preserved |
| Focused dashboard repeat | 11/11pass;6.15s;first corrected run also11/11 |
| Full frontend | 26files,119/119pass;81.78s |
| Frontend lint/build | Both exit0;build4.09s;existing large-chunk/Lottie direct-eval warnings remain |
| Direct CRM config without launcher | Expected refusal before tests/writes;Verified integration launcher required;0tests |
| Shutdown | Exact DB/REST/Storage services all confirmed exited;containers/volumes/config retained |
| Final hygiene | 67 changed/new non-evidence files credential/whitespace clean;git diff --check clean;index empty;private evidence remains untracked/unstaged |

One attempted final real run was refused before writes because Docker Desktop's engine pipe disappeared. Owner reopened Docker;exact retained DB/REST identity/bindings were inspected again and read-only preflight passed before resuming. The first full backend run also hit sandbox loopback denial (`connect EACCES 127.0.0.1:<ephemeral>`;90failed/309passed);the required permitted rerun passed399/399. These environment failures did not require product changes or extra unrelated suite runs.

The real invalid-enum path logged `invalid input value for enum lead_timeframe: "Invalid enum"` and HTTP500,with complete fixture rows unchanged. No generic network failure was substituted for this database rejection evidence. Existing profiles were not rerun without cause:CRM adds only a static profile/table allowlist,retaining prior settings and transport;the full backend guard tests passed. No application-source changes followed the final passing checks/review.

## Scope and preservation

Use existing combined direct-booking/conversation CRM GET/PUT/DELETE and real guest booking creation. Cover five lifecycle stages,normalization,joins/latest note/order,metadata/partial persistence,roles/ownership/invalid payloads and owned delete/cascades. Render actual dashboard with controlled API/dialog/toast boundaries;no real polling/services/maps.

Fixed CRM profile adds four static snapshot keys (leads:lead_id,conversations:id,messages:id,message_receipts:message_id,user_id) to existing six-table preservation. Complete ten-table snapshots include users,properties,saved_searches,transactions,payment_orders,payment_receipt_outbox and those four CRM tables. Existing profile settings and base network/dotenv/email/worker guards remain unchanged. Port5000/Storage/external calls remain forbidden.

Fixtures are exact UUID/example.test users,own image-free property,property/support conversations,messages/receipts and API-created guest leads. Cleanup recovers direct leads by exact fixture-agent IDs,checks conversation ownership and receipt users,then deletes only owned child records/conversations/leads before own property and exact UUID/email users. Parent compares complete baseline state after failure as well as success. No resets,broad deletes,nativeStorage changes or baseline mutation.

## Limits and next checkpoint

This batch concerns agent CRM pipeline,not contact-form admin inquiries,new note editing,signed-in booking conversation-link repair,read-receipt API,payments or durable delivery. Canonical conversation type supports property/support;tests use property rather than altering schema for optional type=agent booking linkage. No browserE2E/manualdemo or remoteCI has run. Installed/pinned local behavior and actual SQL determine results;no dependency/schema/env upgrade is part of the batch.

Resume from `docs/phase5-checkpoint.md`;the next session handles receipts only. CRM is closed within the stated scope. Avoid repeating full suites without a relevant change/failure. All private diagnostics stay untracked under docs/evidence. No staging,commit,push or deployment was performed.
