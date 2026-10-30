"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  formatDate,
  isWithinRentalWindow,
  rentalPhase,
  toIsoDate,
} from "@/lib/dates";
import { normalizeReference } from "@/lib/reference";
import { referenceSchema } from "@/lib/validation";

export type ToggleLockResult =
  | { ok: true; locked: boolean }
  | { ok: false; message: string };

export async function toggleVanLock(
  referenceInput: string,
): Promise<ToggleLockResult> {
  const parsed = referenceSchema.safeParse(referenceInput);
  if (!parsed.success) {
    return { ok: false, message: "That booking reference does not look right." };
  }

  const reference = normalizeReference(parsed.data);
  const reservation = await prisma.reservation.findUnique({
    where: { reference },
    select: {
      id: true,
      status: true,
      isLocked: true,
      pickupDate: true,
      returnDate: true,
    },
  });

  if (!reservation) {
    return { ok: false, message: "Reservation not found." };
  }

  if (reservation.status === "CANCELLED") {
    return { ok: false, message: "This reservation was cancelled." };
  }

  const pickup = toIsoDate(reservation.pickupDate);
  const dropoff = toIsoDate(reservation.returnDate);
  const phase = rentalPhase(pickup, dropoff);

  if (!isWithinRentalWindow(pickup, dropoff)) {
    return {
      ok: false,
      message:
        phase === "upcoming"
          ? `The van unlocks on ${formatDate(pickup)}.`
          : `This rental ended on ${formatDate(dropoff)}.`,
    };
  }

  const nextLocked = !reservation.isLocked;

  const changed = await prisma.$transaction(async (tx) => {
    const update = await tx.reservation.updateMany({
      where: { id: reservation.id, isLocked: reservation.isLocked },
      data: { isLocked: nextLocked },
    });

    if (update.count === 0) return false;

    await tx.lockEvent.create({
      data: {
        reservationId: reservation.id,
        action: nextLocked ? "LOCK" : "UNLOCK",
        source: "CUSTOMER",
      },
    });

    return true;
  });

  if (!changed) {
    return { ok: false, message: "That request was already applied." };
  }

  revalidatePath(`/reservations/${reference}`);
  revalidatePath("/admin");

  return { ok: true, locked: nextLocked };
}
