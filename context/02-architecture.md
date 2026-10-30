# 02 · Architecture

## Shape

A single Next.js application. Server Components render pages, Server Actions
mutate, Prisma talks to Postgres. No separate API service, no client-side data
fetching library.

```
Browser
  │  RSC payload / HTML
  ▼
Next.js 16 (Vercel, Node runtime)
  ├── Server Components ──► Prisma 7 ──► Postgres (Neon)
  ├── Server Actions ─────► Prisma 7 ──► Postgres
  ├── proxy.ts (edge-ish gate for /admin)
  └── Client Components (booking form, lock panel, admin table)
        └── Redux Toolkit (booking draft only)
```

## Stack and why

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 App Router | Server rendering + server mutations in one deployable; strongest signal for a full-stack review |
| Language | TypeScript strict | Shared types between validation, actions, and UI |
| Styling | Tailwind 4 + shadcn/ui (radix-nova) | Fast, consistent, accessible primitives; requested |
| Components | shadcn/ui, black-and-white theme | Owned source, no runtime dependency on a component library |
| Forms | react-hook-form + Zod 4 | Requested; one schema shared by client and server |
| Client state | Redux Toolkit | Requested; used for the booking draft, not for server data |
| ORM | Prisma 7 + `@prisma/adapter-pg` | Typed queries, migrations, and raw SQL escape hatch for the exclusion constraint |
| Database | Postgres 18 (Neon) | Real exclusion constraints, hosted, free tier, serverless-friendly pooler |
| Auth | `jose` HS256 JWT cookie | Small surface, no session table, works in proxy and server |
| Dates | date-fns + `YYYY-MM-DD` strings | Calendar dates, not instants |
| Tests | Vitest + Playwright | Fast unit tests, real browser for the flows that matter |

## Rendering and caching

- `cacheComponents` is **disabled**. Every business page reads live reservation
  data; a cached van page could show availability that no longer exists. Pages
  that touch the database declare `export const dynamic = "force-dynamic"`.
- Static: `/manage`, `/admin/login`, `/icon.svg`, `/_not-found`.
- Dynamic: `/`, `/vans/[slug]`, `/reservations/[reference]`, `/admin`,
  `/admin/reservations/[id]`.
- After a write, actions call `revalidatePath` for the affected pages. The
  booking page is never served from a stale cache.

## Data flow: creating a booking

```
BookingForm (client)
  │  RHF + zodResolver (same schema as the server)
  │  availability check against bookedRanges (preloaded server-side)
  ▼
createBooking(values)  [server action]
  │  1. bookingSchema.safeParse
  │  2. load Van (rate from DB, not from the client)
  │  3. pre-check overlap → friendly error
  │  4. $transaction(Serializable)
  │       re-check overlap
  │       INSERT reservation
  │  5. exclusion constraint backstops the race
  ▼
{ ok: true, reference }
  │
  ├── revalidatePath("/"), ("/vans/[slug]"), ("/admin")
  └── client: clear Redux draft → router.push(/reservations/REF?new=1)
```

## Why three layers of overlap protection

1. **UI** — instant feedback, disabled submit, no wasted round trip.
2. **Serializable transaction** — two requests that both pass the pre-check
   cannot both commit; one gets a serialization failure.
3. **Exclusion constraint** — even a future code path that forgets the check
   (a script, an admin import, a second service) cannot create the overlap.

Only the third is a real guarantee. The first two are user experience and
defence in depth. See [ADR-004](./06-decisions.md#adr-004-prevent-double-bookings-in-the-database).

## Auth boundary

- `src/proxy.ts` (Next 16 renamed middleware to proxy) redirects unauthenticated
  `/admin/*` requests to `/admin/login`. This is a convenience, not the boundary.
- `src/app/admin/(dashboard)/layout.tsx` calls `requireAdmin()`.
- **Every admin server action** calls `requireAdmin()` again. A POST can be
  crafted without ever rendering a page.

## Folder responsibilities

| Path | Owns |
|---|---|
| `src/app/**/page.tsx` | Composition, data loading, metadata |
| `src/app/actions/*` | Mutations, authorization, validation, revalidation |
| `src/lib/dates.ts` | Calendar-date arithmetic (single source of truth) |
| `src/lib/availability.ts` | Pure overlap/occupancy rules (shared, tested) |
| `src/lib/pricing.ts` | Integer-cent pricing |
| `src/lib/validation.ts` | Zod schemas used on both sides |
| `src/lib/queries.ts` | Read model + DTO mapping (`ReservationView`) |
| `src/lib/auth.ts` / `session.ts` | Password check, token signing, guards |
| `src/store/` | Redux draft (sessionStorage persistence) |
| `prisma/` | Schema, SQL constraints, idempotent seed |

## Deployment

- **App:** Vercel, auto-deploy on push to `main`.
- **DB:** Neon Postgres. The app uses the pooled connection; Prisma migrations
  use the direct connection (`DIRECT_URL`).
- **Secrets:** `DATABASE_URL`, `DIRECT_URL`, `ADMIN_PASSWORD`, `SESSION_SECRET`
  set in Vercel project settings.
- **Build:** `prisma generate && next build`. Migrations are applied with
  `prisma migrate deploy` as part of the release procedure in
  [`09-runbook.md`](./09-runbook.md), not automatically on every build.
