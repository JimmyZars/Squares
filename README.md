# EasyPools — React, MongoDB Atlas, Vercel, and accounts

## What changed
- Email/password registration and login, with bcrypt-hashed passwords (never plaintext).
- Optional Google sign-in using Google Identity Services, verified server-side.
- MongoDB `users` collection stores **email** and **password hash** only, plus MongoDB's `_id`. Google-only users have `password: null`. No Google tokens or profile data are stored.
- HttpOnly, SameSite=Lax session cookie (signed JWT); no JWT in localStorage.
- Square claiming requires login and is recorded under the signed-in email; old claims by participant name remain visible and searchable.
- Login/Register links in navigation; My Squares automatically searches signed-in email.

## Install locally
1. `npm install` in the project root.
2. Copy `server/.env.example` to `server/.env` and fill in your MongoDB Atlas URI and a long random `JWT_SECRET` (e.g. `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
3. `npm run server:dev` in one terminal, `npm start` in another.
4. Set `REACT_APP_API_URL=http://localhost:5000/api` in root `.env.local` for local development (CRA frontend runs on port 3000). Set `REACT_APP_GOOGLE_CLIENT_ID` there to enable Google sign-in.

## Deploy to Vercel
1. Push code to GitHub; keep all real `.env` files out of Git.
2. Deploy repo root as Create React App on Vercel.
3. Set Vercel environment variables:
   - `MONGODB_URI`: full Atlas URI including `/squares` database
   - `JWT_SECRET`: long random secret, identical across function invocations
   - `GOOGLE_CLIENT_ID`: Google OAuth **Web application** client ID (optional)
   - `REACT_APP_GOOGLE_CLIENT_ID`: same Google client ID (optional, used by React build)
4. Redeploy after adding environment variables. Test `/api/health`, `/api/auth/me` (401 when signed out), and `/api/pools`.
5. To enable Google sign-in, create an OAuth 2.0 Client ID of type **Web application** in Google Cloud Console. Configure Authorized JavaScript origins including `https://squares-snowy.vercel.app` (and `http://localhost:3000` for local testing). Google Identity Services sends an ID token to the backend, which verifies its signature, audience, and verified email. You may need to configure the OAuth consent screen. If not configured, email/password login still works.
6. MongoDB Atlas Network Access must permit Vercel egress. Prefer restricted egress where feasible. If testing with `0.0.0.0/0`, use strong limited-privilege database credentials.

## Notes and limits
- Existing pools and old participant-name square claims are preserved. Old claims aren't automatically assigned to new accounts; signed-in users can search them by the old name.
- Google-only accounts have no password and must use Google to log in. A verified Google email matching an existing email/password account signs into that same account.
- This is a starter auth implementation: before a public launch, add email verification, password reset, account recovery, and stronger authorization for pool creation/shuffling. **Shuffle is still not restricted to the pool creator.**
- No payment processing is included.
- If you previously shared your Atlas password, rotate it and never commit it.
- Frontend build was not fully validated in this environment; run `npm install && npm run build` before deploying.


## Pool ownership

Creating pools and listing **My Pools** require an authenticated session. The API saves the authenticated user's MongoDB ObjectId in each pool's `owner` field, and `GET /api/pools` returns only pools owned by that user. Pool URLs remain shareable so participants can claim squares; only the pool owner may shuffle numbers.

**Existing pools:** Pools created before this update do not have an `owner` field and will not appear under My Pools. Do not assign ownership based on unverified claims. An administrator should verify and migrate any legacy pools manually before applying stricter schema changes.


## Login / registration troubleshooting

**Required on Vercel:** `MONGODB_URI` and `JWT_SECRET` must be set in Project → Settings → Environment Variables for the **Production** environment. Set `JWT_SECRET` to at least 32 random characters (e.g. generate locally using `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Redeploy after changing variables. Never commit either secret.

Open `/api/health` on your deployed site. `authConfigured: true` means the JWT secret is present and sufficiently long; `databaseUriConfigured: true` means the URI exists, **not** that MongoDB is reachable. If register/login still fails, check Vercel Function logs for the error; ensure MongoDB Atlas network access, database username/password, and URI encoding are correct.

This update prevents creation of a user account when the JWT secret is absent. It cannot set your Vercel environment variables automatically. Rotate any database credentials previously shared in chat.

## Joining pools and optional pool passwords

- Signed-in users can visit **Join a Pool** (`/join`) and search by pool name (2+ characters).
- Search results show a lock icon for password-protected pools. Open pools can be joined without a password.
- Creating a pool accepts an optional password; blank passwords create open pools. Pool passwords are **bcrypt-hashed**, never returned in API responses, and stored in the pool document as `passwordHash` (not in user accounts).
- Joining a pool adds the authenticated user ID to `members` using `$addToSet` to prevent duplicate memberships. Members can view and claim squares; only the creator can shuffle numbers.
- **My Pools** continues to list only pools the user owns. **Join a Pool** also lists pools they have joined.
- Existing pools without a `passwordHash` remain open. Their owners retain access automatically; other users can join them from search.
- A direct pool URL requires an authenticated owner/member. Nonmembers must join first, including when a pool has no password.

### Production notes

Pool-name search is available to authenticated users and reveals pool names and matchups. Do not put sensitive details in pool names. For a public production deployment, add a password-attempt rate limit per account/pool and consider anti-enumeration controls; the general API rate limit is not a substitute for targeted protections. The project continues to require `MONGODB_URI` and `JWT_SECRET` configured in Vercel.


## Names and square initials
New email registrations require first and last name; passwords require at least 8 characters. Google sign-in uses the verified Google profile given/family name when available. Existing accounts may have blank names; their initials fall back to their email local part and X until updated.

For each pool, the first member with a given pair of initials gets two letters (e.g. JS). If a subsequent member has the same pair, they receive the first two letters of each name (e.g. JOSM). If those four letters also collide, a numeric suffix is appended. Initials are fixed per membership and stored in `memberLabels`. New square claims save the display label in `squares` and the user ID in `squareUsers` so My Squares identifies owners reliably. Historical claims remain as they were; this update does not automatically reassign legacy claims.

Pool passwords are optional, but nonempty passwords must be 8–72 characters. Database credentials and JWT secrets must stay in server-side environment variables.
