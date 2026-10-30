-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LockAction" AS ENUM ('LOCK', 'UNLOCK');

-- CreateEnum
CREATE TYPE "LockSource" AS ENUM ('CUSTOMER', 'ADMIN');

-- CreateTable
CREATE TABLE "Van" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dailyRateCents" INTEGER NOT NULL,
    "cleaningFeeCents" INTEGER NOT NULL,
    "seats" INTEGER NOT NULL,
    "sleeps" INTEGER NOT NULL,
    "transmission" TEXT NOT NULL,
    "fuel" TEXT NOT NULL,
    "drivetrain" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL,
    "features" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Van_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "vanId" TEXT NOT NULL,
    "pickupDate" DATE NOT NULL,
    "returnDate" DATE NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "dailyRateCents" INTEGER NOT NULL,
    "cleaningFeeCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "isLocked" BOOLEAN NOT NULL DEFAULT true,
    "unlockCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LockEvent" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "action" "LockAction" NOT NULL,
    "source" "LockSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LockEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Van_slug_key" ON "Van"("slug");

-- CreateIndex
CREATE INDEX "Van_sortOrder_idx" ON "Van"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reference_key" ON "Reservation"("reference");

-- CreateIndex
CREATE INDEX "Reservation_vanId_pickupDate_returnDate_idx" ON "Reservation"("vanId", "pickupDate", "returnDate");

-- CreateIndex
CREATE INDEX "Reservation_customerEmail_idx" ON "Reservation"("customerEmail");

-- CreateIndex
CREATE INDEX "Reservation_status_pickupDate_idx" ON "Reservation"("status", "pickupDate");

-- CreateIndex
CREATE INDEX "LockEvent_reservationId_createdAt_idx" ON "LockEvent"("reservationId", "createdAt");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_vanId_fkey" FOREIGN KEY ("vanId") REFERENCES "Van"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LockEvent" ADD CONSTRAINT "LockEvent_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Guard rails that Prisma cannot express in the schema.
-- A van can never hold two confirmed reservations on the same night.
-- Ranges are half-open, so a return on the 12th allows a pickup on the 12th.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_no_overlap"
  EXCLUDE USING gist (
    "vanId" WITH =,
    daterange("pickupDate", "returnDate", '[)') WITH &&
  )
  WHERE ("status" = 'CONFIRMED');

ALTER TABLE "Reservation"
  ADD CONSTRAINT "Reservation_date_order" CHECK ("returnDate" > "pickupDate");
