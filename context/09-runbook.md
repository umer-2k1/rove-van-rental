# 09 · Runbook

## Current deployment

| | |
|---|---|
| App | https://rove-van-rental.vercel.app |
| Vercel project | `umermemon4648s-projects/rove-van-rental` |
| Database | Neon Postgres, `us-east-2` |
| Auto-deploy | Connected to `main` on GitHub |

## Prerequisites

- Node 20.9+ (developed on 22.23)
- pnpm 10 (`corepack enable pnpm`)
- A Postgres database (Neon free tier is enough)

## Environment

| Variable | Required | Used by | Notes |
|---|---|---|---|
| `DATABASE_URL` | yes | app | Pooled Neon URL (`-pooler` host), `sslmode=verify-full` |
| `DIRECT_URL` | yes | Prisma CLI | Same host without `-pooler`; migrations need a direct connection |
| `ADMIN_PASSWORD` | yes | admin login | Shared password for the demo |
| `SESSION_SECRET` | yes | cookie signing | 32+ random chars; rotating it signs everyone out |

`.env` is gitignored. `.env.example` documents the shape.

## First run

```bash
pnpm install                 # postinstall runs prisma generate
cp .env.example .env         # then fill in the four values
pnpm db:migrate              # prisma migrate deploy
pnpm db:seed                 # 3 vans + 2 demo reservations (idempotent)
pnpm dev                     # http://localhost:3000
```

Admin: `http://localhost:3000/admin` → the `ADMIN_PASSWORD` value.

## Migrations

```bash
pnpm prisma migrate dev --name <change>   # create + apply locally
pnpm db:migrate                           # apply pending migrations (prod)
```

The exclusion constraint and the date-order check are **hand-written SQL** in
`prisma/migrations/20261030140225_init/migration.sql`. If the schema is ever
reset from scratch, keep that block:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_no_overlap"
  EXCLUDE USING gist (
    "vanId" WITH =,
    daterange("pickupDate", "returnDate", '[)') WITH &&
  )
  WHERE ("status" = 'CONFIRMED');
ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_date_order" CHECK ("returnDate" > "pickupDate");
```

Verify after migrating:

```sql
SELECT conname, contype FROM pg_constraint
WHERE conrelid = '"Reservation"'::regclass;
-- expect Reservation_no_overlap (x) and Reservation_date_order (c)
```

## Seed

`pnpm db:seed` upserts by slug and reference, so it is safe to run repeatedly.
Demo reservations are relative to today and use references `RV-DEMO01/02`.

## Deploy (Vercel + Neon)

1. **Neon:** create a project; copy the pooled and direct connection strings.
2. **Vercel:** import the GitHub repository. Framework preset: Next.js.
   Build command stays `pnpm build` (it runs `prisma generate`); install command
   is `pnpm install`.
3. **Environment variables:** add all four for Production and Preview.
4. **Migrate:** from a machine with `DIRECT_URL` set, run `pnpm db:migrate`,
   then `pnpm db:seed`.
5. **Deploy:** push to `main`, or trigger a redeploy.
6. **Smoke test** (below).

Migration is intentionally **not** part of the build: a failed migration should
not take down the site, and Vercel build containers should not hold DDL rights.

## Post-deploy smoke test

1. `/` loads with three vans and images.
2. `/vans/classic` → pick dates → confirm → reference page appears.
3. Reload the reference page; booking is still there.
4. Repeat the same dates; the form refuses.
5. `/admin` redirects to login; sign in; the booking is in the table.
6. Cancel it; the dates become bookable again.
7. Open a reservation whose window includes today; unlock/lock works.
8. 390 px viewport: no horizontal scroll, menu opens.

## Rollback

- **Code:** Vercel → Deployments → previous deployment → "Promote to
  Production". Instant, no rebuild.
- **Database:** migrations are additive in this project (one enum, three tables,
  two constraints). A code rollback does not require a schema rollback. If a
  destructive migration is ever added, write a paired down-migration and take a
  Neon branch first.
- **Data:** Neon supports point-in-time restore on paid plans; on free tier take
  a `pg_dump` before risky operations.

## Rotating secrets

| Secret | Effect | Procedure |
|---|---|---|
| `ADMIN_PASSWORD` | New password next login | Update env, redeploy |
| `SESSION_SECRET` | All admin sessions invalidated | Update env, redeploy |
| `DATABASE_URL` | New connection | Update env, redeploy, keep the old role until verified |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `DATABASE_URL is not set` | Missing env | Create `.env` from `.env.example` |
| `Can't reach database server` | Wrong host / paused Neon branch | Check the host; open the Neon console |
| `prepared statement "s0" already exists` | Using the direct URL through a pooler, or vice versa | Runtime → pooled; migrations → direct |
| `PrismaClientInitializationError` on Vercel | `prisma generate` skipped | Build command must be `pnpm build` (it generates) |
| Calendar days all rejected with "Enter a valid date" | Regression in `isValidIsoDate` (UTC conversion) | `pnpm test` — the date tests cover this |
| `P3018` / `23P01` during seed | Demo dates collide with a real booking | Change `pickupOffset` in `prisma/seed.ts` or clear demo rows |
| Admin login loops | `SESSION_SECRET` changed between requests, or cookies blocked | Check env consistency; test in a normal window |
| Images 404 on Vercel | `public/vans` not committed | Commit the JPGs |

## Logs

- Vercel → Project → Logs (server actions log `console.error` on unexpected
  failures).
- Neon → Monitoring for connection counts and slow queries.
- Playwright traces: `test-results/<test>/trace.zip` → `pnpm exec playwright show-trace ...`.
