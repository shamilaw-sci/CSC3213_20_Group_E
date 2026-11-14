# Email verification and Admin MFA rollout

## Owner database steps

Run `docs/database/phase7-email-verification.candidate.sql` and then
`docs/database/phase7-admin-mfa.candidate.sql` in the Supabase SQL editor.
Both scripts use transactions. Existing accounts retain their current email verification status.
The backend Supabase credential requires service_role access to the RPC functions.

## Backend configuration

Set `EMAIL_VERIFICATION_ENABLED=true` after the email SQL succeeds.
Set `CLIENT_URL` to the frontend origin and configure the existing SMTP transport.
Generate a persistent random encryption key with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Store the value as `ADMIN_MFA_ENCRYPTION_KEY` in backend configuration.
Keep a secure backup of this key because enrolled authenticator secrets require it.
Set `ADMIN_MFA_ENABLED=true` after the MFA SQL succeeds and restart the backend.
Existing Admin sessions require a fresh MFA login after activation.

## Manual acceptance

1. Register a fresh account. Confirm sign-in is blocked until its verification link is consumed.
2. Resend verification, verify the newest link, and confirm replay is rejected.
3. Change a password account's email with its current password. Confirm the original email remains active until the new inbox verifies.
4. Sign in at `/admin/login`. Add the displayed setup key to an authenticator app and submit its six-digit code.
5. Save the ten recovery codes before continuing to the dashboard.
6. Sign out and sign in with a fresh authenticator code. Confirm a repeated code is rejected during the same time step.
7. Sign in with a recovery code. Confirm reuse of that recovery code is rejected.
8. Confirm a password-only Admin session cannot access protected routes after MFA activation.

Each recovery code authenticates once. Enrollment supplies ten codes. Keep unused codes securely available.

## Verification on 2026-11-11

Backend regression passed 1,335 tests across 89 suites. A subsequent focused MFA run passed seven tests after adding an enrollment/recovery scenario. Frontend regression passed 401 tests across 57 files with two workers. Frontend lint and production build passed. Existing bundle-size and Lottie eval warnings remain.

Both migrations applied on disposable local Supabase PostgreSQL 17.11. MFA SQL accepted enrollment and first authenticator/recovery consumption, then rejected each replay. Email SQL accepted signup verification, rejected link replay, and changed the email only upon email-change link consumption. The isolated container `thirasara-auth-check-20261111` was stopped afterward. These checks used a minimal users table and synthetic identities. Hosted SQL application, configuration activation and owner browser/email acceptance remain pending.

The first frontend rerun exhausted memory at default concurrency. The reduced-concurrency run completed successfully. Existing reset-password and registration test fixtures were updated to satisfy the approved 15-character password policy.
