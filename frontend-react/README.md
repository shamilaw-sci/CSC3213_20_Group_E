# Thirasara frontend

React/Vite client including the Admin panel. Requires Node.js 24 and npm.

Follow the [repository setup guide](../README.md#evaluation-quick-start-windows-powershell) for the hosted database, Node backend, Go map service and private evaluation configuration. This client requires those services.

From this directory, copy `.env.example` to `.env`, fill the public configuration, then run:

```powershell
npm ci
npm run dev -- --port 5173 --strictPort
```

Open http://localhost:5173; Admin login is /admin/login. Example API: http://localhost:5000; map search: http://localhost:9090/api/map/search. Restart Vite after environment changes. Never place server secrets in VITE_* variables.

Checks: `npm test`, `npm run lint`, `npm run build`. `npm run preview` serves the built frontend locally; backend services are still required and the browser origin must match backend configuration for authenticated writes.
