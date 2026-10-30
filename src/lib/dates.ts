/**
 * Date handling for a date-only booking system.
 *
 * A reservation occupies the half-open interval [pickupDate, returnDate):
 * the van leaves on the pickup date and is free again on the return date.
 * Everything is stored as a Postgres `date` and carried around as a
 * `YYYY-MM-DD` string so no timezone can shift a booking by a day.
 */
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Today in UTC, as `YYYY-MM-DD`. The server is the source of truth. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Prisma returns `date` columns as a Date at 00:00 UTC. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Midnight UTC for a calendar date — matches how Postgres stores `date`. */
export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function addDaysIso(iso: string, days: number): string {
  return format(addDays(parseISO(iso), days), "yyyy-MM-dd");
}

/** Number of nights between two calendar dates. */
export function diffDays(startIso: string, endIso: string): number {
  return differenceInCalendarDays(parseISO(endIso), parseISO(startIso));
}

export function isValidIsoDate(iso: string): boolean {
  if (!ISO_DATE_PATTERN.test(iso)) return false;
  const parsed = parseISO(iso);
  // Compare against the local calendar date. Using toISOString() here would
  // shift the date in any timezone east of UTC.
  return !Number.isNaN(parsed.getTime()) && format(parsed, "yyyy-MM-dd") === iso;
}

export function formatDate(iso: string, pattern = "d MMM yyyy"): string {
  return format(parseISO(iso), pattern);
}

/** Deterministic timestamp for server-rendered pages (UTC, en-GB). */
export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(iso));
}

/** Calendar UI values are local-midnight Dates; keep the calendar date. */
export function calendarDateToIso(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatDateRange(startIso: string, endIso: string): string {
  const sameYear = startIso.slice(0, 4) === endIso.slice(0, 4);
  const sameMonth = sameYear && startIso.slice(0, 7) === endIso.slice(0, 7);

  if (sameMonth) {
    return `${format(parseISO(startIso), "d")} – ${format(parseISO(endIso), "d MMM yyyy")}`;
  }
  if (sameYear) {
    return `${format(parseISO(startIso), "d MMM")} – ${format(parseISO(endIso), "d MMM yyyy")}`;
  }
  return `${formatDate(startIso)} – ${formatDate(endIso)}`;
}

/** Lock control is available while today falls inside [pickup, return]. */
export function isWithinRentalWindow(
  pickupIso: string,
  returnIso: string,
  today: string = todayIso(),
): boolean {
  return today >= pickupIso && today <= returnIso;
}

export type RentalPhase = "upcoming" | "active" | "ended";

export function rentalPhase(
  pickupIso: string,
  returnIso: string,
  today: string = todayIso(),
): RentalPhase {
  if (today < pickupIso) return "upcoming";
  if (today > returnIso) return "ended";
  return "active";
}
