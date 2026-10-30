import { prisma } from "./db";
import { parseIsoDate, toIsoDate, todayIso } from "./dates";
import type { ReservationStatus } from "@/generated/prisma/enums";
import type { VanSummary } from "./types";

export type VanRecord = Awaited<ReturnType<typeof listVans>>[number];

export function toVanSummary(van: VanRecord): VanSummary {
  return {
    id: van.id,
    slug: van.slug,
    name: van.name,
    tagline: van.tagline,
    description: van.description,
    dailyRateCents: van.dailyRateCents,
    cleaningFeeCents: van.cleaningFeeCents,
    seats: van.seats,
    sleeps: van.sleeps,
    transmission: van.transmission,
    fuel: van.fuel,
    drivetrain: van.drivetrain,
    imageUrl: van.imageUrl,
    imageAlt: van.imageAlt,
    imagePosition: van.imagePosition,
    features: van.features,
  };
}

export type ReservationView = {
  id: string;
  reference: string;
  status: ReservationStatus;
  isLocked: boolean;
  unlockCode: string;
  pickupDate: string;
  returnDate: string;
  days: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dailyRateCents: number;
  cleaningFeeCents: number;
  totalCents: number;
  createdAt: string;
  cancelledAt: string | null;
  van: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    seats: number;
    sleeps: number;
    transmission: string;
  };
  events: {
    id: string;
    action: "LOCK" | "UNLOCK";
    source: "CUSTOMER" | "ADMIN";
    createdAt: string;
  }[];
};

const reservationInclude = {
  van: {
    select: {
      id: true,
      slug: true,
      name: true,
      imageUrl: true,
      seats: true,
      sleeps: true,
      transmission: true,
    },
  },
  events: {
    select: { id: true, action: true, source: true, createdAt: true },
    orderBy: { createdAt: "desc" as const },
  },
};

type ReservationRow = {
  id: string;
  reference: string;
  status: ReservationStatus;
  isLocked: boolean;
  unlockCode: string;
  pickupDate: Date;
  returnDate: Date;
  days: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  dailyRateCents: number;
  cleaningFeeCents: number;
  totalCents: number;
  createdAt: Date;
  cancelledAt: Date | null;
  van: {
    id: string;
    slug: string;
    name: string;
    imageUrl: string;
    seats: number;
    sleeps: number;
    transmission: string;
  };
  events: {
    id: string;
    action: "LOCK" | "UNLOCK";
    source: "CUSTOMER" | "ADMIN";
    createdAt: Date;
  }[];
};

export function toReservationView(row: ReservationRow): ReservationView {
  return {
    ...row,
    pickupDate: toIsoDate(row.pickupDate),
    returnDate: toIsoDate(row.returnDate),
    createdAt: row.createdAt.toISOString(),
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    events: row.events.map((event) => ({
      ...event,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export async function listVans() {
  return prisma.van.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getVanBySlug(slug: string) {
  return prisma.van.findUnique({ where: { slug } });
}

/**
 * Ranges still relevant to a new booking: anything ending today or later.
 * Past reservations can never collide with a future request.
 */
export async function getBookedRanges(vanId: string) {
  const rows = await prisma.reservation.findMany({
    where: {
      vanId,
      status: "CONFIRMED",
      returnDate: { gte: parseIsoDate(todayIso()) },
    },
    select: { pickupDate: true, returnDate: true },
    orderBy: { pickupDate: "asc" },
  });

  return rows.map((row) => ({
    start: toIsoDate(row.pickupDate),
    end: toIsoDate(row.returnDate),
  }));
}

export async function getReservationByReference(reference: string) {
  const row = await prisma.reservation.findUnique({
    where: { reference },
    include: reservationInclude,
  });
  return row ? toReservationView(row) : null;
}

export async function getReservationById(id: string) {
  const row = await prisma.reservation.findUnique({
    where: { id },
    include: reservationInclude,
  });
  return row ? toReservationView(row) : null;
}

export type ReservationFilter = "all" | "confirmed" | "cancelled";

export async function listReservations(
  filter: ReservationFilter = "all",
): Promise<ReservationView[]> {
  const rows = await prisma.reservation.findMany({
    where: filter === "all" ? undefined : { status: filter.toUpperCase() as ReservationStatus },
    include: reservationInclude,
    orderBy: [{ pickupDate: "desc" }, { createdAt: "desc" }],
  });
  return rows.map(toReservationView);
}

export type AdminOverview = {
  totalCount: number;
  confirmedCount: number;
  cancelledCount: number;
  activeCount: number;
  upcomingCount: number;
  revenueCents: number;
  vansOut: number;
  fleetSize: number;
};

export async function getAdminOverview(): Promise<AdminOverview> {
  const today = parseIsoDate(todayIso());

  const [
    totalCount,
    confirmedCount,
    cancelledCount,
    activeRows,
    upcomingCount,
    revenue,
    fleetSize,
  ] = await Promise.all([
    prisma.reservation.count(),
    prisma.reservation.count({ where: { status: "CONFIRMED" } }),
    prisma.reservation.count({ where: { status: "CANCELLED" } }),
    prisma.reservation.findMany({
      where: {
        status: "CONFIRMED",
        pickupDate: { lte: today },
        returnDate: { gte: today },
      },
      select: { vanId: true },
    }),
    prisma.reservation.count({
      where: { status: "CONFIRMED", pickupDate: { gt: today } },
    }),
    prisma.reservation.aggregate({
      where: { status: "CONFIRMED" },
      _sum: { totalCents: true },
    }),
    prisma.van.count(),
  ]);

  return {
    totalCount,
    confirmedCount,
    cancelledCount,
    activeCount: activeRows.length,
    upcomingCount,
    revenueCents: revenue._sum.totalCents ?? 0,
    vansOut: new Set(activeRows.map((row) => row.vanId)).size,
    fleetSize,
  };
}
