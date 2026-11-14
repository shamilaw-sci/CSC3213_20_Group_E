# User and Buyer fix retest queue

Operator: user. Guide one case at a time in Sinhala with English UI terms; append actual results to manual-e2e-run-log.md. Automated results do not close manual acceptance.

| Order | Case | Expected | State |
| --- | --- | --- | --- |
| 1 | Profile phone 123 | Reject with clear error; original valid number remains after refresh | Pass by user report, 2026-11-12 |
| 2 | Valid phone update | Save without password; remains after refresh | Pass by user report, 2026-11-12 |
| 3 | Email wrong current password | Incorrect-password message; saved email unchanged | Pass by user report, 2026-11-12 |
| 4 | Seller request refresh | Existing pending request restored; no resubmit button | Pass by user report, 2026-11-12 |
| 5 | Admin Seller notification | Bell shows pending request and opens Role Requests | Pass by user report, 2026-11-12 |
| 6 | Seller approval/rejection | Atomic request/role outcome; correct Buyer navigation after refresh | Approval and rejection success by user report, 2026-11-12; rejected Buyer role refresh confirmation pending |
| 7 | Home place search | Map focuses correct current query; second place does not retain first boundary | Pass by user report, 2026-11-12 |
| 8 | Saved search boundary | Run saved search restores matching WKT shape and criteria | Pass by user report, 2026-11-12 |
| 9 | Price analytics | Visible target value, usable comparables or clear insufficient-data state; missing building floor area not inferred from land | Layout/readability accepted by user, 2026-11-12; source data and insufficient-data path still pending |
| 10 | Apple icon | Correct icon visible on login | Pass by user report, 2026-11-12 |
| 11 | Feasibility LKR | Grouped money inputs and amount words; valid numeric requests | Pass by user report, 2026-11-12 |
| 12 | Feasibility restore | Restores all inputs, recalculates; latest restore wins and edits invalidate old result | Saved inputs/result restore pass by user report, 2026-11-12; latest-restore/edit checks pending |
| 13 | Feasibility invalid deductions | Clear field reason; recovery with valid input | Pass by user report, 2026-11-12 |
| 14 | AI launcher | Drag bounded, no accidental open; regular click and keyboard work | Pass by user report, 2026-11-12 |
| 15 | Guest booking | Single disposable request reaches correct Agent without account binding | Verified signed-out submission and exact-note Agent contact-only handoff pass by user report, 2026-11-12 |
| 16 | Booking CRM/chat | Distinct appointments retained; linked thread not duplicated or falsely confirmed; correct recipient | Duplicate representation and correct chat recipient pass by user report, 2026-11-12; new-booking confirmation label check pending |
| 17 | Chat drafts | Draft stays with correct conversation through switches/send failure/account changes | Conversation-switch isolation and controlled offline send recovery pass by user report, 2026-11-12; account-change check pending |
| 18 | Booking notification | Agent bell shows actual pending booking and opens exact dossier | Pass by user report, 2026-11-14; bell notification opens matching booking dossier |

Correct-password email verification was previously accepted by user and explicitly excluded from repeat testing.

- Additional retest: rejected Seller request message in Buyer Profile Settings and Become a Seller remains after refresh. Pass by user report, 2026-11-12.
