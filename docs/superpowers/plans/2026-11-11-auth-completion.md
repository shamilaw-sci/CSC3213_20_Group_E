# Authentication completion plan

Continue the owner-approved signup verification, profile email verification and Admin MFA work.

- Verify the existing email challenge integration and SQL.
- Complete password-authenticated MFA enrollment with encrypted secrets, expiring setup proof and single-use recovery codes.
- Enforce MFA on Admin sessions and connect the Admin login UI.
- Run focused authentication checks, frontend lint/build and available regression tests.
- Deliver SQL and configuration instructions for owner application to Supabase.

The owner applies hosted SQL and performs manual testing after implementation. Commits remain owner-controlled.
