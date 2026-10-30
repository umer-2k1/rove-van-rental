/**
 * Pure availability rules. Shared by the calendar (client), the booking
 * action, and the unit tests. A reservation occupies [start, end).
 */
export type DateRange = { start: string; end: string };

function overlaps(a: DateRange, b: DateRange): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Return every booked range that collides with the requested range. */
export function findConflicts(
  requested: DateRange,
  booked: DateRange[],
): DateRange[] {
  return booked.filter((range) => overlaps(requested, range));
}

export function isRangeFree(
  requested: DateRange,
  booked: DateRange[],
): boolean {
  return findConflicts(requested, booked).length === 0;
}

/** Every night a reservation occupies, used to grey out calendar days. */
export function occupiedNights(booked: DateRange[]): Set<string> {
  const nights = new Set<string>();
  for (const range of booked) {
    const cursor = new Date(`${range.start}T00:00:00.000Z`);
    const end = new Date(`${range.end}T00:00:00.000Z`);
    while (cursor < end) {
      nights.add(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }
  return nights;
}

/** Merge and sort ranges — used to describe availability compactly. */
export function mergeRanges(ranges: DateRange[]): DateRange[] {
  const sorted = [...ranges].sort((a, b) => a.start.localeCompare(b.start));
  const merged: DateRange[] = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range.start <= last.end) {
      last.end = range.end > last.end ? range.end : last.end;
    } else {
      merged.push({ ...range });
    }
  }
  return merged;
}
