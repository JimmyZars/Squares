# EasyPools

A React + Express + MongoDB Atlas squares-pool application, deployable to Vercel.

## New: My Squares

Open any pool and select **My Squares**. Enter the exact participant name used to claim squares (case-insensitive). The page lists each matching square, row/column, and current top/side team numbers, plus a total. It refreshes every 8 seconds. This is a public name lookup, **not** user authentication or proof of ownership.

## Deploy

1. Add `MONGODB_URI` to Vercel project environment variables (never commit credentials).
2. Deploy the repository root using the included `vercel.json`.
3. Verify `/api/health` and `/api/pools` before creating pools.

For local development, set `server/.env` from `server/.env.example`, run `npm install`, then `npm run server:dev` and `npm start` in separate terminals. Set `REACT_APP_API_URL=http://localhost:5000/api` in a local root `.env` if using the separate dev server.

Note: Shuffle Numbers is currently unauthenticated and must be restricted before public use.
