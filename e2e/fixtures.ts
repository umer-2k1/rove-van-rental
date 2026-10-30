import "dotenv/config";
import { Pool } from "pg";

/**
 * Playwright transpiles test files to CommonJS, and the generated Prisma
 * client is ESM-only. Fixtures therefore talk to Postgres directly with pg.
 */
export const TEST_EMAIL_PREFIX = "e2e-";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
});

export async function cleanupTestReservations() {
  await pool.query(`DELETE FROM "Reservation" WHERE "customerEmail" LIKE $1`, [
    `${TEST_EMAIL_PREFIX}%`,
  ]);
}

export async function getVan(slug: string) {
  const { rows } = await pool.query<{
    id: string;
    dailyRateCents: number;
    cleaningFeeCents: number;
  }>(
    `SELECT id, "dailyRateCents", "cleaningFeeCents" FROM "Van" WHERE slug = $1`,
    [slug],
  );
  if (!rows[0]) throw new Error(`Van ${slug} not found`);
  return rows[0];
}

export async function createTestReservation(input: {
  reference: string;
  vanId: string;
  pickupDate: string;
  returnDate: string;
  days: number;
  dailyRateCents: number;
  cleaningFeeCents: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  unlockCode: string;
}) {
  const total = input.days * input.dailyRateCents + input.cleaningFeeCents;

  await pool.query(
    `INSERT INTO "Reservation"
      (id, reference, "vanId", "pickupDate", "returnDate", "customerName",
       "customerEmail", "customerPhone", days, "dailyRateCents",
       "cleaningFeeCents", "totalCents", status, "isLocked", "unlockCode", "createdAt")
     VALUES
      (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
       'CONFIRMED', true, $12, now())`,
    [
      input.reference,
      input.vanId,
      input.pickupDate,
      input.returnDate,
      input.customerName,
      input.customerEmail,
      input.customerPhone,
      input.days,
      input.dailyRateCents,
      input.cleaningFeeCents,
      total,
      input.unlockCode,
    ],
  );
}

export async function closeTestDb() {
  await pool.end();
}
