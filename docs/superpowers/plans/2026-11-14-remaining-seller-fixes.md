# Remaining Seller fixes implementation plan

Approved spec is docs/superpowers/specs/2026-11-14-remaining-seller-fixes-design.md.

- [x] Task 1 form integrity. Add contact/spec validation at step and submit, server validation, immediate GPS map recenter, upload error recovery and inline panorama limit feedback. Own AddProperty/usePropertyForm/propertyValidator and related tests.
- [x] Task 2 UI feedback. Use existing in-app dialog for listing deletion with pending/error/cancel safety. Improve review photo-overlay price contrast. Own MyProperties and ReviewPublishStep plus related tests.
- [x] Task 3 analytics. Add privacy-minimal daily property view buckets from atomic increment RPC, Seller-scoped last-7/previous-7-day API, real daily inquiries and views, truthful empty/growth states, remove fixed demand/growth/promotional statistics from Seller dashboard. Date boundaries Asia/Colombo. No historical daily view backfill.
- [x] Task 4 verify/review. Run focused and complete impacted suites, lint/build, security/ownership/date-window tests, review schema/API/UI and correct blockers. Docker tests skipped per user request.
- [ ] Task 5 deliver reviewed additive SQL for owner application, then restart backend and guide manual retests one at a time. No commits/pushes or assistant hosted schema changes.

Existing soft-delete filters and history retention remain in force. Agent edits use distinct files. No additional mobile scope.

