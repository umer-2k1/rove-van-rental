"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  checkAdminPassword,
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
} from "@/lib/auth";
import { adminLoginSchema, referenceSchema } from "@/lib/validation";
import { normalizeReference } from "@/lib/reference";

export type LoginState = { error?: string };

export async function loginAdmin(
  _previous: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = adminLoginSchema.safeParse({
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter the admin password." };
  }

  if (!checkAdminPassword(parsed.data.password)) {
    return { error: "That password is not correct." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function logoutAdmin(): Promise<void> {
  await destroyAdminSession();
  redirect("/admin/login");
}

export type LookupState = { error?: string };

export async function lookupBooking(
  _previous: LookupState,
  formData: FormData,
): Promise<LookupState> {
  const parsed = referenceSchema.safeParse(formData.get("reference"));
  if (!parsed.success) {
    return { error: "Enter a reference like RV-4K7M2Q." };
  }

  const reference = normalizeReference(parsed.data);
  const reservation = await prisma.reservation.findUnique({
    where: { reference },
    select: { reference: true },
  });

  if (!reservation) {
    return { error: "No reservation found with that reference." };
  }

  redirect(`/reservations/${reservation.reference}`);
}

export type AdminActionResult = { ok: boolean; message?: string };

export async function cancelReservation(
  reservationId: string,
): Promise<AdminActionResult> {
  await requireAdmin();

  if (typeof reservationId !== "string" || reservationId.length === 0) {
    return { ok: false, message: "Missing reservation." };
  }

  const updated = await prisma.reservation.updateMany({
    where: { id: reservationId, status: "CONFIRMED" },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  if (updated.count === 0) {
    return { ok: false, message: "That reservation is already cancelled." };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true };
}

export async function adminSetLock(
  reservationId: string,
  locked: boolean,
): Promise<AdminActionResult> {
  await requireAdmin();

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true, status: true, isLocked: true },
  });

  if (!reservation) return { ok: false, message: "Reservation not found." };
  if (reservation.status === "CANCELLED") {
    return { ok: false, message: "Cancelled reservations cannot be controlled." };
  }

  const changed = await prisma.$transaction(async (tx) => {
    const update = await tx.reservation.updateMany({
      where: { id: reservation.id, isLocked: reservation.isLocked },
      data: { isLocked: locked },
    });
    if (update.count === 0) return false;
    await tx.lockEvent.create({
      data: {
        reservationId: reservation.id,
        action: locked ? "LOCK" : "UNLOCK",
        source: "ADMIN",
      },
    });
    return true;
  });

  if (!changed) return { ok: false, message: "No change was needed." };

  revalidatePath("/admin");
  revalidatePath(`/admin/reservations/${reservation.id}`);
  return { ok: true };
}

export async function findReservationForAdmin(
  referenceInput: string,
): Promise<{ ok: boolean; id?: string; message?: string }> {
  await requireAdmin();
  const parsed = referenceSchema.safeParse(referenceInput);
  if (!parsed.success) return { ok: false, message: "Invalid reference." };

  const found = await prisma.reservation.findUnique({
    where: { reference: normalizeReference(parsed.data) },
    select: { id: true },
  });

  return found ? { ok: true, id: found.id } : { ok: false, message: "Not found." };
}
