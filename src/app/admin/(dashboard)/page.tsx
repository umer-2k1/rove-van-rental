import type { Metadata } from "next";
import Link from "next/link";

import { ReservationsTable } from "@/components/admin/reservations-table";
import { getAdminOverview, listReservations, type ReservationFilter } from "@/lib/queries";
import { formatMoney } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reservations",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string }>;

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { status } = await searchParams;
  const filter: ReservationFilter =
    status === "confirmed" || status === "cancelled" ? status : "all";

  const [overview, rows] = await Promise.all([
    getAdminOverview(),
    listReservations(filter),
  ]);

  const stats = [
    {
      label: "Confirmed",
      value: String(overview.confirmedCount),
      note: `${overview.cancelledCount} cancelled`,
    },
    {
      label: "Active now",
      value: String(overview.activeCount),
      note: `${overview.vansOut} of ${overview.fleetSize} vans out`,
    },
    {
      label: "Upcoming",
      value: String(overview.upcomingCount),
      note: "Pickup in the future",
    },
    {
      label: "Booked revenue",
      value: formatMoney(overview.revenueCents),
      note: "Confirmed only",
    },
  ];

  const tabs: { key: ReservationFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: overview.totalCount },
    { key: "confirmed", label: "Confirmed", count: overview.confirmedCount },
    { key: "cancelled", label: "Cancelled", count: overview.cancelledCount },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="mt-2 text-[clamp(1.7rem,3.2vw,2.2rem)]">Reservations</h1>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 border-t border-l border-border lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border-r border-b border-border px-4 py-4"
          >
            <dt className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {stat.label}
            </dt>
            <dd className="num mt-2 text-[22px] leading-none">{stat.value}</dd>
            <p className="mt-1.5 text-[11px] text-muted-foreground">{stat.note}</p>
          </div>
        ))}
      </dl>

      <div className="mt-8">
        <nav aria-label="Filter reservations" className="flex items-center gap-6 border-b border-border">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            const href =
              tab.key === "all" ? "/admin" : `/admin?status=${tab.key}`;
            return (
              <Link
                key={tab.key}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px border-b py-2.5 text-[13px] transition-colors ${
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                <span className="num ml-1.5 text-[11px] text-muted-foreground">
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6">
          <ReservationsTable rows={rows} />
        </div>
      </div>
    </div>
  );
}
