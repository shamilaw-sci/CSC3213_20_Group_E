# Agent fixes focused retest

Operator: user, guided one case at a time. Do not repeat accepted Buyer/Seller/CRM flows. Record actual outcomes in manual-e2e-run-log.md. Automated checks do not close manual acceptance.

## Prerequisites

- Agent cover-position SQL applied by user: screenshot confirms integer columns, default 50, NOT NULL. Follow-up read-only PostgREST zero-row query for cover_position_x/y/languages returned HTTP 200. No assistant hosted writes performed.
- Restart the updated backend and refresh frontend.
- Preserve approved G1 and rejected G2. New pending applicant G3 is needed to verify registration and notifications without rewriting historical fixtures. Use an inbox controlled by the operator.
- Historical rejection mail is not automatically resent. Verify mail only on a fresh confirmed rejection.

| Order | Issue | Check | State |
| --- | --- | --- | --- |
| 1 | AGENT-06 | G1 Studio: save English, Sinhala, Tamil; public profile and reopened editor retain all three after refresh. Save another field and confirm Tamil still remains. | Pass by user report, 2026-11-14; languages retained after refresh and another-field save. |
| 2 | AGENT-07 | G1 cover: move horizontal/vertical sliders, verify live preview, save and refresh; signed-out rendering uses same position. Cancel discards a changed position. Selecting new image/preset resets to center. | Preview/save/refresh and retained slider values: Pass by user report, 2026-11-14. Cancel: Pass by user report. Reset and preset replacement: Pass by user report. Signed-out display: Pass by user report. AGENT-07 accepted within guided scope; custom-upload reset covered automatically. |
| 3 | AGENT-01 | Register G3 as Agent with identifiable Agency Name and optional license; pending Profile shows awaiting-review explanation and no actionable Open Agent Hub. | Pass by user report, 2026-11-14. |
| 4 | AGENT-02 | Admin bell includes pending Agent application after opening/refresh interval; action opens Agent Approvals. Existing Seller/listing alerts still appear when present. | Pass by user report, 2026-11-14; display and navigation accepted. Existing queue regression covered automatically. |
| 5 | AGENT-03 | Admin G3 card/details show exact supplied Agency Name/license. Omitted optional fields show clear absent-value labels. | Supplied G3 details Pass by user report, 2026-11-14; absent-field labels covered automatically. |
| 6 | AGENT-04 | Review Details exposes correct stored applicant information before decision, readable in light/dark; rejection dialog is the sole overlay and cancel restores review context. | Pass by user report, 2026-11-14; details, modal sequencing/cancel and Light/Dark readability accepted. |
| 7 | AGENT-05 | Reject G3 with identifiable reason once. Confirm pending removal, rejected account Profile reason after refresh, and delivered email exact reason. If mail fails, Admin sees delivery warning without false role-write failure. Public Agent profile remains unavailable. | Primary rejection/Profile reason/email path Pass by user confirmation, 2026-11-14. Mail-failure branch covered automatically; access guard reuses prior acceptance. |

Do not send WhatsApp messages or repeat purchases/listing submissions. Existing missing registration data cannot be reconstructed automatically; current approved G1 agency was already corrected by the operator during testing.

Guided acceptance for all seven reported Agent fixes completed by user report on 2026-11-14. Unexecuted branches remain explicitly identified above; general Admin role testing is separate.
