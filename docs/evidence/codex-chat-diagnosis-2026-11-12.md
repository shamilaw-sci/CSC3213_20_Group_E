# Codex stalled-chat investigation ? 2026-11-12

Read-only inspection of local configuration, session JSONL and logs_2.sqlite. Times below are Asia/Colombo.

## Confirmed evidence

- Buyer E2E thread: 01a1caa7-ff51-7742-9cf1-19ee723ff9b9.
- Its transcript contains a custom_tool_call named exec at 2026-11-11 18:36:32 for call_3fa6755d8d26451794ce6c1d3268005f, with no matching output record for that call ID.
- The structured log records 64 occurrences of ?Custom tool call output is missing? for that thread; first 2026-11-11 20:13:42, latest observed 2026-11-12 09:57:00. The same call ID recurs after resuming.
- That transcript contains zero compacted records. No context-limit cause was established.
- The authentication thread 01a1ca0d-3dd9-73c0-9aaf-13d2ede28914 records repeated stream disconnects, Windows socket errors 10053/10054, timeouts, five-retry sequences and HTTP fallback. Buyer thread also records disconnects/timeouts.
- Config TOML parses successfully. Configured notify and node_repl executable paths exist. No custom context-window override was present. No proxy environment variable was present in the inspected process; WinHTTP reports direct access. Other network/security intermediaries are not excluded.
- PATH CLI reports codex-cli 0.167.0-alpha.4.1. This does not establish the active desktop engine version.

## Interpretation and limits

The Buyer thread has an incomplete persisted tool-call history and repeatedly fails on that missing result. This is stronger evidence than a generic long-chat explanation. Stream instability is independently confirmed; the logs do not identify whether its origin is the app, local network/security software, intermediary or remote service. Initial cause of the missing output is unproven.

No configuration edits, transcript edits, database changes, cache deletions, process termination or feedback submissions were performed.

## Recovery guidance

Continue the Buyer run in the working new thread using docs/manual-e2e-run-log.md. Complete active tasks, quit/reopen the desktop app and install any offered official update. If failures recur in a fresh thread, compare the same small prompt on another network, with VPN/proxy disconnected if used. Do not disable firewall/antivirus globally. Report the affected thread using in-app feedback with the error and timestamps; inspect attachments before sharing. Do not fabricate tool results or manually rewrite the session database.

Official recovery guidance: https://learn.chatgpt.com/docs/reference/troubleshooting
