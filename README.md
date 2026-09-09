# CLYDEN / AgroBridge

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/login`. Local development credentials are `seller123`, `buyer123`, and `admin123`.

## Backend

The app exposes typed Next.js route handlers for dashboard data, lots, buyer requests, shortlists, documents, logistics, farm profile, admin reviews, and authentication. Data is persisted to a JSON file at `data/agrobridge.json` by default. Set `AGROBRIDGE_DATA_FILE` to move it elsewhere.

Run the API smoke test against a running server with `BASE_URL=http://127.0.0.1:3010 npm run smoke` (PowerShell: `$env:BASE_URL='http://127.0.0.1:3010'; npm run smoke`).

## Production configuration

Copy `.env.example` to `.env.local` and set a strong `AUTH_SECRET` plus role passwords before running `npm run start`. The default development passwords are intentionally unavailable in production.

The file store is appropriate for a single instance or prototype. A multi-instance deployment should replace `lib/server/store.ts` with a hosted database repository while keeping the route contracts unchanged.
