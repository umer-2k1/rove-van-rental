import Image from "next/image";
import Link from "next/link";
import { formatMoney } from "@/lib/pricing";
import type { VanSummary } from "@/lib/types";

export function VanCard({ van }: { van: VanSummary }) {
  return (
    <article className="group flex flex-col">
      <Link
        href={`/vans/${van.slug}`}
        className="block overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-2 focus-visible:outline-offset-4"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={van.imageUrl}
            alt={van.imageAlt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
            className="object-cover grayscale transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            style={{ objectPosition: van.imagePosition }}
          />
        </div>
      </Link>

      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h3 className="text-[18px] font-medium tracking-[-0.02em]">
          <Link
            href={`/vans/${van.slug}`}
            className="transition-colors hover:text-muted-foreground"
          >
            {van.name}
          </Link>
        </h3>
        <p className="num shrink-0 text-sm">
          {formatMoney(van.dailyRateCents)}
          <span className="text-muted-foreground"> / day</span>
        </p>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">{van.tagline}</p>

      <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border pt-3 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Seats</dt>
          <dd className="num">{van.seats} seats</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Sleeps</dt>
          <dd className="num">sleeps {van.sleeps}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Transmission</dt>
          <dd>{van.transmission}</dd>
        </div>
      </dl>
    </article>
  );
}
