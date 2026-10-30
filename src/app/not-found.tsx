import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        <div className="shell py-20 md:py-28">
          <p className="eyebrow">404</p>
          <h1 className="mt-4 max-w-xl text-[clamp(2rem,5vw,3.4rem)]">
            This page took a wrong turn.
          </h1>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            The link may be old, or the booking reference may be wrong. The
            fleet is still where you left it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-10 px-5 text-[13px]">
              <Link href="/#fleet">See the fleet</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 px-5 text-[13px]">
              <Link href="/manage">Find a booking</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
