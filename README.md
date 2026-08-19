# ErgCalc

Plan a race or a time piece. Save it to a logbook. iOS reads the same logbook and later talks to a PM5.

The Flask files (`app.py`, `templates/`, `static/`) are the old prototype. **This product is the Next.js app.** SQLite is not used.

You cannot enter the app without an account. Web uses an httpOnly cookie. The iOS app stores a JWT in SecureStore and sends `Authorization: Bearer`.

## Local (web)

Postgres is required. Docker:

```powershell
cd C:\Users\nicolas.invernizzi\Documents\GitHub\erg-pace-calculator
docker compose up -d
```

Copy `.env.example` to `.env`. For local Docker both URLs can be the same:

```
DATABASE_URL="postgresql://ergcalc:ergcalc@localhost:5432/ergcalc"
DIRECT_URL="postgresql://ergcalc:ergcalc@localhost:5432/ergcalc"
AUTH_SECRET="a-long-random-string"
```

If `npm` is not on PATH, this machine has portable Node at `%LOCALAPPDATA%\nodejs-portable\node-v22.18.0-win-x64`.

```powershell
npm install
npx prisma generate
npx prisma migrate deploy
npm test
npm run dev
```

Open http://127.0.0.1:3000 — you land on **Sign in**. After login, Plan is home.

Verify: open `/logbook` in a private window (no cookie) → redirect to `/signin`. Sign in → Plan. A 2k with four different 500 m splits: total time is the sum of those splits. Half marathon 21097 m does not drop the remainder. A bad custom split does not save.

## Tests (math)

`npm test` covers:

- `1:45` and `1:45.0`
- no `1:60.0` formatting
- 100s/500m → 350 W
- half marathon 21097 m with 500 m pieces (remainder last piece)
- invalid custom split aborts
- time-weighted average split
- JWT sign/verify for the session token

## Neon (cloud Postgres)

SQLite (`file:./dev.db`) will not run on Vercel. Create a Neon project, then:

1. Neon → your project → **Connect**.
2. Copy the **pooled** connection string into `DATABASE_URL`. Add `?sslmode=require` if it is not already there.
3. Copy the **direct** (non-pooled) string into `DIRECT_URL`, also with `sslmode=require`. Prisma migrations use `DIRECT_URL`.
4. Generate `AUTH_SECRET` (long random string). Put the three values in local `.env` while testing against Neon, and in Vercel later.

```powershell
npx prisma migrate deploy
```

If Docker Desktop is not installed, use Neon for local development too: put the Neon URLs in `.env` and run `npx prisma migrate deploy`. Docker Compose is only for a Postgres on your machine.

## Vercel (web)

The public app is the Vercel URL, not localhost. After this repo is on GitHub and imported in Vercel:

1. Env on Vercel: `DATABASE_URL` (Neon pooled), `DIRECT_URL` (Neon direct), `AUTH_SECRET` (long random string).
2. Deploy. `vercel.json` runs `prisma generate`, `prisma migrate deploy`, then `next build`.
3. Open `https://….vercel.app` and create an account there.

## iOS

`mobile/` is Expo Router. Tabs after sign-in: Logbook | Connect.

```powershell
cd mobile
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to the Vercel URL (or `http://YOUR_LAN_IP:3000` on a phone against local `next dev`).

Sign in with the **same** email as the web app. A workout saved on the web appears on the Logbook tab. Connect copy is “Turn on the PM5. Stay on this screen.” Live BLE needs a **dev build**; Expo Go cannot scan. **Save 500 m (dev)** is under Developer on Connect.

## Coach

Switch role in the nav. Create an invite; the athlete opens `/join/{token}` (must be signed in). Club/university/federation codes also attach the athlete to the org owner. Existing workouts stay on the athlete and show in the roster (no duplicate rows).
