# Admin real-data completion manual acceptance

State: implementation/source review complete; runtime and SQL adoption pending. No tests/build/lint were run, as requested. Earlier automated totals do not validate these new changes.

## Rollout

1. User runs docs/database/phase7-admin-real-data-completion.hosted-review.sql in Supabase SQL Editor. The combined script covers all three feature migrations in one transaction. Existing soft-delete migration is prerequisite; previously applied audit/role SQL remains required.
2. Restart Node, frontend and Go map service with existing local configuration. Do not regenerate credentials or expose service keys. Go requires trusted backend DB role privileges listed in heatmap migration.
3. Record actual SQL outcome/runtime errors before performing writes. No historical search/report/boost records are fabricated.

## Guided checks, one at a time

- [ ] Reports: actual title/payer where stored, unavailable otherwise, full transaction UUID separate from gateway reference, counts/successful LKR total still match CSV/JSON. Archived transactions retained. No 1500/settlement/verified-seller fiction.
- [ ] Dashboard/Analytics: registered-user terminology, honest health/location descriptions, correct month/year labels, zero/no-data states, failure not presented as valid zero. Confirm existing totals.
- [ ] Featured Listings: find an eligible disposable approved/Paid listing; enable once, refresh, verify Home prioritizes it; disable, refresh. No public display of unpaid/rejected/archived property; no fictional fallback residences on empty/error. Verify audit target/property ID.
- [ ] District demand: inspect baseline window/count. Submit exact Kandy or Colombo query once using Home/Buy/Map/Smart Search, refresh demand, confirm expected district increment. Automatic pan/filter refresh must not count as a submission. Check date filters and no-data explanation. Counts are searches, not people; best-effort tracking may undercount.
- [ ] Listing complaint: signed-in disposable Buyer opens real public disposable listing and submits reason >=10 chars. Confirm Admin sees correct complaint/property/reporter, duplicate open submission blocked. Cancel resolution leaves open. Dismiss with note retains publication; refresh confirms resolver/time/note and audit record.
- [ ] Separate disposable complaint: archive decision removes listing from public discovery while retaining payment/chat history. Refresh report shows actioned; double resolution does not repeat/conflict. Do not archive unrelated or financial test fixtures without explicit selection.
- [ ] Role restore regression: existing accepted Buyer/Agent Ban-Unban paths remain. Internal reports inaccessible to unauthenticated/nonadmin readers; public submit response contains only confirmation metadata.

Document Pass/Fail/Blocked from the operator's actual observation in manual-e2e-run-log.md. Do not claim exhaustive role/security/concurrency coverage. User controls commit/push; exclude private runtime logs.
