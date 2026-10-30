import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { BookingForm } from "@/components/booking-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getBookedRanges, getVanBySlug, toVanSummary } from "@/lib/queries";
import { formatMoney } from "@/lib/pricing";
import { policy, site } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const van = await getVanBySlug(slug);
  if (!van) return { title: "Van not found" };

  return {
    title: `${van.name} — ${formatMoney(van.dailyRateCents)}/day`,
    description: van.tagline,
  };
}

export default async function VanPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const record = await getVanBySlug(slug);
  if (!record) notFound();

  const van = toVanSummary(record);
  const bookedRanges = await getBookedRanges(record.id);

  const specs = [
    { label: "Seats", value: String(van.seats) },
    { label: "Sleeps", value: String(van.sleeps) },
    { label: "Gearbox", value: van.transmission },
    { label: "Drive", value: van.drivetrain },
  ];

  return (
    <>
      <SiteHeader />

      <main id="main">
        <div className="border-b border-border">
          <nav aria-label="Breadcrumb" className="shell py-4">
            <ol className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <li>
                <Link href="/" className="transition-colors hover:text-foreground">
                  Home
                </Link>
              </li>
              <ChevronRightIcon className="size-3" aria-hidden="true" />
              <li>
                <Link
                  href="/#fleet"
                  className="transition-colors hover:text-foreground"
                >
                  Fleet
                </Link>
              </li>
              <ChevronRightIcon className="size-3" aria-hidden="true" />
              <li aria-current="page" className="text-foreground">
                {van.name}
              </li>
            </ol>
          </nav>
        </div>

        <div className="shell grid gap-12 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:py-12">
          <div>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-border bg-muted">
              <Image
                src={van.imageUrl}
                alt={van.imageAlt}
                fill
                priority
                sizes="(min-width: 1024px) 55vw, 92vw"
                className="object-cover grayscale"
                style={{ objectPosition: van.imagePosition }}
              />
            </div>

            <div className="mt-8">
              <p className="eyebrow">{van.tagline}</p>
              <h1 className="mt-3 text-[clamp(2rem,4.2vw,3.1rem)]">{van.name}</h1>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {van.description}
              </p>
            </div>

            <dl className="mt-8 grid grid-cols-2 border-t border-l border-border sm:grid-cols-4">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="border-r border-b border-border px-3 py-3"
                >
                  <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-[13px]">{spec.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="eyebrow">In the van</p>
                <ul className="mt-3 space-y-2 text-[13px] text-muted-foreground">
                  {van.features.map((feature) => (
                    <li key={feature} className="flex gap-2">
                      <span aria-hidden="true" className="mt-2 h-px w-3 shrink-0 bg-border" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="eyebrow">Good to know</p>
                <ul className="mt-3 space-y-3 text-[13px] leading-relaxed text-muted-foreground">
                  <li>{policy.mileage}</li>
                  <li>{policy.cancellation}</li>
                  <li>{policy.deposit}</li>
                  <li>
                    Pickup at {site.pickupAddress}. {site.hours}.
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <BookingForm van={van} bookedRanges={bookedRanges} />
            <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
              Shortest rental is one night, longest is {policy.maxDays} days.
              Booking opens {policy.advanceDays} days ahead.
            </p>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
