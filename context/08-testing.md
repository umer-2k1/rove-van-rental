# 08 · Testing

## Commands

```bash
pnpm test        # Vitest, 22 tests, no network needed
pnpm test:e2e    # Playwright, Chromium desktop + mobile emulation
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm build       # prisma generate + next build
```

`pnpm test:e2e` starts the dev server automatically unless one is already
running (`reuseExistingServer`). It uses the real Neon database and cleans up
every row whose customer email starts with `e2e-`, before and after the run.

## Unit tests (Vitest)

| File | Covers |
|---|---|
| `tests/unit/dates.test.ts` | ISO validation, day arithmetic across month/year boundaries, night counts, range formatting, lock window, rental phase, Prisma date conversion |
| `tests/unit/availability.test.ts` | Half-open overlap, same-day turnover, conflicts, occupied nights (return day excluded), range merging |
| `tests/unit/pricing.test.ts` | Night × rate + cleaning, single night, negative guard, currency formatting |
| `tests/unit/validation.test.ts` | Booking schema: valid case, return ≤ pickup, past pickup, >30 nights, >180 days ahead, email normalisation, phone rules, reference format |

The date tests intentionally pin behaviour that breaks in UTC+ timezones if
`toISOString()` is used on local dates. That bug was caught during manual
testing in Asia/Karachi and is now locked down.

## End-to-end tests (Playwright)

| Test | Steps | Asserts |
|---|---|---|
| `customer books a van, booking survives a refresh, overlap is blocked` | Home → Classic → range (+50 to +53 days) → contact → confirm | Reference matches `RV-XXXXXX`, total is $480, reload keeps the booking, a +49→+54 range is refused and the button is disabled |
| `manage booking finds the reference` | `/manage`, lower-case reference | Redirects to the reservation and shows the reference |
| `admin signs in, finds the reservation, and cancels it` | `/admin` unauthenticated, wrong password, correct password, search, open, cancel via dialog | Redirect to login, error text, table row, detail, cancel toast, status pill |
| `lock control works only inside the rental window` | A fixture with pickup yesterday; unlock, reload, lock; a future fixture | State changes, persists, future booking is disabled with a reason |
| `mobile: navigation, fleet, and no horizontal overflow` | 390 px viewport | No horizontal scroll, sheet opens, manage page reachable, van form visible |
| `accessibility: public pages` | axe scan of home, van detail, manage, reservation | Zero WCAG 2.1 A/AA violations |
| `accessibility: admin sign-in and dashboard` | axe scan of login and dashboard | Zero WCAG 2.1 A/AA violations |

Fixtures are inserted with plain SQL (`e2e/fixtures.ts`) because the generated
Prisma client is ESM and Playwright transpiles tests to CommonJS.

## Regression checklist (manual, before release)

1. Book a van; confirm the total matches the printed breakdown.
2. Book the same dates in a second browser; expect the conflict message.
3. Cancel from admin; rebook the freed dates from the shop front.
4. Change a van's rate in the database; confirm an existing reservation keeps
   its old total (snapshot).
5. Sign in as admin, wait 8 hours (or edit the JWT expiry), confirm redirect.
6. Tab through the booking form; every control is reachable with a visible ring.
7. Zoom to 200%; no clipping, no horizontal scroll.

## What is not covered

- Payment and email (not implemented).
- True parallel HTTP booking race (the exclusion constraint is tested directly
  with SQL; a load test is out of scope).
- Cross-browser: Chromium only. Safari/Firefox use the same standards, but
  Radix and `date-fns` should be smoke-tested if the audience requires it.
- Visual regression snapshots (screenshots are generated for review, not diffed).
- Accessibility automation (Lighthouse/manual only).
