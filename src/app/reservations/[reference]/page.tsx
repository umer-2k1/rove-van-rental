import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
import { LockPanel } from "@/components/lock-panel";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StatusPill } from "@/components/pills";
import { getReservationByReference } from "@/lib/queries";
import { formatDate, formatDateRange, rentalPhase } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import { normalizeReference } from "@/lib/reference";
import { policy } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { reference: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: `Booking ${normalizeReference(reference)}` };
}

export default async function ReservationPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { reference } = await params;
  const { new: isNew } = await searchParams;
  const reservation = await getReservationByReference(
    normalizeReference(reference),
  );

  if (!reservation) notFound();

  const phase = rentalPhase(reservation.pickupDate, reservation.returnDate);
  const justBooked = isNew === "1" && reservation.status === "CONFIRMED";

  const rows = [
    { label: "Pickup", value: formatDate(reservation.pickupDate, "EEE d MMM yyyy") },
    { label: "Return", value: formatDate(reservation.returnDate, "EEE d MMM yyyy") },
    { label: "Duration", value: `${reservation.days} ${reservation.days === 1 ? "night" : "nights"}` },
    { label: "Daily rate", value: `${formatMoney(reservation.dailyRateCents)} × ${reservation.days}` },
    { label: "Cleaning", value: formatMoney(reservation.cleaningFeeCents) },
  ];

  return (
    <>
      <SiteHeader />

      <main id="main">
        <div className="border-b border-border">
          <div className="shell flex flex-col gap-5 py-7 sm:flex-row sm:items-end sm:justify-between sm:py-9">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeftIcon className="size-3" aria-hidden="true" />
                Back to fleet
              </Link>
              <p className="eyebrow mt-5">Booking reference</p>
              <div className="mt-1 flex items-center gap-1">
                <h1 className="font-mono text-[clamp(1.5rem,4vw,2.1rem)] font-medium tracking-[0.02em]">
                  {reservation.reference}
                </h1>
                <CopyButton value={reservation.reference} />
              </div>
              <p className="mt-2 text-[13px] text-muted-foreground">
                {reservation.van.name} ·{" "}
                {formatDateRange(reservation.pickupDate, reservation.returnDate)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <StatusPill status={reservation.status} />
              <span className="text-[11px] text-muted-foreground">
                Booked {new Date(reservation.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="shell grid gap-10 py-8 lg:grid-cols-[1fr_360px] lg:gap-14 lg:py-10">
          <div className="space-y-8">
            {justBooked ? (
              <div className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-background"
                >
                  <CheckIcon className="size-3.5" />
                </span>
                <div>
                  <p className="text-[15px]">Reservation confirmed.</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                    Keep this reference — it is all you need to manage the
                    booking. No payment has been taken.
                  </p>
                </div>
              </div>
            ) : null}

            {reservation.status === "CANCELLED" ? (
              <div className="rounded-lg border border-border bg-muted px-4 py-4">
                <p className="text-[14px]">This reservation was cancelled.</p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  The dates have been released. Book another van whenever you
                  like.
                </p>
              </div>
            ) : null}

            <section aria-labelledby="van-heading">
              <h2 id="van-heading" className="eyebrow">
                The van
              </h2>
              <div className="mt-4 flex items-start gap-4 border-b border-border pb-6">
                <div className="relative h-[76px] w-[104px] shrink-0 overflow-hidden rounded-md border border-border bg-muted">
                  <Image
                    src={reservation.van.imageUrl}
                    alt=""
                    fill
                    sizes="104px"
                    className="object-cover grayscale"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] leading-tight">
                    <Link
                      href={`/vans/${reservation.van.slug}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {reservation.van.name}
                    </Link>
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    Pickup at 18 Foundry Lane, Oakland · 08:00–18:00
                  </p>
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    {policy.mileage}
                  </p>
                </div>
              </div>
            </section>

            <section aria-labelledby="dates-heading">
              <h2 id="dates-heading" className="eyebrow">
                Dates and charges
              </h2>
              <dl className="mt-4 text-[13px]">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between border-b border-border py-2.5"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="num">{row.value}</dd>
                  </div>
                ))}
                <div className="flex items-baseline justify-between py-3.5">
                  <dt className="text-[15px]">Total</dt>
                  <dd className="num text-[16px] font-medium">
                    {formatMoney(reservation.totalCents)}
                  </dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="customer-heading">
              <h2 id="customer-heading" className="eyebrow">
                Driver
              </h2>
              <dl className="mt-4 grid gap-x-8 gap-y-3 border-t border-border pt-4 text-[13px] sm:grid-cols-3">
                <div>
                  <dt className="text-[11px] text-muted-foreground">Name</dt>
                  <dd className="mt-1">{reservation.customerName}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Email</dt>
                  <dd className="mt-1 break-all">{reservation.customerEmail}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">Phone</dt>
                  <dd className="mt-1">{reservation.customerPhone}</dd>
                </div>
              </dl>
            </section>

            <section aria-labelledby="policy-heading">
              <h2 id="policy-heading" className="eyebrow">
                Before you leave
              </h2>
              <ul className="mt-4 space-y-2 border-t border-border pt-4 text-[12px] leading-relaxed text-muted-foreground">
                <li>{policy.cancellation}</li>
                <li>{policy.deposit}</li>
                <li>Bring a valid driving licence and the card used for the deposit.</li>
              </ul>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <LockPanel
              reference={reservation.reference}
              isLocked={reservation.isLocked}
              status={reservation.status}
              pickupDate={reservation.pickupDate}
              returnDate={reservation.returnDate}
              unlockCode={reservation.unlockCode}
              phase={phase}
            />
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
