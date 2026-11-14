# Thirasara Property Management Platform

Thirasara is a multi-service real estate platform for property listings, map-based search, buyers, sellers, agents, admin moderation, payments, messaging, favorites, AI chat, and feasibility calculations.

## Project Layout

- `frontend-react` - React + Vite client application, including the integrated `/admin` panel.
- `backend-node` - Express API for auth, properties, admin, payments, conversations, favorites, AI, saved searches, and feasibility.
- `go-map-service` - Go/Gin microservice for PostGIS polygon map searches.
- `Submissions` - coursework/submission material.

Code navigation: [entry points and feature paths](docs/architecture/code-map.md) · [visible UI controls and style owners](docs/architecture/ui-map.md). These maps currently cover the Profile panels/header/summary/navigation and AddProperty Category & Price / Spatial Location presentation, and grow with verified feature batches.

## Prerequisites

- Node.js24 LTS and npm (see `.nvmrc`; both applications declare `>=24 <25`)
- Go 1.26.10 or compatible newer toolchain (see `go-map-service/go.mod`)
- Supabase/Postgres database with the required schema
- Environment files based on the included `.env.example` files

Docker Node stages and Node CI jobs use24. Local Node24 tests and Linux/Alpine
image smoke verification passed; see [runtime verification and limits](docs/phase7-node24-runtime.md).
Dependency versions were preserved. New images still require the owner's normal
CI/release adoption, including the Phase7 database/session/Storage prerequisites.

`/health/ready` returns200 for a confirmed bounded database probe and a fixed503
failure body after errors/timeouts. Monitor consumers should use the documented
[readiness response contract](docs/phase7-readiness.md); `/health` remains liveness.

Shared error responses use fixed safe messages and `stack: null` in every
environment. Shared request logs record route templates rather than full request
URLs; see [logging contract and remaining scope](docs/phase7-error-logging.md).

Database setup and isolated verification: [repeatable database setup](docs/database/setup.md). Existing installations must use its adoption procedure; do not replay the fresh baseline against a populated database.

## Evaluation quick start (Windows PowerShell)

Obtain the private evaluation environment values and Buyer, Seller, approved Agent and Admin test-account logins from the project team through the evaluation submission channel. They are not stored in Git. Both backend services must target the same hosted database; no local database installation is needed for this path.

```powershell
git clone https://github.com/shamilaw-sci/CSC3213_20_Group_E.git
cd CSC3213_20_Group_E
git switch main
Copy-Item backend-node/.env.example backend-node/.env
Copy-Item go-map-service/.env.example go-map-service/.env
Copy-Item frontend-react/.env.example frontend-react/.env
```

Fill the copied files privately. Keep Go `PORT=9090` and frontend `VITE_MAP_API_URL=http://localhost:9090/api/map/search`. The local Go example and code fallback both use 9090. Docker Compose uses a separate 8080 configuration; do not mix its URLs with this local setup.

Open three terminals from the repository root:

```powershell
# Terminal 1
cd backend-node
npm ci
npm run dev
```

```powershell
# Terminal 2
cd go-map-service
go mod download
go run .
```

```powershell
# Terminal 3
cd frontend-react
npm ci
npm run dev -- --port 5173 --strictPort
```

Open http://localhost:5173; Admin login is http://localhost:5173/admin/login. Check http://localhost:5000/health/ready and http://localhost:9090/health/ready for database readiness. `/health` alone does not prove database access. Stop each service with Ctrl+C.

If port 5173 is occupied, stop the existing frontend or coordinate the frontend port, backend CLIENT_URL and Go ALLOWED_ORIGIN. If maps fail, check the Go terminal, database connectivity and matching map URL. Restart services after editing their environment files.

### Configuration required for evaluated features

| Feature | Configuration |
| --- | --- |
| Backend/database | Backend SUPABASE_URL, server-only service-role SUPABASE_KEY, strong JWT_SECRET; Go DATABASE_URL with provider-required TLS |
| Origins | Backend CLIENT_URL and Go ALLOWED_ORIGIN set to http://localhost:5173 |
| AI chat | Backend GEMINI_API_KEY |
| Email/reset/notifications | Backend EMAIL_USER, EMAIL_PASS; EMAIL_HOST and EMAIL_PORT default to smtp.gmail.com and 465 |
| Sandbox payments | Backend PAYHERE_MERCHANT_ID, PAYHERE_MERCHANT_SECRET, PAYHERE_MODE=sandbox; frontend VITE_PAYHERE_NOTIFY_URL must publicly reach this backend's /api/payment/notify over HTTPS for gateway settlement |
| Google login | Backend GOOGLE_CLIENT_ID and frontend VITE_GOOGLE_CLIENT_ID, plus provider origin configuration |
| Facebook login | Backend FACEBOOK_APP_ID, FACEBOOK_APP_SECRET; frontend VITE_FACEBOOK_APP_ID, plus provider configuration |
| Apple login | Backend APPLE_SERVICES_ID; frontend VITE_APPLE_CLIENT_ID, VITE_APPLE_REDIRECT_URI, plus provider configuration |
| Optional Mapbox imagery | Frontend VITE_MAPBOX_ACCESS_TOKEN for views that use Mapbox |

Missing third-party configuration may leave the corresponding feature unavailable even if startup succeeds. Never put backend secrets in VITE_* variables; these are public browser configuration.

Before submission, privately supply all evaluation environment values, role-account logins, hosted app/API URLs if deployed, current payment callback address and provider test instructions. Use synthetic evaluation accounts/listings. Do not publish customer data or privileged credentials in Git or screenshots. This private handoff must still be completed by the team.

Hosted metadata supplied by the owner on 2026-11-14 confirms appointment ownership/slot columns and indexes, the restricted seller-resolution RPC, private chat bucket/restrictive client policy and RLS on the reported application tables. Backend readiness was confirmed. This point-in-time check does not apply changes to another database. Historical rollout notes below describe prerequisites for other environments.

For a new database, read [database setup](docs/database/setup.md). Its two-file baseline is for an isolated empty test environment and does not by itself certify the latest hosted additions. Never replay it against the hosted evaluation database. A complete fresh-database upgrade/seed package is separate from this hosted setup.

## PayHere sandbox payment testing

Payments for evaluation use **PayHere Sandbox**, which simulates transactions without moving real money. Use only the sandbox test cards below. Merchant ID and merchant secret are supplied in the private backend configuration; never publish the merchant secret.

### Sandbox Merchant Dashboard

Open the [PayHere Sandbox Merchant Dashboard](https://sandbox.payhere.lk/merchant/) to inspect sandbox payment records. The team supplies the dashboard login email and password through the private evaluation handoff; they are not stored in this repository. These credentials are separate from the Thirasara application accounts and from the backend merchant ID/secret. Dashboard access is for inspecting sandbox transactions, not changing merchant configuration or enabling live payments.

### Start the public payment callback

1. Install the [ngrok agent](https://ngrok.com/docs/start) and connect your own account using its dashboard setup instructions. Keep the ngrok authtoken private.
2. Set `PAYHERE_MODE=sandbox`, `PAYHERE_MERCHANT_ID` and `PAYHERE_MERCHANT_SECRET` in `backend-node/.env` using matching sandbox credentials. Restart the backend and confirm `http://localhost:5000/health/ready` reports ready.
3. From the repository root, open another terminal and run:

   ```powershell
   ngrok http 5000 --traffic-policy-file docs/payhere-ngrok-policy.yml
   ```

   Keep this terminal open. The supplied policy exposes only `POST /api/payment/notify`; other requests receive 404. This is important when the local evaluation backend has Admin MFA disabled. If ngrok rejects the policy, resolve the error before testing; do not replace it with an unrestricted tunnel. See [ngrok request variables](https://ngrok.com/docs/traffic-policy/variables/req) and [deny action](https://ngrok.com/docs/traffic-policy/actions/deny).

4. Copy the HTTPS forwarding origin shown by ngrok and append `/api/payment/notify`. Set that complete URL in `frontend-react/.env`:

   ```dotenv
   VITE_API_URL=http://localhost:5000
   VITE_PAYHERE_NOTIFY_URL=https://YOUR-NGROK-HOST/api/payment/notify
   ```

   Replace the example host with the actual active host. Keep normal browser API calls on localhost; the ngrok URL is for the server-to-server notification only. Restart Vite after this change. If the tunnel host changes, update this value and restart Vite again. A built frontend must be rebuilt after changing its build-time environment.

5. Sign in with the evaluation Seller, use the designated test listing and open its listing-fee checkout. Use a card below. The amount/currency come from the backend checkout; do not edit the payment payload.
6. Leave the backend and tunnel running until PayHere delivers its callback. Verify the listing/payment state in the app after refresh. A successful checkout dialog or browser return alone does not establish a Paid state: the backend must validate and settle the notification.

Do not test the webhook by manually posting a success payload. Opening the callback in a browser sends GET and is deliberately blocked by the tunnel policy. If a real checkout remains pending, inspect the backend and ngrok request inspector (`http://localhost:4040`) for the POST callback, check the active URL and matching sandbox credentials, and inspect the existing order state before retrying. Do not publish callback bodies, signatures or inspector screenshots containing private data. Stop the tunnel with Ctrl+C after testing.

### Sandbox cards

The following numbers are public PayHere sandbox fixtures, not real card details. Use a valid-looking cardholder name, CVV and a future expiry date. Test one scenario at a time on designated fixtures.

| Simulated outcome | Visa | MasterCard | AMEX |
| --- | --- | --- | --- |
| Success | `4916217501611292` | `5307732125531191` | `346781005510225` |
| Insufficient funds | `4024007194349121` | `5459051433777487` | `370787711978928` |
| Limit exceeded | `4929119799365646` | `5491182243178283` | `340701811823469` |
| Do not honor | `4929768900837248` | `5388172137367973` | `374664175202812` |
| Network error | `4024007120869333` | `5237980565185003` | `373433500205887` |

PayHere documents other card numbers as unsuccessful sandbox cases. Failed/declined/cancelled attempts must not be treated as Paid. Source: [PayHere Sandbox & Testing](https://support.payhere.lk/sandbox-and-testing).

Sandbox and Live are separate environments: a Sandbox account cannot be converted into a Live account. A real production launch requires a separate [Live merchant application](https://www.payhere.lk/merchant/sign-up) and a separately configured release. Live payments are outside this evaluation setup.

## Environment

Backend:

```bash
cd backend-node
cp .env.example .env
```

Map service:

```bash
cd go-map-service
cp .env.example .env
```

The Go service reads `DATABASE_URL`; fill the example placeholders privately and keep `.env` untracked. Existing checkout owners should follow the [tracked credential containment procedure](docs/phase7-credential-containment.md).

Useful variables:

- `CLIENT_URL` - frontend origin, defaults to `http://localhost:5173`
- `PORT` - backend port, defaults to `5000`
- `SUPABASE_URL`, `SUPABASE_KEY` - backend Supabase credentials
- `DATABASE_URL` - Go map-service database URL
- `ALLOWED_ORIGIN` - Go map-service CORS origin
- `VITE_API_URL` - frontend API base URL, defaults to `http://localhost:5000`
- `VITE_PAYHERE_NOTIFY_URL` - optional complete public PayHere callback URL (for example, `https://your-public-host/api/payment/notify`). An explicit value must use HTTPS without credentials or a fragment; invalid values stop checkout before an order is created. If absent, checkout retains `${VITE_API_URL}/api/payment/notify`, with the localhost API default above. Local gateway testing needs a publicly reachable callback, such as the scoped HTTPS tunnel URL; localhost cannot receive PayHere server notifications. This frontend setting is public and must not contain secrets. Payment confirmation still requires server settlement.
- `LOG_LEVEL` - backend log level: `debug`, `info`, `warn`, or `error`
- `PAYHERE_MODE` - defaults to `sandbox`; only the explicit value `live` enables live checkout. Use matching gateway credentials when intentionally enabling live mode.

State-changing browser API requests must originate from `CLIENT_URL` (an HTTP(S) origin without a path). Cookie-only scripts must supply that trusted `Origin`/`Referer` or use an explicit Bearer credential. Untrusted source headers are rejected even with Bearer auth. The signed PayHere POST notification endpoint retains its narrow server-callback exception. See [Phase 7 security scope and verification limits](docs/phase7-security-plan.md).

Version2 application sessions require existing users/admins to sign in again once on coordinated rollout. Password resets/changes invalidate older credential-bound sessions; direct Bearer clients must consume the replacement token after password changes. See [session rollout and recovery notes](docs/phase7-session-rollout.md) before release.

Profile avatar uploads accept JPEG, PNG and WebP up to3MiB, with server-side
input/signature preflight before upload. Legacy-schema partial saves report
omitted fields. See [profile validation evidence and limits](docs/phase7-profile-preflight.md).

Appointment ownership now uses authenticated account IDs. Dependent code requires the reviewed `leads.buyer_id` schema and backend-only lead-write permissions before deployment; old-schema booking/account appointment endpoints are incompatible. Guest/historical records are not claimed by matching email. See [appointment adoption prerequisites](docs/phase7-appointment-owner-rollout.md). The isolated SQL candidate has not been applied.

Separate committed-schema [Phase7 local acceptance](docs/phase7-local-acceptance.md) passed58 synthetic cases on a fresh test database. This verifies the prepared database/app boundaries locally; it does not apply the prerequisites to the deployed environment.

Admin role-request resolution now requires the separately adopted restricted `resolve_seller_role_request(uuid,text)` database function. Missing or unconfirmed RPC results fail closed; there is no sequential-write fallback. Real local SQL/HTTP/rollback/race acceptance passed23 cases; the temporary function/fixtures were removed and the test database restored. Production function adoption remains required. See [role-request adoption and local acceptance](docs/phase7-role-request-rollout.md) before deploying this code.

## Development

Start the backend:

```bash
cd backend-node
npm ci
npm run dev
```

Start the frontend:

```bash
cd frontend-react
npm ci
npm run dev
```

Start the map service:

```bash
cd go-map-service
go run .
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- Go map service: `http://localhost:9090`

The frontend map URL defaults to `http://localhost:9090/api/map/search`.
If you override the Go `PORT`, set `VITE_MAP_API_URL` in `frontend-react/.env`
to match and restart Vite. In local development, saved Vite env files determine
the map URL instead of inherited shell variables, preventing stale port overrides.
Mode/local env files take precedence over `.env`. Production builds retain normal
Vite environment precedence.

## Verification

Frontend:

```bash
cd frontend-react
npm test
npm run build
npm run lint
```

Backend:

```bash
cd backend-node
npm test
```

Map service:

```bash
cd go-map-service
go test ./...
```

## Admin Panel

### Evaluator sign-in and Authenticator setup

After starting the services, open `http://localhost:5173/admin/login` (or `/admin/login` on the supplied hosted frontend). Use the dedicated Admin credentials delivered through the private evaluation channel. These are application credentials, not a Supabase dashboard or Google/Microsoft account login.

#### Local evaluation: email and password only

For the local coursework evaluation, set the following in `backend-node/.env` before starting the backend:

```dotenv
ADMIN_MFA_ENABLED=false
```

If the backend is already running, stop and restart it. Sign in at `http://localhost:5173/admin/login` using the supplied evaluation Admin email and password. No authenticator setup or code is required in this mode. This setting applies to every Admin account served by that backend, not just the evaluation account. It does not remove existing MFA enrollments.

Use this exception only for the controlled local evaluation. Normal Admin operation uses `ADMIN_MFA_ENABLED=true` and a valid private `ADMIN_MFA_ENCRYPTION_KEY`. Restore `true` and restart the backend after evaluation. Existing enrolled accounts then require their previously configured authenticator again. If a hosted evaluation is provided instead, the team controls the hosted backend setting; changing a local `.env` does not change that deployment.

#### Normal operation: Authenticator verification

When `ADMIN_MFA_ENABLED=true`, an Admin account with no enrolled authenticator receives a setup QR code and a manual setup key after entering valid credentials:

1. Install Google Authenticator or Microsoft Authenticator on your phone.
2. Add an account and scan the QR code displayed by Thirasara. In Microsoft Authenticator choose **Other account**. If scanning is unavailable, enter the displayed setup key as a time-based account.
3. Enter the current six-digit code in Thirasara's **Authenticator or recovery code** field and select **Verify and continue**. Codes change every 30 seconds; keep the phone clock automatic.
4. Save the recovery codes privately when shown. Each recovery code works once. They can be entered in the same login field if the authenticator is unavailable.
5. For later logins, enter the Admin email/password, then the current code from your authenticator.

Official app instructions: [Google Authenticator](https://support.google.com/accounts/answer/1066447) and [Microsoft Authenticator](https://support.microsoft.com/en-us/authenticator/how-to-add-your-accounts-to-microsoft-authenticator).

**Already enrolled accounts:** Thirasara does not display the setup QR/key again at login. An account already linked to a team member's phone cannot be enrolled on another phone using only its email/password. Changing the email or password does not reset MFA. The team must provide a separate authorized evaluation Admin account whose first enrollment is left to the evaluator, or arrange access through the designated account owner. There is no self-service MFA reset/re-enrollment screen in this version. README instructions alone do not reset an existing enrollment.

Before handoff, the team must privately state whether evaluation uses the local password-only exception above or MFA-enabled access. For MFA-enabled access, also state whether the supplied Admin account is awaiting first enrollment or already enrolled and how access is arranged. Never commit QR codes, setup keys or recovery codes. Keep the backend `ADMIN_MFA_ENCRYPTION_KEY` stable for existing enrollments and supply it only in the private backend configuration; it is not the authenticator setup key.

Chat attachments now use short-lived signed delivery links in API responses. Actual privacy requires the separately reviewed [private chat Storage cutover](docs/phase7-chat-storage-cutover.md); application code alone does not make an existing public bucket private.

The admin panel is integrated into the main frontend under `/admin`. The canonical admin source lives in:

- `frontend-react/src/pages/admin/api`
- `frontend-react/src/pages/admin/components`
- `frontend-react/src/pages/admin/context`
- `frontend-react/src/pages/admin/pages`
- `frontend-react/src/pages/admin/styles`

Do not reintroduce a nested standalone admin Vite app under `frontend-react/src/pages/admin/src`; that duplicate structure was removed to keep the product build maintainable.
