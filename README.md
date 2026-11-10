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
- Go
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
npm install
npm run dev
```

Start the frontend:

```bash
cd frontend-react
npm install
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
- Go map service: `http://localhost:8080`

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

Chat attachments now use short-lived signed delivery links in API responses. Actual privacy requires the separately reviewed [private chat Storage cutover](docs/phase7-chat-storage-cutover.md); application code alone does not make an existing public bucket private.

The admin panel is integrated into the main frontend under `/admin`. The canonical admin source lives in:

- `frontend-react/src/pages/admin/api`
- `frontend-react/src/pages/admin/components`
- `frontend-react/src/pages/admin/context`
- `frontend-react/src/pages/admin/pages`
- `frontend-react/src/pages/admin/styles`

Do not reintroduce a nested standalone admin Vite app under `frontend-react/src/pages/admin/src`; that duplicate structure was removed to keep the product build maintainable.
