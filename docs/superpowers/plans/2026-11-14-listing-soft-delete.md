# Listing soft delete implementation plan

- [ ] Add failing archive/history/visibility and Go query tests.
- [ ] Implement idempotent owner/admin archive and active-query predicates.
- [ ] Preserve historical chat/payment metadata and prevent new activity on archived listings.
- [ ] Prepare reviewed additive hosted SQL with indexes, policies, guards and RPC changes.
- [ ] Revalidate map cache hits and adjust deletion confirmation copy.
- [ ] Run affected suites, lint/build, SQL/Go runtime checks where available and code review.
- [ ] Deliver exact SQL rollout and verification steps for owner execution before service restart.

No hosted schema mutations by assistant. Commits/pushes remain with owner.
