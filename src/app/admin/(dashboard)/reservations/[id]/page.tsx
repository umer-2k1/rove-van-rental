import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, LockIcon, UnlockIcon } from "lucide-react";

import { ReservationActions } from "@/components/admin/reservation-actions";
import { LockStatePill, StatusPill } from "@/components/pills";
import { getReservationById } from "@/lib/queries";
import { formatDate, formatDateRange, formatTimestamp } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservation",
  robots: { index: false, follow: false },
};

export default async function AdminReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = await getReservationById(id);
  if (!reservation) notFound();

  const detailRows = [
    { label: "Pickup", value: formatDate(reservation.pickupDate, "EEE d MMM yyyy") },
    { label: "Return", value: formatDate(reservation.returnDate, "EEE d MMM yyyy") },
    { label: "Nights", value: String(reservation.days) },
    {
      label: "Daily rate",
      value: `${formatMoney(reservation.dailyRateCents)} × ${reservation.days}`,
    },
    { label: "Cleaning", value: formatMoney(reservation.cleaningFeeCents) },
    { label: "Booked", value: formatTimestamp(reservation.createdAt) },
  ];

  return (
    <div>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3" aria-hidden="true" />
        All reservations
      </Link>

      <div className="mt-5 flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Reservation</p>
          <h1 className="mt-1.5 font-mono text-[clamp(1.4rem,3vw,1.9rem)] font-medium">
            {reservation.reference}
          </h1>
          <p className="mt-2 text-[13px] text-muted-foreground">
            {reservation.van.name} ·{" "}
            {formatDateRange(reservation.pickupDate, reservation.returnDate)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={reservation.status} />
          <LockStatePill isLocked={reservation.isLocked} />
          <ReservationActions
            reservationId={reservation.id}
            status={reservation.status}
            isLocked={reservation.isLocked}
          />
        </div>
      </div>

      {reservation.status === "CANCELLED" ? (
        <p className="mt-6 rounded-lg border border-border bg-muted px-4 py-3 text-[12px] text-muted-foreground">
          Cancelled{" "}
          {reservation.cancelledAt
            ? formatTimestamp(reservation.cancelledAt)
            : "by an administrator"}
          . The dates are available again.
        </p>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section aria-labelledby="summary-heading">
            <h2 id="summary-heading" className="eyebrow">
              Booking
            </h2>

            <div className="mt-4 flex items-start gap-4 border-t border-border pt-4">
              <div className="relative h-[64px] w-[92px] shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                <Image
                  src={reservation.van.imageUrl}
                  alt=""
                  fill
                  sizes="92px"
                  className="object-cover grayscale"
                />
              </div>
              <div>
                <p className="text-[15px]">
                  <Link
                    href={`/vans/${reservation.van.slug}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {reservation.van.name}
                  </Link>
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {reservation.van.seats} seats · sleeps{" "}
                  {reservation.van.sleeps} · {reservation.van.transmission}
                </p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-6 sm:grid-cols-3">
              {detailRows.map((row) => (
                <div key={row.label} className="border-b border-border py-2.5">
                  <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                    {row.label}
                  </dt>
                  <dd className="num mt-1 text-[13px]">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-[15px]">Total</span>
              <span className="num text-[18px] font-medium">
                {formatMoney(reservation.totalCents)}
              </span>
            </div>
          </section>

          <section aria-labelledby="customer-heading">
            <h2 id="customer-heading" className="eyebrow">
              Customer
            </h2>
            <dl className="mt-4 grid gap-4 border-t border-border pt-4 text-[13px] sm:grid-cols-3">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Name
                </dt>
                <dd className="mt-1">{reservation.customerName}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Email
                </dt>
                <dd className="mt-1 break-all">
                  <a
                    href={`mailto:${reservation.customerEmail}`}
                    className="underline underline-offset-4"
                  >
                    {reservation.customerEmail}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                  Phone
                </dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${reservation.customerPhone.replace(/\s/g, "")}`}
                    className="underline underline-offset-4"
                  >
                    {reservation.customerPhone}
                  </a>
                </dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="space-y-8">
          <section aria-labelledby="lock-heading" className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 id="lock-heading" className="eyebrow">
                Van lock
              </h2>
              <LockStatePill isLocked={reservation.isLocked} />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-full border border-border"
                >
                  {reservation.isLocked ? (
                    <LockIcon className="size-3.5" />
                  ) : (
                    <UnlockIcon className="size-3.5" />
                  )}
                </span>
                <div>
                  <p className="text-[13px]">
                    {reservation.isLocked ? "Locked" : "Unlocked"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Code {reservation.unlockCode}
                  </p>
                </div>
              </div>

              <h3 className="eyebrow mt-5">Activity</h3>
              {reservation.events.length === 0 ? (
                <p className="mt-2 text-[12px] text-muted-foreground">
                  No lock activity recorded.
                </p>
              ) : (
                <ol className="mt-3 space-y-3 border-l border-border pl-4">
                  {reservation.events.map((event) => (
                    <li key={event.id} className="relative">
                      <span
                        aria-hidden="true"
                        className="absolute top-1.5 -left-[21px] size-1.5 rounded-full bg-foreground"
                      />
                      <p className="text-[12px]">
                        {event.action === "UNLOCK" ? "Unlocked" : "Locked"} by{" "}
                        {event.source === "ADMIN" ? "admin" : "customer"}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                        {formatTimestamp(event.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card px-4 py-4">
            <h2 className="eyebrow">Notes</h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
              Lock controls are simulated. Admin changes are recorded in the
              activity log above with the admin source.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
