import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { LookupForm } from "@/components/lookup-form";

export const metadata: Metadata = {
  title: "Manage booking",
  description: "Look up a Rove reservation with your booking reference.",
};

export default function ManagePage() {
  return (
    <>
      <SiteHeader />

      <main id="main" className="flex-1">
        <div className="shell flex min-h-[60vh] items-start justify-center py-12 md:py-20">
          <div className="w-full max-w-md">
            <p className="eyebrow">Manage booking</p>
            <h1 className="mt-3 text-[clamp(1.9rem,4vw,2.6rem)]">
              Find your van.
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
              Enter the reference from your confirmation. It is case
              insensitive, and it is the only thing you need.
            </p>

            <div className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6">
              <LookupForm />
            </div>

            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Lost the reference? Write to{" "}
              <a className="underline underline-offset-4" href="mailto:hello@rovevans.example">
                hello@rovevans.example
              </a>{" "}
              with the name and dates on the booking.
            </p>

            <p className="mt-8 text-[13px] text-muted-foreground">
              <Link href="/#fleet" className="underline underline-offset-4 hover:text-foreground">
                Browse the fleet
              </Link>{" "}
              instead.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
