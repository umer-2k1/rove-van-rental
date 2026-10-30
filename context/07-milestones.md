# 07 · Milestones

Each milestone is a checkpoint with an artefact, not a progress bar. If a later
change breaks an earlier artefact, that is a regression.

---

## M0 · Repository and toolchain

**Goal.** A predictable project that builds from a clean clone.

- Next.js 16 + TypeScript + Tailwind 4 scaffolded with pnpm.
- shadcn/ui initialised (`radix-nova` preset, neutral base, Geist + Lucide).
- ESLint, `tsc --noEmit`, Vitest, Playwright configured.
- `.env.example`, `.gitignore`, `pnpm-workspace.yaml` build approvals.

**Evidence:** `package.json`, `pnpm-lock.yaml`, `components.json`,
`playwright.config.ts`, `vitest.config.mts`.

---

## M1 · Data model and constraints

**Goal.** The database cannot hold an impossible booking.

- `prisma/schema.prisma`: `Van`, `Reservation`, `LockEvent`, three enums.
- Initial migration hand-edited to add `btree_gist`, the
  `Reservation_no_overlap` exclusion constraint, and the date-order check.
- Idempotent seed with three vans and two demo reservations.
- Prisma client generated to `src/generated/prisma`, imported through
  `@/lib/db`.

**Evidence:** `prisma/migrations/*/migration.sql`,
`psql -c '\d "Reservation"'` shows both constraints.

---

## M2 · Customer booking flow

**Goal.** A stranger can book a van and trust the result.

- Fleet grid and van detail pages.
- Range calendar with struck-through booked nights, past and horizon limits.
- Shared Zod schema + react-hook-form.
- `createBooking` server action: re-validation, DB-sourced pricing,
  serializable transaction, reference + unlock code generation.
- Confirmation page with the price snapshot and a clear next step.
- `/manage` lookup.

**Evidence:** E2E `customer books a van…`, `manage booking…`;
`docs/screenshots/home.png`, `van-detail.png`, `reservation.png`.

---

## M3 · Availability enforcement

**Goal.** Two customers cannot book the same night, including under a race.

- Half-open overlap helpers shared by client and server.
- Pre-check, transactional re-check, and the database constraint.
- Conflict messaging in the form and a clean failure from the action.

**Evidence:** Vitest `availability.test.ts`; a direct SQL insert of an
overlapping row fails with `23P01`; E2E overlap assertion.

---

## M4 · Admin dashboard

**Goal.** An operator can run the fleet from one screen.

- Password sign-in with a signed, httpOnly cookie.
- `proxy.ts` redirect + layout guard + per-action `requireAdmin()`.
- Counts (confirmed, active, upcoming, revenue), status tabs in the URL,
  client-side search.
- Detail page with price breakdown, customer, lock state, event timeline.
- Cancel with confirmation; lock override.

**Evidence:** E2E `admin signs in…`; `docs/screenshots/admin-dashboard.png`,
`admin-reservation.png`.

---

## M5 · Lock simulation (bonus)

**Goal.** The lock is a small, correct state machine, not a button that says
"done".

- Server action checks status and the rental window.
- Conditional update (`where isLocked = previous`) prevents double-click drift.
- One `LockEvent` per change, actor recorded.
- Disabled UI with a reason outside the window; persisted across reload.

**Evidence:** E2E `lock control works only inside the rental window`;
`LockEvent` rows visible in the admin timeline.

---

## M6 · Design and responsive pass

**Goal.** It looks intentional at every width and is usable by keyboard.

- Monochrome token set; no gradients; greyscale imagery.
- Mobile sheet navigation; stacked booking form; card list in admin.
- Focus states, labels, `aria-invalid`, `role="alert"`, skip link.
- Screenshots at 1440 and 390.

**Evidence:** `context/05-design-system.md`, `docs/screenshots/*`.

---

## M7 · Tests

**Goal.** The rules are pinned down.

- 22 Vitest tests: dates, overlap, pricing, validation.
- 7 Playwright tests: booking + persistence + overlap, lookup, admin auth +
  search + cancel, lock window, mobile, and axe WCAG A/AA scans.
- All run against the real database, not mocks.

**Evidence:** `pnpm test`, `pnpm test:e2e` output in
[`08-testing.md`](./08-testing.md).

---

## M8 · Documentation and release

**Goal.** A reviewer can understand and run it without asking questions.

- README with screenshots, setup, scripts.
- `context/` spec, architecture, data model, API, design, ADRs, runbook.
- Deployment to Vercel with Neon; smoke test on the deployed URL.
- Git history grouped by milestone.

**Evidence:** this folder, the Vercel deployment, the GitHub repository.

---

## Not a milestone (deliberately)

Payments, email, customer accounts, fleet CRUD, i18n, analytics. See
[`10-known-limits.md`](./10-known-limits.md).
