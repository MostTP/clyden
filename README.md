# CLYDEN / AgroBridge

## Run locally

Use Node.js 22.5 or newer. Database mode uses Node's built-in `node:sqlite` API.

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login`. Local development credentials are `seller123`, `buyer123`, and `admin123`. Development seed accounts are `seller@agrobridge.local`, `buyer@agrobridge.local`, and `admin@agrobridge.local`.

## Backend

The app exposes typed Next.js route handlers for dashboard data, lots, buyer requests, shortlists, documents, logistics, farm profile, admin reviews, and authentication. Local development uses a JSON file at `data/agrobridge.json` by default. Set `AGROBRIDGE_DATA_FILE` to move it elsewhere.

Run the API smoke test against a running server with `BASE_URL=http://127.0.0.1:3010 npm run smoke` (PowerShell: `$env:BASE_URL='http://127.0.0.1:3010'; npm run smoke`).

## Production configuration

Copy `.env.example` to `.env.local` and set a strong `AUTH_SECRET` plus role passwords before running `npm run start`. The default development passwords are intentionally unavailable in production.

For production, set `AGROBRIDGE_STORE_MODE=database` and configure `AGROBRIDGE_DATABASE_URL` with a SQLite database file path. Database mode uses a transactional SQLite repository and does not seed demo records when `NODE_ENV=production`. The JSON file store remains available for local prototypes only.

User accounts are persisted in the repository and sessions reference the persisted account ID. Production databases start with no accounts; provision an active account record before enabling login. The current prototype still authenticates those accounts through the configured role passwords. Individual registration and password management remain a separate follow-up.
