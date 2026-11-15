# Gridiron Squares — Vercel + MongoDB Atlas

This project contains a Create React App frontend and an Express/Mongoose API. Both can deploy to **one Vercel project**. MongoDB Atlas hosts the data.

## Setup Atlas
1. In Atlas, open project **Squares**, cluster **Cluster0**, then **Connect > Drivers** and copy your complete `mongodb+srv://...` URI.
2. **Rotate the database password** previously shared in chat. URL-encode special characters in the new password.
3. Set the URI's database path to `/squares` (or your intended database name).
4. Configure Atlas Network Access to allow connections from Vercel. Vercel's standard serverless outbound IPs are dynamic. If you temporarily use `0.0.0.0/0`, it opens network access from any IP: use a dedicated least-privilege database user and strong password, and consider a restricted networking option for production.

## Local development
1. Run `npm install` in the repository root (installs frontend and API dependencies).
2. Copy `server/.env.example` to `server/.env`, and replace placeholders with your Atlas connection URI.
3. Copy `.env.example` to `.env` for the React dev server, or set `REACT_APP_API_URL=http://localhost:5000/api`.
4. Terminal A: `npm run server:dev` (API on port 5000).
5. Terminal B: `npm start` (React on port 3000).

## Deploy to Vercel
1. Push this repository to GitHub, excluding `.env` files.
2. Import the repo in Vercel. Root directory: repository root. Framework: Create React App.
3. In Vercel > Project Settings > Environment Variables, add `MONGODB_URI` containing your **complete new** Atlas connection URI. Set for Production (and Preview if wanted). Do not set `REACT_APP_API_URL` in Vercel; frontend requests use relative `/api` URLs.
4. Deploy. Test `/api/health`, then `/api/pools` (JSON), then `/create`, `/pools`, and `/pool/<id>`.
5. Any changes to environment variables require redeployment.

The `vercel.json` API rewrite sends `/api/pools/...` to the serverless function, preserving the route in a `route` query parameter. The function restores the Express path before dispatch. SPA fallback routes React pages to `index.html`.

## Security and limitations
- No database secrets are included in this archive. Never commit `.env` or paste connection credentials into frontend code.
- **This is not ready for unrestricted public use**: there is no user authentication or pool-admin authorization. Anyone with access to the site can create pools or shuffle numbers. Add login and owner authorization before inviting untrusted users.
- Square claims use an atomic conditional MongoDB update to prevent duplicate claims. The frontend refreshes every 8 seconds.
- Rate limiting is per function instance and is not a substitute for centralized rate limiting in a production serverless deployment.
- The app has not been connected to your live Atlas database; you must configure your real Atlas hostname and credentials in Vercel.
