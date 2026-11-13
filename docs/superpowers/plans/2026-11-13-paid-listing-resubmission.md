# Paid listing resubmission implementation plan

Goal is owner correction of a paid rejected listing without checkout.
Architecture uses a focused My Listings dialog and the existing owner PATCH route.

- [x] Add regression tests for paid resubmission, preserved fields/payment, concurrent approval and validation.
- [x] Correct partial update mapping and add conditional status guard at repository write.
- [x] Add prefilled rejected-listing editor with cancel, validation, saving lock and retryable error state.
- [x] Add integration tests proving one PATCH, same record, no checkout, cancel and failed-save retention.
- [x] Run focused backend/frontend tests, frontend lint/build and diff checks.
- [x] Restart identified backend and guide one manual resubmission case.

Use current checkout and existing UI dialog. Preserve media/geometry and payment linkage. No schema rollout. Owner handles commits/pushes.

