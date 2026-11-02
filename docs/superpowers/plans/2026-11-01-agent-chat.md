# Agent Dashboard chat presentation extraction

Approved preservation-only Phase 6 batch. Extract only the messages tab inner root to `AgentMessagesPanel`; retain conditional mounting, all 36 parent statements, state, requests, polling, send handler and refs in Dashboard.

1. Save the current parent in private evidence and characterize real parent selection, defaults, contact, alignment, persistence, polling, timer cleanup and send success/failure before extraction.
2. Move the exact JSX with raw variable/callback props, including the original messages-end div ref. Do not alter expressions, classes, native controls or keys.
3. Run the new tests, the four existing Dashboard test files and changed-source lint sequentially with bounded Node/Vitest workers.
4. Reconstruct the parent from the extracted JSX and verify full normalized source equality and 36 identical non-return AST statements. Record limitations and private logs; leave aggregate checks and maps to the coordinating agent.

Known behavior retained: polling continues off-tab; requests have no cancellation or stale-response guards; only the latest polling scroll timeout is cleared, while send scroll timeouts are untracked. No browser validation in this batch.
