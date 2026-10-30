import { describe, expect, it } from "vitest";
import { bookingSchema, contactFields, referenceSchema } from "@/lib/validation";
import { addDaysIso, todayIso } from "@/lib/dates";

const today = todayIso();

function validBooking(overrides: Record<string, unknown> = {}) {
  return {
    vanSlug: "classic",
    pickupDate: addDaysIso(today, 5),
    returnDate: addDaysIso(today, 8),
    customerName: "Alex Rivera",
    customerEmail: "alex@example.com",
    customerPhone: "+1 415 555 0134",
    ...overrides,
  };
}

describe("booking validation", () => {
  it("accepts a normal three-night booking", () => {
    expect(bookingSchema.safeParse(validBooking()).success).toBe(true);
  });

  it("rejects a return date that is not after pickup", () => {
    const sameDay = bookingSchema.safeParse(
      validBooking({
        pickupDate: addDaysIso(today, 5),
        returnDate: addDaysIso(today, 5),
      }),
    );
    expect(sameDay.success).toBe(false);

    const backwards = bookingSchema.safeParse(
      validBooking({
        pickupDate: addDaysIso(today, 8),
        returnDate: addDaysIso(today, 5),
      }),
    );
    expect(backwards.success).toBe(false);
  });

  it("rejects past pickups and rentals over 30 nights", () => {
    expect(
      bookingSchema.safeParse(
        validBooking({ pickupDate: addDaysIso(today, -1) }),
      ).success,
    ).toBe(false);

    expect(
      bookingSchema.safeParse(
        validBooking({
          pickupDate: addDaysIso(today, 5),
          returnDate: addDaysIso(today, 40),
        }),
      ).success,
    ).toBe(false);
  });

  it("rejects bookings more than 180 days out", () => {
    expect(
      bookingSchema.safeParse(
        validBooking({
          pickupDate: addDaysIso(today, 200),
          returnDate: addDaysIso(today, 203),
        }),
      ).success,
    ).toBe(false);
  });

  it("normalises the email and rejects malformed contact details", () => {
    const parsed = bookingSchema.parse(
      validBooking({ customerEmail: "  Alex@Example.COM " }),
    );
    expect(parsed.customerEmail).toBe("alex@example.com");

    for (const customerEmail of ["not-an-email", "a@", "@example.com"]) {
      expect(
        contactFields.customerEmail.safeParse(customerEmail).success,
      ).toBe(false);
    }

    for (const customerPhone of ["12", "hello", "+1 415 555 0134 ext"]) {
      expect(
        contactFields.customerPhone.safeParse(customerPhone).success,
      ).toBe(false);
    }
  });

  it("requires a plausible booking reference", () => {
    expect(referenceSchema.safeParse("rv-4k7m2q").success).toBe(true);
    expect(referenceSchema.safeParse("RV-4K7M2").success).toBe(false);
    expect(referenceSchema.safeParse("4K7M2Q").success).toBe(false);
  });
});
