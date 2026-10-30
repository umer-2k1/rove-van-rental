import { describe, expect, it } from "vitest";
import { formatMoney, quoteFor } from "@/lib/pricing";

const classic = { dailyRateCents: 14500, cleaningFeeCents: 4500 };

describe("pricing", () => {
  it("charges per night plus a one-off cleaning fee", () => {
    expect(quoteFor(classic, 3)).toEqual({
      days: 3,
      dailyRateCents: 14500,
      cleaningFeeCents: 4500,
      totalCents: 48000,
    });
  });

  it("charges cleaning even for a single night", () => {
    expect(quoteFor(classic, 1).totalCents).toBe(19000);
  });

  it("never returns a negative total", () => {
    expect(quoteFor(classic, -2).totalCents).toBe(4500);
  });

  it("formats whole dollars without cents", () => {
    expect(formatMoney(48000)).toBe("$480");
    expect(formatMoney(14500)).toBe("$145");
    expect(formatMoney(14550)).toBe("$145.50");
  });
});
