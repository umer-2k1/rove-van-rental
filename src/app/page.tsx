import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VanCard } from "@/components/van-card";
import { Button } from "@/components/ui/button";
import { listVans, toVanSummary } from "@/lib/queries";
import { policy } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Van rental, done plainly",
  description:
    "Three well-kept camper vans for rent by the day in Oakland. Check live availability and book in a minute.",
};

const steps = [
  {
    number: "01",
    title: "Pick your dates",
    body: "The calendar shows what is actually free. A van returning on the 12th can leave again the same day.",
  },
  {
    number: "02",
    title: "Leave three details",
    body: "Name, email, phone. You get a booking reference and a six-digit unlock code straight away.",
  },
  {
    number: "03",
    title: "Unlock and go",
    body: "On pickup day the lock panel on your booking page goes live. Lock it again when you park for the night.",
  },
] as const;

export default async function HomePage() {
  const vans = (await listVans()).map(toVanSummary);

  return (
    <>
      <SiteHeader />

      <main id="main">
        <section className="border-b border-border">
          <div className="shell grid gap-10 py-12 md:grid-cols-12 md:gap-12 md:py-16 lg:py-20">
            <div className="flex flex-col justify-between md:col-span-6">
              <div>
                <div className="flex items-center gap-3">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
                  <p className="eyebrow">Van rental · Oakland, CA</p>
                </div>

                <h1 className="display mt-7 text-[clamp(3rem,7.2vw,5.2rem)]">
                  Take the
                  <br />
                  long way.
                </h1>

                <p className="mt-6 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  Three vans, kept properly. Book by the day, pick up the keys,
                  and keep them until you are back. No app, no upsell, no
                  surprises at the counter.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button asChild className="h-10 px-5 text-[13px]">
                    <Link href="#fleet">
                      See the fleet
                      <ArrowRightIcon className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 px-5 text-[13px]"
                  >
                    <Link href="#how-it-works">How it works</Link>
                  </Button>
                </div>
              </div>

              <dl className="mt-12 grid grid-cols-3 gap-4 border-t border-border pt-5">
                <div>
                  <dt className="eyebrow">Fleet</dt>
                  <dd className="num mt-1.5 text-xl">
                    {String(vans.length).padStart(2, "0")}
                  </dd>
                </div>
                <div>
                  <dt className="eyebrow">Sleeps</dt>
                  <dd className="num mt-1.5 text-xl">2–4</dd>
                </div>
                <div>
                  <dt className="eyebrow">Included</dt>
                  <dd className="num mt-1.5 text-xl">300 mi</dd>
                </div>
              </dl>
            </div>

            <figure className="md:col-span-6">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border bg-muted sm:aspect-[4/3] md:aspect-[4/5]">
                <Image
                  src="/hero.jpg"
                  alt="A camper van driving through fog on a forest road"
                  fill
                  priority
                  sizes="(min-width: 768px) 48vw, 92vw"
                  className="object-cover grayscale"
                  style={{ objectPosition: "50% 55%" }}
                />
              </div>
              <figcaption className="mt-3 flex items-center justify-between gap-4 text-[11px] text-muted-foreground">
                <span>Highway 1, 06:40</span>
                <span className="num">Rove Nomad · week 31</span>
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="fleet" className="scroll-mt-20 border-b border-border">
          <div className="shell py-14 md:py-20">
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="eyebrow">The fleet</p>
                <h2 className="mt-3 text-[clamp(1.75rem,3.4vw,2.6rem)]">
                  Three vans. No lottery.
                </h2>
              </div>
              <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                Every van includes bedding, cookware, a full tank, and a
                walkthrough at pickup.
              </p>
            </div>

            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {vans.map((van) => (
                <VanCard key={van.id} van={van} />
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="scroll-mt-20 border-b border-border">
          <div className="shell py-14 md:py-20">
            <div className="max-w-2xl">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 text-[clamp(1.75rem,3.4vw,2.6rem)]">
                Three steps, one page.
              </h2>
            </div>

            <div className="mt-10 grid border-t border-border md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.number}
                  className={`py-6 md:px-6 md:py-8 ${
                    index > 0
                      ? "border-t border-border md:border-t-0 md:border-l"
                      : "md:pl-0"
                  } ${index === steps.length - 1 ? "md:pr-0" : ""}`}
                >
                  <p className="num text-[12px] text-muted-foreground">
                    {step.number}
                  </p>
                  <h3 className="mt-4 text-[17px] tracking-[-0.02em]">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <div className="shell grid gap-6 py-8 sm:grid-cols-3">
            <div>
              <p className="eyebrow">Length</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {policy.minDays}–{policy.maxDays} days per booking.
              </p>
            </div>
            <div>
              <p className="eyebrow">Cancellation</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {policy.cancellation}
              </p>
            </div>
            <div>
              <p className="eyebrow">Deposit</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {policy.deposit}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-foreground text-background">
          <div className="shell flex flex-col gap-6 py-14 sm:flex-row sm:items-end sm:justify-between md:py-16">
            <div>
              <p className="eyebrow !text-background/55">Ready when you are</p>
              <h2 className="mt-3 max-w-lg text-[clamp(1.75rem,3.4vw,2.6rem)] text-background">
                The van is the plan.
              </h2>
            </div>
            <Button
              asChild
              className="h-10 w-fit bg-background px-5 text-[13px] text-foreground hover:bg-background/90"
            >
              <Link href="#fleet">
                Choose a van
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
