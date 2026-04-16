# Deployment Guide

Deploy the server (Express + Prisma + Postgres) on **Railway**, the client (Vite SPA) on **Vercel**. Both have free tiers that fit this app.

---

## 1. Prerequisites

- GitHub repo pushed with your current code
- Accounts on [Railway](https://railway.app) and [Vercel](https://vercel.com) (both sign in with GitHub)

---

## 2. Deploy the backend to Railway

1. **New Project → Deploy from GitHub** → pick this repo
2. Railway creates an empty project. Inside it, click **+ New** → **Database** → **PostgreSQL**. Railway provisions a DB and gives you a `DATABASE_URL`.
3. Click **+ New** → **GitHub Repo** → same repo. This creates the web service.
4. On the web service, go to **Settings**:
   - **Root Directory:** `server`
   - **Build Command:** `npm install --workspaces --include-workspace-root && npm run build -w server`
   - **Start Command:** `npm run db:deploy -w server && npm start -w server`
5. Go to **Variables** on the web service and set:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}          # reference the DB service
   JWT_ACCESS_SECRET=<generate strong random>        # see below
   JWT_REFRESH_SECRET=<generate strong random>
   NODE_ENV=production
   FRONTEND_URL=https://<your-vercel-app>.vercel.app # fill after step 3
   ```
   Generate secrets locally:
   ```
   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
   ```
6. Railway auto-deploys. Once up, grab the public URL (e.g. `https://workout-api.up.railway.app`) from **Settings → Networking → Generate Domain**.
7. Smoke test: `curl https://<railway-url>/api/health` → `{"ok":true}`

---

## 3. Deploy the frontend to Vercel

1. **Add New → Project** → import this repo
2. In the Vercel project setup:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `cd .. && npm install && npm run build -w client`
   - **Output Directory:** `dist`
3. Add an Environment Variable:
   ```
   VITE_API_URL=https://<railway-url>/api
   ```
4. Deploy. Vercel gives you a `https://<project>.vercel.app` URL.
5. Go back to Railway and update `FRONTEND_URL` with the Vercel URL. Redeploy the backend (CORS picks up the change).

---

## 4. Seed the production database (optional)

If you want the demo account + seeded exercises:
```
# Locally, point at the Railway DB
DATABASE_URL="<railway DATABASE_URL>" npm run db:seed -w server
```
Note: this seeds `demo@workout.app / password123` — rotate or remove that user before going public.

---

## 5. Domain (optional)

Point a custom domain at Vercel via **Domains → Add**. If you change the frontend hostname, update `FRONTEND_URL` on Railway.

---

## Hardening checklist

- [ ] Rotate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` to strong random values
- [ ] Remove the demo seed user (or change its password)
- [ ] Enable Vercel's "Password Protection" on preview deployments while you're still iterating
- [ ] Add Sentry (server + client) — `@sentry/node` + `@sentry/react`
- [ ] Add UptimeRobot or BetterStack pinging `/api/health`

---

## Troubleshooting

**Login works but refresh loop on reload:** cookies aren't crossing origins. Check that
- backend `NODE_ENV=production` (enables `sameSite=none`, `secure`)
- frontend and backend are both on HTTPS
- `FRONTEND_URL` on backend exactly matches the Vercel origin (no trailing slash)
- axios has `withCredentials: true` (already set in `client/src/api/client.ts`)

**CORS error in browser console:** `FRONTEND_URL` mismatch. Check it against `window.location.origin`.

**`prisma migrate deploy` fails on first boot:** DB isn't reachable. Confirm `DATABASE_URL` is referencing the Railway Postgres via `${{Postgres.DATABASE_URL}}`, not a stale local string.

**Vercel build can't find `@workout-app/shared`:** the install command must run at the repo root so npm workspaces link correctly. Use `cd .. && npm install && npm run build -w client`.
