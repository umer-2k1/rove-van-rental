"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRightIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LockStatePill, StatusPill } from "@/components/pills";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/pricing";
import type { ReservationView } from "@/lib/queries";

function matches(row: ReservationView, query: string) {
  const haystack = [
    row.reference,
    row.customerName,
    row.customerEmail,
    row.customerPhone,
    row.van.name,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function ReservationsTable({ rows }: { rows: ReservationView[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => matches(row, needle));
  }, [rows, query]);

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reference, name, email"
            className="h-9 pl-8 text-[12px]"
            aria-label="Search reservations"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          {filtered.length} of {rows.length} shown
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border px-5 py-12 text-center">
          <p className="text-[14px]">No reservations match.</p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Clear the search or change the filter.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-border text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th scope="col" className="py-2.5 pr-4 font-normal">
                    Reference
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-normal">
                    Van
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-normal">
                    Dates
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-normal">
                    Customer
                  </th>
                  <th scope="col" className="py-2.5 pr-4 text-right font-normal">
                    Total
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-normal">
                    Status
                  </th>
                  <th scope="col" className="py-2.5 pr-4 font-normal">
                    Lock
                  </th>
                  <th scope="col" className="py-2.5 font-normal">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className="group relative border-b border-border transition-colors hover:bg-muted/40"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        href={`/admin/reservations/${row.id}`}
                        className="font-mono text-[12px] after:absolute after:inset-0"
                      >
                        {row.reference}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{row.van.name}</td>
                    <td className="py-3 pr-4">
                      <span className="num">
                        {formatDate(row.pickupDate, "d MMM")} –{" "}
                        {formatDate(row.returnDate, "d MMM")}
                      </span>
                      <span className="ml-2 text-[11px] text-muted-foreground">
                        {row.days}n
                      </span>
                    </td>
                    <td className="max-w-[190px] py-3 pr-4">
                      <span className="block truncate">{row.customerName}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {row.customerEmail}
                      </span>
                    </td>
                    <td className="num py-3 pr-4 text-right">
                      {formatMoney(row.totalCents)}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="py-3 pr-4">
                      <LockStatePill isLocked={row.isLocked} />
                    </td>
                    <td className="py-3 text-right">
                      <ChevronRightIcon
                        className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-border md:hidden">
            {filtered.map((row) => (
              <li key={row.id} className="relative py-4">
                <Link
                  href={`/admin/reservations/${row.id}`}
                  className="font-mono text-[12px] after:absolute after:inset-0"
                >
                  {row.reference}
                </Link>
                <div className="mt-1.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px]">{row.customerName}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {row.van.name} · {formatDate(row.pickupDate, "d MMM")} –{" "}
                      {formatDate(row.returnDate, "d MMM")}
                    </p>
                  </div>
                  <span className="num shrink-0 text-[13px]">
                    {formatMoney(row.totalCents)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <StatusPill status={row.status} />
                  <LockStatePill isLocked={row.isLocked} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
