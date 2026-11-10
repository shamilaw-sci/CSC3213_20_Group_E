# Phase 7 credential containment implementation plan

> For agentic workers: execute this bounded preparation task inline with verification-before-completion. Owner-controlled Git and live changes override automatic commit/worktree instructions.

**Goal:** Make safe Go setup reproducible and give the owner concrete containment steps without exposing or changing the local credential.

**Architecture:** Keep main.go and its dotenv loading unchanged. Correct the tracked placeholder example and document owner actions. Preserve the local .env and existing checkout.

**Tech stack:** Go, dotenv, Git, PowerShell; no new dependency.

## Constraints

Follow docs/phase7-security-plan.md. No index mutation, credential output, live connection, rotation, history rewrite, commit or push by the agent. This documentation/example-only batch needs direct content/Git checks, not runtime tests.

## Task 1: Safe setup example

- [x] Replace unused SUPABASE_URL/SUPABASE_KEY entries in go-map-service/.env.example with the variable main.go actually reads:

```dotenv
DATABASE_URL=postgresql://YOUR_DB_USER:YOUR_DB_PASSWORD@YOUR_DB_HOST:5432/YOUR_DB_NAME?sslmode=require
```

- [x] Retain PORT and ALLOWED_ORIGIN. Explain URL encoding and provider-required TLS. Do not copy any local value.
- [x] Verify example contains one DATABASE_URL assignment and placeholders only; main.go still reads DATABASE_URL; no local .env edit.

## Task 2: Owner containment procedure

- [x] Create docs/phase7-credential-containment.md with private rotation/access-review steps, safe untracking command, expected Git status and history limitations.
- [x] Link the procedure from README.md next to Go environment setup.
- [x] Run git -c core.fsmonitor=false diff --check and inspect only explicit non-secret changed paths.
- [x] Verify git status lists no product/runtime changes and no staged files. Never display the tracked .env diff.
- [x] Report preparation complete separately from actual containment. Owner rotation/untracking remains open until confirmed.

## Subsequent work

Continue 7A read-only assessment while owner handles credentials. Each runtime/security subsystem receives its own executable design/test plan after source tracing; the phase roadmap is not a substitute for those plans.
