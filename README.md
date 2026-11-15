# Gridiron Squares — React + MongoDB Atlas

Includes React 18, React Router 6, Create React App (`react-scripts`), Express, Mongoose, and MongoDB Atlas persistence. Mobile displays 3 columns at a time with arrow navigation; NFC row numbers remain visible.

## Setup

1. In MongoDB Atlas project **Squares**, open cluster **Cluster0** → **Connect** → **Drivers** and copy the full `mongodb+srv://...` connection string. **Cluster0 alone is not the hostname.**
2. Rotate the database user's password because the previous one was shared in a chat. Create `server/.env` by copying `server/.env.example`. Paste your real hostname and URL-encoded **new** password in `MONGODB_URI`. If using the username `iamjfz`, ensure it has read/write access to the database `squares`.
3. In Atlas → Network Access, allow the IP address of your backend host (for local development, your current public IP). Do not use 0.0.0.0/0 unless necessary and protected.
4. Backend terminal: `cd server && npm install && npm run dev`.
5. Frontend terminal (project root): `npm install && npm start`. Open http://localhost:3000.

API health check: http://localhost:5000/api/health

## Deployment

Deploy the React build and Express backend separately. Set `MONGODB_URI` only on the backend, `CLIENT_ORIGIN` to your deployed frontend origin, and `REACT_APP_API_URL` to your deployed backend `/api` URL **before building** the frontend. Never put the MongoDB connection string in `REACT_APP_*` variables.

## Important limitations

- This is a shared-data MVP. Everyone can view pools, and anyone with a link can claim an available square. **There is no authentication, owner verification, or admin authorization.** Do not deploy publicly without adding those controls.
- The Shuffle Numbers endpoint is not restricted to pool owners yet. Disable it or implement authorization before production.
- Claimed squares cannot be changed through this starter API. This prevents unauthorized overwrites; add an authenticated administrator workflow for corrections.
- Frontend refreshes pool data every 8 seconds; atomic MongoDB updates prevent double claims.
- Previously saved browser `localStorage` pools are not migrated automatically.
- There is no payment handling or automatic live NFL scoring.
