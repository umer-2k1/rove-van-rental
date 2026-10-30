# 10 · Known limits

Written down on purpose. A demo that pretends to be production is worse than
one that names its edges.

## Product gaps

| Gap | Why it is not here | What production needs |
|---|---|---|
| No payment or deposit | Brief asks for a reservation; a fake checkout invites PCI questions | Stripe Checkout + webhook, authorise a deposit hold, refund on cancellation |
| No email confirmation | Needs a provider, templates, deliverability, and bounce handling | Resend/SES, booking confirmation + 24 h reminder, `.ics` attachment |
| Customer cannot cancel | Keeps one cancellation path and one permission model | Signed cancel link in the email, policy windows, partial refunds |
| No customer accounts | The reference is the credential; accounts add password reset, verification, GDPR scope | Magic-link auth or OAuth, booking history |
| No driver verification | Out of scope | Licence upload, expiry check, age minimum |
| No availability buffer | A van can be returned and re-rented the same day | Cleaning buffer / turnaround window per van |
| No time-of-day | Dates are whole days | Pickup slots, late-return fees |
| No multi-location | Single pickup address | Locations, one-way fees, fleet per site |
| No fleet admin | Vans are seeded | CRUD for vans, rates, blackout dates, maintenance |
| No pagination in admin | Three vans, a handful of bookings | Server-side pagination + date filters at volume |
| No i18n / currency | Single market | Locale routing, per-currency pricing |

## Security and operations

| Limit | Risk | Mitigation / next step |
|---|---|---|
| One shared admin password | No attribution, one leak compromises everything | Users table + hashed passwords + TOTP, or SSO |
| No rate limiting on login or booking | Brute force, spam bookings | Upstash Redis rate limit at the edge; CAPTCHA on booking |
| Reference is the only credential | A leaked reference allows lock control | Add email or last-name verification before showing controls |
| No audit of admin logins | Cannot investigate access | `AdminEvent` table, IP + user agent |
| No email verification | Typos produce unreachable bookings | Verification link before confirmation |
| No GDPR tooling | Cannot export/delete a customer | Data export + deletion endpoint, retention policy |
| No automated backups in this setup | Neon free tier has limited PITR | Paid Neon branch/PITR or scheduled `pg_dump` |
| No CSP | XSS surface is small (React escapes) but headers are absent | `Content-Security-Policy` + `next-secure-headers` |
| Demo data in the seed | Reviewers see `RV-DEMO01` | Guard seeding behind an env flag for production |

## Technical debt

- `revalidatePath` is called per page; with Cache Components or tags this would
  be more precise. Not worth it at this size.
- Admin search is client-side over all rows. Fine for a demo; move to Postgres
  `ILIKE` + trigram index when the list grows.
- The mobile admin list and the desktop table both render (CSS hides one), which
  duplicates DOM. Acceptable, but a single responsive table would be leaner.
- Date horizon (180 days) and max rental (30 days) are constants; they should be
  configurable per van or per season.
- No structured logging or tracing; `console.error` only.

## Deliberate non-goals for the assignment

- Dark mode (tokens support it, but it doubles the review surface)
- Animations beyond hover transitions (explicitly requested to keep it minimal)
- A component library of our own (shadcn primitives are enough)
- Tests for the admin UI beyond the happy path and auth failure
