# 06 · Decisions (ADRs)

Append-only. Each entry records the context at the time, the decision, and what
it costs. Superseded entries are marked, not deleted.

---

## ADR-001 · Next.js App Router + Postgres

**Status:** accepted

**Context.** The brief allows any stack. The work is judged as a hiring
exercise: it must run, look deliberate, and be easy to review.

**Decision.** One Next.js 16 application (App Router, TypeScript) with Neon
Postgres. Server Components for reads, Server Actions for writes.

**Consequences.**
- One repo, one deploy, no CORS, no duplicated types.
- Server-only code cannot leak into the bundle by accident.
- The reviewer can click a URL instead of running a server.
- Costs: the app is coupled to Vercel/Next conventions; self-hosting would need
  a Node server.

**Rejected.** Separate React SPA + Express API (two deploys, more boilerplate);
Django templates (less relevant to the role); SQLite (no hosted persistence on
Vercel).

---

## ADR-002 · Prisma 7 with the `pg` driver adapter

**Status:** accepted

**Context.** Prisma 7 requires an explicit driver adapter and generates the
client to a project path. The existing `@prisma/client` default import no
longer applies.

**Decision.** `prisma-client` generator with `output: ../src/generated/prisma`,
`@prisma/adapter-pg` + `pg`, one cached `PrismaClient` on `globalThis` in dev.
Migrations use the direct (non-pooled) Neon URL; runtime uses the pooler.

**Consequences.**
- Typed queries and migrations, with a raw-SQL escape hatch for constraints.
- Generated client is gitignored and recreated by `postinstall` / `build`.
- Costs: Prisma 7 is new enough that documentation is thinner; the adapter is
  mandatory, so an extra dependency and connection string exist.

**Rejected.** Drizzle (fine, but fewer reviewers know it); raw `pg` (hand-written
types and joins).

---

## ADR-003 · Calendar dates, half-open ranges

**Status:** accepted

**Context.** Rentals are sold by the night, not by the hour. Storing timestamps
invites timezone bugs; storing inclusive ranges creates off-by-one overlaps.

**Decision.** `date` columns, `YYYY-MM-DD` strings in the app, and reservations
occupy `[pickup, return)`. Same-day turnover is allowed.

**Consequences.**
- A van returned on the 13th can be picked up on the 13th — the common rental
  convention.
- Overlap is `a.start < b.end && b.start < a.end`, which is simple and testable.
- Costs: no partial-day pricing, no "pickup at 16:00" semantics. Acceptable for
  this brief and documented as a limit.

**Rejected.** Timestamps with a default pickup time (more realistic, more edge
cases than the brief needs); inclusive end dates (off-by-one city).

---

## ADR-004 · Prevent double bookings in the database

**Status:** accepted

**Context.** "Prevent customers from booking a van already reserved" is the
core requirement. A `findFirst` check followed by an `INSERT` is a race: two
requests can both pass the check.

**Decision.** Three layers:
1. Client-side check for instant feedback.
2. `prisma.$transaction(..., { isolationLevel: "Serializable" })` that re-checks
   and inserts.
3. A Postgres exclusion constraint on `(vanId, daterange(pickup, return))`
   limited to `status = 'CONFIRMED'`, added by hand to the migration.

**Consequences.**
- Concurrent requests cannot both commit; the loser gets a clean conflict
  message.
- The constraint also protects future scripts and imports.
- Costs: `btree_gist` extension required; cancellation must use a status update
  rather than keeping the constraint applicable to all rows.

**Rejected.** Application-level lock (single process only); unique index on
dates (cannot express ranges); "check and hope" (fails the requirement).

---

## ADR-005 · Server Actions instead of a REST API

**Status:** accepted

**Context.** Every mutation is initiated by our own UI. A REST layer would mean
hand-written fetch clients, DTO duplication, and auth repeated per route.

**Decision.** Server Actions in `src/app/actions/`, called directly from forms
and client components. Reads happen in Server Components.

**Consequences.**
- End-to-end type safety and one round trip per mutation.
- Built-in Origin/CSRF check and encrypted action IDs.
- Costs: actions are still public POST endpoints, so each one validates input
  and re-checks authorization. No API for third parties; documented.

**Rejected.** Route Handlers + fetch (more surface, no benefit here); tRPC
(extra layer for one consumer).

---

## ADR-006 · Admin auth: password + signed JWT cookie

**Status:** accepted

**Context.** The brief asks for "a simple page where an administrator can view
reservations". A full user system is disproportionate.

**Decision.** A single `ADMIN_PASSWORD`, constant-time comparison, and an HS256
JWT (`role: admin`, 8 h) in an `httpOnly`, `SameSite=Lax`, `Secure` cookie.
`proxy.ts` redirects unauthenticated requests; the admin layout and **every
admin action** call `requireAdmin()` as well.

**Consequences.**
- No session table, no password reset flow, tiny surface.
- Costs: one shared password, no per-user audit, no rate limiting. Documented
  in `10-known-limits.md`. For real use this becomes a users table + SSO.

**Rejected.** NextAuth (heavy for one role); Basic Auth (dated UX, no logout);
no auth (unacceptable for customer data).

---

## ADR-007 · The booking reference is the customer credential

**Status:** accepted

**Context.** The brief asks for "manage/refresh" persistence and a lock control,
but not customer accounts. Requiring an email challenge adds friction and mail
infrastructure.

**Decision.** A booking reference (`RV-` + 6 chars from a 32-symbol alphabet,
≈ 10⁹ combinations) is the key. Anyone holding it can view and control that
booking. `/manage` looks up by reference only.

**Consequences.**
- Zero-friction flow, no email dependency, works from any device.
- The reference is not guessable in practice, and the unlock code is displayed
  only behind it.
- Costs: a leaked reference grants control. Real systems pair this with an email
  or last-name check; recorded as a limit.

**Rejected.** Accounts (out of scope); reference + email (better, but adds a
second factor the brief does not ask for and makes the demo harder to test).

---

## ADR-008 · Redux is for the booking draft only

**Status:** accepted

**Context.** Redux Toolkit was requested. Server data is fetched in Server
Components, so mirroring it in Redux would create two sources of truth.

**Decision.** Redux holds only the in-progress booking (van slug, pickup,
return), mirrored to `sessionStorage` so a refresh does not lose the dates.
Server data stays on the server. No RTK Query.

**Consequences.**
- A real user benefit (draft survives refresh / accidental navigation).
- No cache invalidation problems because there is no client cache.
- Costs: a provider and two small files; if the app grew a client-heavy
  dashboard, RTK Query would be the next step.

**Rejected.** Redux for all data (duplication); no state library (ignores the
request).

---

## ADR-009 · Cache Components disabled

**Status:** accepted

**Context.** Next 16 enables Cache Components by default in new apps. Every
page here reads live reservations; a cached fleet page could show availability
that has already been sold.

**Decision.** `cacheComponents: false`, `dynamic = "force-dynamic"` on
database-backed routes, and `revalidatePath` after writes.

**Consequences.**
- Correctness over micro-optimisation; the dataset is three vans.
- Costs: no static shell for booking pages, slightly more server work per view.
  At scale we would cache the marketing page and keep only availability dynamic.

**Rejected.** Default caching with short TTL (still wrong for bookings);
`use cache` with tags (more machinery than the app needs).

---

## ADR-010 · Monochrome shadcn theme, no accent hue

**Status:** accepted

**Context.** The requester asked for black and white, minimal, no gradients, and
explicitly not "trendy" colour.

**Decision.** Warm off-white canvas and near-black ink, a grey ramp, one
destructive red for errors, and no decorative colour. shadcn/ui with the
radix-nova preset, tokens overridden in `globals.css`. Status is encoded by fill
and text, not hue.

**Consequences.**
- The photographs carry all the colour (removed by greyscale, so the palette is
  controlled).
- The interface stays legible in screenshots and on poor displays.
- Costs: fewer affordances to signal state; we lean on fill, weight, and labels.

**Rejected.** Accent colours (brief), gradients/glass (brief), dark mode
(unnecessary for the scope; tokens allow adding it later).

---

## ADR-011 · Lock window is inclusive, admin can override

**Status:** accepted

**Context.** "During the rental period" is ambiguous at the boundaries.

**Decision.** Customer control is enabled when `pickup ≤ today ≤ return`
(inclusive). Admin may change the lock at any time for a non-cancelled booking.
Every change is logged with actor and timestamp.

**Consequences.**
- The customer can lock the van on the morning they return it, which matches
  real use.
- Admins are not blocked by date math when operating the fleet.
- Costs: two code paths for one action; both share the same transaction shape.

**Rejected.** Pickup-only window (customer cannot secure the van on the last
night); no admin override (operationally useless).

---

## ADR-012 · No payments, no email

**Status:** accepted

**Context.** The brief asks for a reservation, not a transaction.

**Decision.** No payment step. The confirmation is explicit: "No payment now."
No email is sent; the reference is shown on screen and can be looked up later.

**Consequences.**
- The flow is honest about what it does; no fake checkout to invite PCI
  questions.
- Costs: a real deployment needs a payment provider, email delivery, and a
  deposit hold. Documented as the first production gap.
