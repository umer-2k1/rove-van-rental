import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { addDaysIso, diffDays, parseIsoDate, todayIso } from "../src/lib/dates";
import { quoteFor } from "../src/lib/pricing";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required to seed.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const vans = [
  {
    slug: "classic",
    name: "Rove Classic",
    tagline: "The original weekender.",
    description:
      "Our smallest van and the one most people should book. Easy to park, cheap to run, and it still has a proper bed, a two-burner stove, and somewhere to sit when it rains.",
    dailyRateCents: 14500,
    cleaningFeeCents: 4500,
    seats: 4,
    sleeps: 2,
    transmission: "Automatic",
    fuel: "Petrol",
    drivetrain: "Rear-wheel drive",
    imageUrl: "/vans/classic.jpg",
    imageAlt: "A white Volkswagen camper van parked on a coastal road",
    imagePosition: "50% 60%",
    features: [
      "Pop-top roof",
      "Two-burner stove",
      "12V fridge",
      "Double bed (1.4 m)",
      "Bluetooth audio",
      "Bike rack",
    ],
    sortOrder: 1,
  },
  {
    slug: "grand",
    name: "Rove Grand",
    tagline: "Room for the whole crew.",
    description:
      "A long-wheelbase conversion with a fixed roof you can stand up in. Two beds, a proper kitchen, and enough storage that four people can live out of it for a week without repacking.",
    dailyRateCents: 19500,
    cleaningFeeCents: 6000,
    seats: 5,
    sleeps: 4,
    transmission: "Automatic",
    fuel: "Diesel",
    drivetrain: "Front-wheel drive",
    imageUrl: "/vans/grand.jpg",
    imageAlt: "A white long-wheelbase camper van parked in a green forest",
    imagePosition: "50% 62%",
    features: [
      "Fixed high roof",
      "Sleeps four",
      "Diesel heater",
      "Cold-water sink",
      "Swivel front seats",
      "Awning",
    ],
    sortOrder: 2,
  },
  {
    slug: "nomad",
    name: "Rove Nomad",
    tagline: "Off-grid, four-season.",
    description:
      "The one that goes where the road stops. Raised, four-wheel drive, and equipped to spend a week off-grid in cold weather without thinking about power or water.",
    dailyRateCents: 22000,
    cleaningFeeCents: 7500,
    seats: 4,
    sleeps: 2,
    transmission: "Manual",
    fuel: "Diesel",
    drivetrain: "4×4",
    imageUrl: "/vans/nomad.jpg",
    imageAlt: "A brown four-wheel-drive camper van on a forest track",
    imagePosition: "50% 55%",
    features: [
      "Raised suspension",
      "All-terrain tyres",
      "Diesel heater",
      "Solar + 200 Ah lithium",
      "Roof rack",
      "Recovery gear",
    ],
    sortOrder: 3,
  },
];

/**
 * Two demo reservations so the admin dashboard and the availability
 * calendar have something real to show on a fresh install.
 */
const demoReservations = [
  {
    reference: "RV-DEMO01",
    vanSlug: "grand",
    pickupOffset: 6,
    days: 3,
    customerName: "Mara Ellison",
    customerEmail: "mara@example.com",
    customerPhone: "+1 415 555 0117",
    isLocked: true,
  },
  {
    reference: "RV-DEMO02",
    vanSlug: "nomad",
    pickupOffset: 12,
    days: 5,
    customerName: "Tomas Reed",
    customerEmail: "tomas@example.com",
    customerPhone: "+1 415 555 0192",
    isLocked: false,
  },
];

async function main() {
  for (const van of vans) {
    await prisma.van.upsert({
      where: { slug: van.slug },
      update: van,
      create: van,
    });
  }

  const today = todayIso();

  for (const demo of demoReservations) {
    const van = await prisma.van.findUniqueOrThrow({
      where: { slug: demo.vanSlug },
    });
    const pickupDate = addDaysIso(today, demo.pickupOffset);
    const returnDate = addDaysIso(pickupDate, demo.days);
    const quote = quoteFor(van, diffDays(pickupDate, returnDate));

    await prisma.reservation.upsert({
      where: { reference: demo.reference },
      update: {},
      create: {
        reference: demo.reference,
        vanId: van.id,
        pickupDate: parseIsoDate(pickupDate),
        returnDate: parseIsoDate(returnDate),
        customerName: demo.customerName,
        customerEmail: demo.customerEmail,
        customerPhone: demo.customerPhone,
        days: quote.days,
        dailyRateCents: quote.dailyRateCents,
        cleaningFeeCents: quote.cleaningFeeCents,
        totalCents: quote.totalCents,
        isLocked: demo.isLocked,
        unlockCode: "482913",
      },
    });
  }

  const counts = await prisma.van.count();
  console.log(`Seeded ${counts} vans and ${demoReservations.length} demo reservations.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
