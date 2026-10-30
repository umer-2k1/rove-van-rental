# 01 · Functional spec

Behaviour is defined here. Anything not stated is an implementation detail.

## Actors

| Actor | Has | Can |
|---|---|---|
| Visitor | Nothing | Browse fleet, check availability, book, look up a booking by reference |
| Customer | A booking reference | Everything above, plus lock/unlock during the rental window |
| Admin | `ADMIN_PASSWORD` | Everything above, plus see all bookings, cancel, override the lock |

There is no customer account. The booking reference is the customer's
credential (see [ADR-007](./06-decisions.md#adr-007-the-booking-reference-is-the-customer-credential)).

## B1 · Browse the fleet

- `/` lists exactly the vans in the `Van` table, ordered by `sortOrder`.
- Each card shows photo, name, tagline, seats, sleeps, transmission, daily rate.
- Clicking a card opens `/vans/[slug]`.
- Unknown slug → 404 page.

## B2 · Choose dates

- Calendar shows one month at a time; navigation limited to
  `[current month, current month + 180 days]`.
- Past dates are not selectable.
- Nights already reserved by a **confirmed** reservation are struck through and
  not selectable as either endpoint.
- A range that would overlap a reserved night is rejected inline; the confirm
  button is disabled and the offending range is named (`Already reserved 10 – 13 Nov`).
- Pickup must be before return. Minimum 1 night, maximum 30 nights.
- Bookings open up to 180 days ahead.

**Half-open rule:** a reservation occupies `[pickup, return)`. Returning on the
13th frees the 13th for a new pickup. This is the standard rental interpretation
and is implemented as a `daterange(..., '[)')` exclusion constraint.

## B3 · Enter details

- Full name: 2–80 characters.
- Email: valid format, trimmed, lower-cased before storage.
- Phone: 7–20 characters, digits with optional `+`, spaces, dots, dashes,
  parentheses. International numbers accepted (the demo uses `+92`).
- All fields required. Errors appear under the field, not in a summary, and are
  announced to assistive tech (`role="alert"`).

## B4 · Confirm

1. Client validates with the shared Zod schema.
2. Server re-validates the same schema (never trusts the client).
3. Van is re-read from the database; rate comes from the database, not the client.
4. Price is computed: `nights × dailyRate + cleaningFee`.
5. A serializable transaction re-checks overlap and inserts the row.
6. Postgres exclusion constraint rejects any overlap that slipped through.
7. A reference (`RV-` + 6 chars, no `I/O/0/1`) and a six-digit unlock code are generated.
8. Redirect to `/reservations/[reference]?new=1`.

Failure modes:

| Condition | Result |
|---|---|
| Dates overlap a confirmed booking | Inline "Already reserved …" message, no row written |
| Van missing | Generic "no longer in the fleet" |
| Validation failure | Field errors, nothing written |
| Reference collision | Retried once with a new reference |
| Unknown server error | "Something went wrong saving the reservation." + server log |

## B5 · Confirmation page

- Booking reference, copy button, status pill, creation date.
- Van, dates, nights, rate, cleaning, total (all from the stored snapshot).
- Customer contact details (masked? no — the reference holder is the customer).
- Unlock code and lock panel.
- `?new=1` adds a one-time "Reservation confirmed" banner. Refreshing does not
  duplicate the booking.

## B6 · Look up a booking

- `/manage` accepts a reference, case-insensitive, with or without spaces.
- Valid + exists → redirect to the reservation page.
- Invalid format or unknown → inline error; no enumeration hints beyond
  "No reservation found".
- No email challenge — consistent with a reference-as-credential model.

## B7 · Lock and unlock (bonus)

- A reservation starts **locked**.
- Control is enabled iff `status = CONFIRMED` **and** `pickup ≤ today ≤ return`.
- Toggle writes `isLocked` and appends a `LockEvent` (`LOCK`/`UNLOCK`, source
  `CUSTOMER` or `ADMIN`) in one transaction.
- Concurrency: the update is conditional on the previously read value
  (`updateMany where { id, isLocked: previous }`), so double clicks cannot
  desynchronise state from the event log.
- Outside the window the endpoint returns a human reason and the UI disables
  the control:
  - upcoming → "The lock activates on pickup day, 10 Nov"
  - ended → "This rental ended on 13 Nov"
  - cancelled → "This reservation was cancelled"
- The UI states clearly that the lock is simulated.

## B8 · Admin sign-in

- `/admin/*` (except `/admin/login`) requires a valid session.
- Password compared in constant time against `ADMIN_PASSWORD`.
- Session: HS256 JWT in an `httpOnly`, `SameSite=Lax` cookie, 8-hour expiry,
  `Secure` in production, signed with `SESSION_SECRET`.
- Wrong password → generic error, no timing leak, no rate limit (documented limit).
- Already signed in and visiting `/admin/login` → redirected to `/admin`.

## B9 · Admin dashboard

- Header: confirmed count, active-now count, upcoming count, booked revenue.
- Tabs: All / Confirmed / Cancelled, with counts. Tab state lives in the URL
  (`?status=`), so it is linkable and survives refresh.
- Search matches reference, customer name, email, phone, van name (client-side,
  case-insensitive).
- Desktop table + mobile card list. Both render; CSS hides one.
- Row opens `/admin/reservations/[id]`.

## B10 · Admin reservation detail

- Header: reference, van, date range, status, lock state, actions.
- Price breakdown, customer contact, creation timestamp (UTC).
- Lock activity timeline, newest first, labelled by actor.
- Cancel requires confirmation in a dialog; cancellation:
  - sets `status = CANCELLED`, `cancelledAt = now()`
  - releases the dates immediately (the exclusion constraint only applies to
    `CONFIRMED`)
  - is idempotent: second attempt returns "already cancelled"
- Lock override works at any time for a non-cancelled reservation and is logged
  with source `ADMIN`.

## Non-functional requirements

- **Responsive:** no horizontal scroll at 320 px; layout works at 320, 390,
  768, 1024, 1440.
- **Accessibility:** labelled controls, visible focus, AA contrast, semantic
  headings, table headers, dialog focus trap (Radix).
- **Performance:** fleet and booking pages server-rendered; images optimised by
  `next/image`; no client-side data waterfall.
- **Persistence:** all writes committed to Postgres before the UI confirms.
- **Time:** date-only values; timestamps displayed in UTC and labelled as such.

## Acceptance criteria

| # | Criterion | Verified by |
|---|---|---|
| AC1 | Home lists 3 vans with price and image | E2E `customer books…` |
| AC2 | A valid booking creates a row and shows a reference | E2E + DB |
| AC3 | Refresh keeps the booking | E2E reload |
| AC4 | Overlapping dates are refused | E2E + DB constraint |
| AC5 | Reference lookup works case-insensitively | E2E `manage booking…` |
| AC6 | `/admin` redirects when signed out | E2E `admin signs in…` |
| AC7 | Wrong admin password is rejected | E2E |
| AC8 | Admin can search, open, cancel | E2E |
| AC9 | Lock toggles only inside the window and persists | E2E `lock control…` |
| AC10 | No horizontal overflow on a 390 px viewport | E2E mobile |
| AC11 | Unit rules: dates, overlap, pricing, validation | Vitest, 22 tests |
