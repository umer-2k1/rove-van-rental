# 00 · Product brief

## The brief, verbatim

> Build a simple, functional web application for booking rental vans.
>
> - **Vehicle selection:** display 3 rental vans with images, descriptions, and daily rental prices.
> - **Online booking:** select a van, choose pickup and return dates, enter contact information, confirm a reservation.
> - **Availability management:** prevent customers from booking a van already reserved for the selected dates.
> - **Admin dashboard:** a page where an administrator can view all reservations and their details.
> - **Database:** reservations persist after refreshing.
> - **Bonus:** simulated lock/unlock during the rental period.
> - Functional frontend and backend, database integration, clean responsive design, any stack.

## Constraints agreed with the requester

- **Stack chosen for reviewability:** Next.js 16 + Postgres, deployed on Vercel.
- **Package manager:** pnpm (not npm).
- **No Docker.** The database is a hosted Neon Postgres instance.
- **Design:** monochrome (soft white + near-black), minimal, no gradients,
  no decorative animation. shadcn/ui primitives, black-and-white theme.
- **Libraries requested:** Redux, react-hook-form, Zod, shadcn/ui.
- **Scope discipline:** finish the required features and the bonus properly
  rather than adding unrelated features.
- **Everything owned end to end:** repo initialisation, tests, docs, deploy.

## What was built

| Requirement | Implementation |
|---|---|
| Three vans with images, descriptions, prices | Seeded `Van` rows; `/` fleet grid; `/vans/[slug]` detail with specs, features, policies |
| Select van and dates | Range calendar with booked nights struck through; server-validated |
| Contact information | Name, email, phone — react-hook-form + Zod, shared schema on client and server |
| Confirm reservation | Server action writes to Postgres, returns a reference; confirmation page |
| Prevent double booking | Client check + serializable transaction + Postgres exclusion constraint (three layers) |
| Admin dashboard | Password + signed cookie; stats, searchable/filterable table, detail page, cancel, lock override |
| Persistence | Postgres (Neon); verified by reload in E2E |
| Bonus: lock/unlock | Time-windowed, customer and admin paths, every toggle logged |
| Responsive, clean design | Single-column mobile, 12-column desktop, AA contrast, keyboard tested |
| Docs | This folder |

## Deliberately out of scope

Payments, email/SMS delivery, customer accounts, driver-licence verification,
i18n, multi-currency, refunds, fleet editing UI. Each is listed with a reason
in [`10-known-limits.md`](./10-known-limits.md).

## Definition of done

1. A first-time visitor can book a van in under a minute on desktop or mobile.
2. Two tabs cannot book the same van for overlapping dates.
3. A booking survives refresh, restart, and redeploy.
4. The admin can find, inspect, and cancel any reservation.
5. The lock control works only inside the rental window and leaves an audit trail.
6. `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test`, `pnpm test:e2e` all pass.
