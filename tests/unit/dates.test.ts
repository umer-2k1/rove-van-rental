import { describe, expect, it } from "vitest";
import {
  addDaysIso,
  diffDays,
  formatDateRange,
  isWithinRentalWindow,
  isValidIsoDate,
  rentalPhase,
  toIsoDate,
} from "@/lib/dates";

describe("date helpers", () => {
  it("accepts real ISO calendar dates and rejects nonsense", () => {
    expect(isValidIsoDate("2026-11-10")).toBe(true);
    expect(isValidIsoDate("2026-02-30")).toBe(false);
    expect(isValidIsoDate("10/11/2026")).toBe(false);
    expect(isValidIsoDate("2026-11-10T00:00:00Z")).toBe(false);
  });

  it("adds days without a timezone shift", () => {
    // Would fail in UTC+ timezones if the implementation round-tripped
    // through toISOString() on a local-midnight Date.
    expect(addDaysIso("2026-11-10", 3)).toBe("2026-11-13");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts nights, not inclusive days", () => {
    expect(diffDays("2026-11-10", "2026-11-13")).toBe(3);
    expect(diffDays("2026-11-10", "2026-11-10")).toBe(0);
  });

  it("formats a range compactly", () => {
    expect(formatDateRange("2026-11-10", "2026-11-13")).toBe("10 – 13 Nov 2026");
    expect(formatDateRange("2026-11-28", "2026-12-02")).toBe(
      "28 Nov – 2 Dec 2026",
    );
  });

  it("only enables the lock inside [pickup, return]", () => {
    expect(isWithinRentalWindow("2026-11-10", "2026-11-13", "2026-11-09")).toBe(
      false,
    );
    expect(isWithinRentalWindow("2026-11-10", "2026-11-13", "2026-11-10")).toBe(
      true,
    );
    expect(isWithinRentalWindow("2026-11-10", "2026-11-13", "2026-11-13")).toBe(
      true,
    );
    expect(isWithinRentalWindow("2026-11-10", "2026-11-13", "2026-11-14")).toBe(
      false,
    );
  });

  it("derives the rental phase", () => {
    expect(rentalPhase("2026-11-10", "2026-11-13", "2026-11-01")).toBe("upcoming");
    expect(rentalPhase("2026-11-10", "2026-11-13", "2026-11-11")).toBe("active");
    expect(rentalPhase("2026-11-10", "2026-11-13", "2026-11-20")).toBe("ended");
  });

  it("converts a Prisma date (UTC midnight) back to the calendar date", () => {
    expect(toIsoDate(new Date("2026-11-10T00:00:00.000Z"))).toBe("2026-11-10");
  });
});
