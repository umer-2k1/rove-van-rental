# 04 · API contract

There is no REST API. Mutations are Next.js Server Actions; reads happen in
Server Components. This keeps the surface small and means no hand-written
fetch layer.

Every action is a public POST endpoint once the page is built, so each one
validates its input and checks authorization itself.

## `createBooking(input: unknown)`

File: `src/app/actions/booking.ts`

**Input** (validated with `bookingSchema`):

```ts
{
  vanSlug: string;         // must exist
  pickupDate: string;      // YYYY-MM-DD, >= today, <= today + 180
  returnDate: string;      // YYYY-MM-DD, > pickup, <= pickup + 30
  customerName: string;    // 2..80
  customerEmail: string;   // valid, normalised to lower-case
  customerPhone: string;   // 7..20, digits and + - ( ) . space
}
```

**Returns**

```ts
type CreateBookingResult =
  | { ok: true; reference: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };
```

| Situation | `ok` | Message |
|---|---|---|
| Created | `true` | — (reference like `RV-4K7M2Q`) |
| Invalid fields | `false` | "Check the highlighted fields…" + `fieldErrors` |
| Overlap | `false` | "Those dates are already reserved…" + `returnDate` error |
| Van missing | `false` | "That van is no longer in the fleet." |
| Constraint/serialization failure | `false` | Same as overlap |
| Unexpected | `false` | "Something went wrong saving the reservation…" (logged) |

**Side effects:** inserts `Reservation`; revalidates `/`, `/vans/[slug]`, `/admin`.

**Concurrency:** serializable transaction + exclusion constraint. A caller that
loses the race receives the overlap message, never a partial write.

---

## `toggleVanLock(reference: string)`

File: `src/app/actions/lock.ts`

**Returns**

```ts
type ToggleLockResult =
  | { ok: true; locked: boolean }
  | { ok: false; message: string };
```

Refuses when: reference malformed, reservation missing, status `CANCELLED`,
or today outside `[pickup, return]`. Refusal messages are user-facing reasons,
not error codes.

**Side effects:** flips `isLocked` (conditional update), appends one `LockEvent`
with source `CUSTOMER`, revalidates the reservation page and `/admin`.

---

## `loginAdmin(_prev, formData)`

File: `src/app/actions/admin.ts`

Form action used with `useActionState`.

| Input | Result |
|---|---|
| Wrong password | `{ error: "That password is not correct." }` |
| Missing password | `{ error: "Enter the admin password." }` |
| Correct password | Sets cookie, `redirect("/admin")` |

Password comparison is SHA-256 + `timingSafeEqual`. The session is an HS256 JWT
(`{ role: "admin" }`, 8 h) in the `rove_admin` cookie.

## `logoutAdmin()`

Deletes the cookie and redirects to `/admin/login`.

## `lookupBooking(_prev, formData)`

Form action on `/manage`.

| Input | Result |
|---|---|
| Malformed | `{ error: "Enter a reference like RV-4K7M2Q." }` |
| Unknown | `{ error: "No reservation found with that reference." }` |
| Found | `redirect("/reservations/<REF>")` |

## `cancelReservation(reservationId: string)`

Admin only (`requireAdmin()`).

```ts
{ ok: true } | { ok: false; message: string }
```

Idempotent: cancelling an already-cancelled row returns
"That reservation is already cancelled." Sets `status`, `cancelledAt`, and
releases the dates. Revalidates `/admin` and `/`.

## `adminSetLock(reservationId: string, locked: boolean)`

Admin only. Same conditional-update + event-log transaction as the customer
action, but source `ADMIN` and **no time-window restriction** (an operator may
need to lock a van early). Refuses cancelled reservations.

## Routes

| Route | Rendering | Auth | Notes |
|---|---|---|---|
| `/` | Dynamic | Public | Fleet from DB |
| `/vans/[slug]` | Dynamic | Public | 404 if unknown |
| `/reservations/[reference]` | Dynamic | Public (reference is the key) | 404 if unknown |
| `/manage` | Static | Public | Client form → action |
| `/admin/login` | Static | Public | Redirects to `/admin` if already signed in |
| `/admin` | Dynamic | Admin | Dashboard |
| `/admin/reservations/[id]` | Dynamic | Admin | Detail |
| `/_not-found` | Static | Public | Custom 404 |

## Headers / cookies

| Cookie | Flags |
|---|---|
| `rove_admin` | `httpOnly`, `sameSite=lax`, `secure` in production, `path=/`, 8 h |

`/admin/*` responses are also marked `noindex` via page metadata.

## Error philosophy

- Validation errors are **returned**, not thrown, so the form can render them.
- Authorization failures `redirect()` to the login page.
- Unexpected errors are logged server-side and replaced with a generic message;
  stack traces never reach the client.
