import { describe, expect, it } from "vitest";
import {
  findConflicts,
  isRangeFree,
  mergeRanges,
  occupiedNights,
} from "@/lib/availability";

const booked = [
  { start: "2026-11-10", end: "2026-11-13" },
  { start: "2026-11-20", end: "2026-11-22" },
];

describe("availability", () => {
  it("allows a same-day turnover (half-open intervals)", () => {
    expect(
      isRangeFree({ start: "2026-11-13", end: "2026-11-15" }, booked),
    ).toBe(true);
    expect(
      isRangeFree({ start: "2026-11-07", end: "2026-11-10" }, booked),
    ).toBe(true);
  });

  it("blocks any range that overlaps a reserved night", () => {
    expect(
      findConflicts({ start: "2026-11-09", end: "2026-11-11" }, booked),
    ).toHaveLength(1);
    expect(
      findConflicts({ start: "2026-11-12", end: "2026-11-14" }, booked),
    ).toHaveLength(1);
    expect(
      findConflicts({ start: "2026-11-08", end: "2026-11-15" }, booked),
    ).toHaveLength(1);
    expect(
      findConflicts({ start: "2026-11-01", end: "2026-11-30" }, booked),
    ).toHaveLength(2);
  });

  it("does not treat a contiguous booking as a conflict", () => {
    expect(
      findConflicts({ start: "2026-11-13", end: "2026-11-20" }, booked),
    ).toHaveLength(0);
  });

  it("lists the nights a booking occupies, not the return day", () => {
    const nights = [...occupiedNights([booked[0]])].sort();
    expect(nights).toEqual(["2026-11-10", "2026-11-11", "2026-11-12"]);
  });

  it("merges touching and overlapping ranges", () => {
    expect(
      mergeRanges([
        { start: "2026-11-10", end: "2026-11-13" },
        { start: "2026-11-13", end: "2026-11-15" },
        { start: "2026-12-01", end: "2026-12-02" },
      ]),
    ).toEqual([
      { start: "2026-11-10", end: "2026-11-15" },
      { start: "2026-12-01", end: "2026-12-02" },
    ]);
  });
});
