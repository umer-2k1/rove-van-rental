"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { diffDays, parseIsoDate } from "@/lib/dates";
import { quoteFor } from "@/lib/pricing";
import { generateReference, generateUnlockCode } from "@/lib/reference";
import { bookingSchema } from "@/lib/validation";

export type CreateBookingResult =
  | { ok: true; reference: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

class BookingConflictError extends Error {
  constructor() {
    super("Dates already reserved");
  }
}

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** Postgres exclusion constraint or Prisma serialization failure. */
function isConflictError(error: unknown): boolean {
  const text = errorText(error);
  return (
    text.includes("Reservation_no_overlap") ||
    text.includes("23P01") ||
    text.includes("40001") ||
    text.includes("could not serialize") ||
    text.includes("P2034")
  );
}

function isUniqueReferenceError(error: unknown): boolean {
  const text = errorText(error);
  return text.includes("P2002") || text.includes("23505");
}

const CONFLICT_MESSAGE =
  "Those dates are already reserved for this van. Pick another range — availability updates as soon as a booking is confirmed.";

export async function createBooking(input: unknown): Promise<CreateBookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  const van = await prisma.van.findUnique({ where: { slug: data.vanSlug } });
  if (!van) {
    return { ok: false, message: "That van is no longer in the fleet." };
  }

  const days = diffDays(data.pickupDate, data.returnDate);
  const quote = quoteFor(van, days);
  const pickupDate = parseIsoDate(data.pickupDate);
  const returnDate = parseIsoDate(data.returnDate);

  // Friendly pre-check so the common case gets a clean message.
  const existing = await prisma.reservation.findFirst({
    where: {
      vanId: van.id,
      status: "CONFIRMED",
      pickupDate: { lt: returnDate },
      returnDate: { gt: pickupDate },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      ok: false,
      message: CONFLICT_MESSAGE,
      fieldErrors: { returnDate: ["Those dates overlap an existing booking."] },
    };
  }

  try {
    const reservation = await prisma.$transaction(
      async (tx) => {
        // Re-check inside the transaction. The exclusion constraint on
        // Reservation is the final backstop against a double booking.
        const clash = await tx.reservation.findFirst({
          where: {
            vanId: van.id,
            status: "CONFIRMED",
            pickupDate: { lt: returnDate },
            returnDate: { gt: pickupDate },
          },
          select: { id: true },
        });
        if (clash) throw new BookingConflictError();

        return tx.reservation.create({
          data: {
            reference: generateReference(),
            vanId: van.id,
            pickupDate,
            returnDate,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            days: quote.days,
            dailyRateCents: quote.dailyRateCents,
            cleaningFeeCents: quote.cleaningFeeCents,
            totalCents: quote.totalCents,
            unlockCode: generateUnlockCode(),
            isLocked: true,
          },
          select: { reference: true },
        });
      },
      { isolationLevel: "Serializable" },
    );

    revalidatePath("/");
    revalidatePath(`/vans/${van.slug}`);
    revalidatePath("/admin");

    return { ok: true, reference: reservation.reference };
  } catch (error) {
    if (error instanceof BookingConflictError || isConflictError(error)) {
      return {
        ok: false,
        message: CONFLICT_MESSAGE,
        fieldErrors: { returnDate: ["Those dates overlap an existing booking."] },
      };
    }

    // A reference collision is vanishingly rare; one retry is plenty.
    if (isUniqueReferenceError(error)) {
      try {
        const reservation = await prisma.reservation.create({
          data: {
            reference: generateReference(),
            vanId: van.id,
            pickupDate,
            returnDate,
            customerName: data.customerName,
            customerEmail: data.customerEmail,
            customerPhone: data.customerPhone,
            days: quote.days,
            dailyRateCents: quote.dailyRateCents,
            cleaningFeeCents: quote.cleaningFeeCents,
            totalCents: quote.totalCents,
            unlockCode: generateUnlockCode(),
            isLocked: true,
          },
          select: { reference: true },
        });
        return { ok: true, reference: reservation.reference };
      } catch (retryError) {
        if (isConflictError(retryError)) {
          return { ok: false, message: CONFLICT_MESSAGE };
        }
        throw retryError;
      }
    }

    console.error("createBooking failed", error);
    return {
      ok: false,
      message: "Something went wrong saving the reservation. Try again.",
    };
  }
}
