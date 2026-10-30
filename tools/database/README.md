# Database verification tooling

The workspace tooling package/lock pins Supabase CLI 2.122.0 independently of application dependencies. Install only with authorized network access, using npm ci --prefix tools/database. No package scripts perform deployment or database operations.

See ../../docs/database/setup.md for prerequisites, explicit isolated identities and the verification sequence. verify-migrations.cjs checks canonical file versions/SHA256. Invoke-VerifiedMigrations.ps1 refuses caller URLs, linked workdirs, unexpected containers, non-loopback bindings and mismatched files; it uses local generated credentials only in memory.

These helpers do not provision a hosted database, read application .env files, reset data, repair live history or deploy. The initial Windows Docker Desktop binding workaround and local-only TLS behavior are documented in the runbook. Do not bypass a guard to make a command succeed.
