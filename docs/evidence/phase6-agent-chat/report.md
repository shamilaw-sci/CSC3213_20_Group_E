# Agent Dashboard messaging extraction evidence

`AgentMessagesPanel.jsx` owns only the exact messages-tab presentation root. Dashboard retains conditional mounting and all 36 non-return statements, including state, refs, effects, API orchestration and handlers.

Interface: `leads`, `selectedLead`, `setSelectedLead`, `chatMessages`, `user`, `messagesEndRef`, `handleSendMessage`, `messageInput`, `setMessageInput`, `sendingMsg`. All props retain original variable names and callbacks; messagesEndRef is attached to the original final stream div. Native buttons/form/input, keys, strict sender equality, defaults, classes and expressions remain unchanged.

Verification:

- Original parent new characterization tests: 5/5 passed before extraction (`original-tests.log`). Initial run exposed an accessible-name fixture assumption (adjacent spans concatenate); corrected selectors before the passing baseline.
- Extracted parent plus integration/KPI/panels/CRM files: 30/30 passed across five files (`extracted-tests.log`).
- Final messaging rerun: 5/5 (`final-messages-tests.log`), after test-only cleanup improved to restore any preexisting scrollIntoView descriptor and strict sender comparison strengthened to numeric 7 versus string '7'.
- Changed-source ESLint: exit 0, empty `eslint.log`.
- Executable `verify-reconstruction.mjs`: complete normalized source reconstruction equals `Dashboard.before.jsx`; all 36 parent non-return AST statement slices identical (`reconstruction.log`). Snapshot is the latest CRM-complete parent, not the pre-CRM snapshot.

Tests characterize empty conversations/prompt, selection and optional contact/property defaults, strict bubble alignment, draft/selection persistence across conditional tab unmount, initial conversation GET and 4-second polling, smooth scroll, interval/latest pending scroll cleanup on unmount, trimmed FormData POST before refresh GET, immediate draft clearing, pending disabled send, whitespace disabled send, failure toast and submitted-draft loss without refresh. All APIs are controlled mocks; fake timers are scoped to the polling test and restored after cleanup.

Limitations: no browser/visual acceptance or live APIs. Known races remain: no abort/stale-response guard, polling continues off-tab, only latest polling scroll timeout is tracked, send scroll timeout remains untracked, failed sends lose submitted draft. Tests do not assert away these behaviors. No backend/services/dependencies/environment/git mutations. Aggregate frontend/backend/lint/build and independent review belong to the coordinating agent.
