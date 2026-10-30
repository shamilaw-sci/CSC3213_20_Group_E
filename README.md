# Thirasara Property Management Platform

Thirasara is a multi-service real estate platform for property listings, map-based search, buyers, sellers, agents, admin moderation, payments, messaging, favorites, AI chat, and feasibility calculations.

## Project Layout

- `frontend-react` - React + Vite client application, including the integrated `/admin` panel.
- `backend-node` - Express API for auth, properties, admin, payments, conversations, favorites, AI, saved searches, and feasibility.
- `go-map-service` - Go/Gin microservice for PostGIS polygon map searches.
- `Submissions` - coursework/submission material.

## Prerequisites

- Node.js and npm
- Go
- Supabase/Postgres database with the required schema
- Environment files based on the included `.env.example` files

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

Useful variables:

- `CLIENT_URL` - frontend origin, defaults to `http://localhost:5173`
- `PORT` - backend port, defaults to `5000`
- `SUPABASE_URL`, `SUPABASE_KEY` - backend Supabase credentials
- `DATABASE_URL` - Go map-service database URL
- `ALLOWED_ORIGIN` - Go map-service CORS origin
- `VITE_API_URL` - frontend API base URL, defaults to `http://localhost:5000`
- `LOG_LEVEL` - backend log level: `debug`, `info`, `warn`, or `error`
- `PAYHERE_MODE` - defaults to `sandbox`; only the explicit value `live` enables live checkout. Use matching gateway credentials when intentionally enabling live mode.

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

The admin panel is integrated into the main frontend under `/admin`. The canonical admin source lives in:

- `frontend-react/src/pages/admin/api`
- `frontend-react/src/pages/admin/components`
- `frontend-react/src/pages/admin/context`
- `frontend-react/src/pages/admin/pages`
- `frontend-react/src/pages/admin/styles`

Do not reintroduce a nested standalone admin Vite app under `frontend-react/src/pages/admin/src`; that duplicate structure was removed to keep the product build maintainable.
