import Link from "next/link";
import { site } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="shell grid gap-10 py-12 md:grid-cols-12 md:py-16">
        <div className="md:col-span-5">
          <p className="text-[19px] font-semibold tracking-[-0.03em]">ROVE</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Van rental, done plainly. Three vans, fair prices, no paperwork
            theatre.
          </p>
        </div>

        <div className="md:col-span-3">
          <p className="eyebrow">Pickup</p>
          <address className="mt-3 space-y-1 text-sm not-italic text-muted-foreground">
            <p>{site.pickupAddress}</p>
            <p>{site.hours}</p>
            <p>{site.phone}</p>
          </address>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow">Rent</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link className="transition-colors hover:text-foreground" href="/#fleet">
                Fleet
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/#how-it-works">
                How it works
              </Link>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/manage">
                Manage booking
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow">Company</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a className="transition-colors hover:text-foreground" href={`mailto:${site.email}`}>
                Contact
              </a>
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/admin/login">
                Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="shell flex flex-col gap-2 py-5 text-[12px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Rove Van Rental. A demonstration project.</p>
          <p>Photography via Pexels. Lock controls are simulated.</p>
        </div>
      </div>
    </footer>
  );
}
