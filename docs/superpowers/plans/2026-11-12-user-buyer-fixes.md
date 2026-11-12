# User and Buyer Fixes Implementation Plan

**Goal:** Fix the approved walkthrough issues and prepare one-at-a-time manual retests.
**Architecture:** Focused changes to existing React components, Node validators/repositories and guarded hosted SQL. Preserve unrelated dirty changes. No commits, pushes or hosted schema writes by assistant.
**Tech Stack:** React/Vite, Node/Jest, PostgreSQL/Supabase, Go map service.

## Tasks
- [ ] Profile: backend/frontend phone validation, missing-versus-wrong password messages, accurate password label. Add regression cases, observe failure, implement and run focused tests.
- [ ] Upgrade: load authenticated user's persisted pending request, confirm writes, retain retry/error state, verify Admin notification path. Prepare hosted approval SQL separately from isolated candidate and review schema/ACL assumptions. Test APIs/UI without executing real approvals.
- [ ] Search/analytics: diagnose focus/boundary, price-size unit/cohort handling and icon; add regressions and correct existing components. Validate build.
- [ ] Feasibility/AI: grouped LKR values, words, saved inputs restoration, actionable errors, viewport-bounded draggable launcher. Test input/restoration/drag behavior.
- [ ] Booking: diagnose guest failure, CRM mixed identities/stages, chat routing/drafts and notification path. Add meaningful integration regressions, implement only proven fixes.
- [ ] Review combined diffs and focused checks, record local versus hosted/manual status; restart required services and guide retests one at a time. Hosted function adoption remains owner-executed.
