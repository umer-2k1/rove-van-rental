import { test, expect, type Page } from "@playwright/test";
import { addDays, format } from "date-fns";
import {
  cleanupTestReservations,
  closeTestDb,
  createTestReservation,
  getVan,
  TEST_EMAIL_PREFIX,
} from "./fixtures";
import { quoteFor } from "../src/lib/pricing";

const iso = (date: Date) => format(date, "yyyy-MM-dd");
const offset = (days: number) => iso(addDays(new Date(), days));

async function pickDate(page: Page, isoDate: string) {
  const target = new Date(`${isoDate}T00:00:00`);
  const weekday = format(target, "EEEE");
  const month = format(target, "MMMM");
  const day = target.getDate();
  const suffix =
    day % 10 === 1 && day !== 11
      ? "st"
      : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
          ? "rd"
          : "th";
  const label = `${weekday}, ${month} ${day}${suffix}, ${target.getFullYear()}`;

  for (let step = 0; step < 14; step += 1) {
    const cell = page.locator(`button[aria-label^="${label}"]`);
    if ((await cell.count()) > 0) {
      await cell.first().click();
      return;
    }
    await page.getByRole("button", { name: "Go to the Next Month" }).click();
    await page.waitForTimeout(150);
  }

  throw new Error(`Could not reach ${isoDate} in the calendar`);
}

async function chooseRange(page: Page, pickup: string, dropoff: string) {
  await page.getByRole("button", { name: "Choose pickup and return dates" }).click();
  await expect(page.locator('[role="grid"]')).toBeVisible();
  await pickDate(page, pickup);
  await page.waitForTimeout(250);
  await pickDate(page, dropoff);
}

let bookedReference = "";
const pickup = offset(50);
const dropoff = offset(53);

test.beforeAll(async () => {
  await cleanupTestReservations();
});

test.afterAll(async () => {
  await cleanupTestReservations();
  await closeTestDb();
});

test("customer books a van, booking survives a refresh, overlap is blocked", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("long way");
  await expect(page.getByRole("link", { name: "Rove Classic" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Rove Grand" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Rove Nomad" })).toBeVisible();

  await page.getByRole("link", { name: "Rove Classic" }).click();
  await expect(page).toHaveURL(/\/vans\/classic/);

  await chooseRange(page, pickup, dropoff);

  // 3 nights x $145 + $45 cleaning = $480
  await expect(page.locator("form")).toContainText("$480");

  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Email").fill(`${TEST_EMAIL_PREFIX}customer@example.com`);
  await page.getByLabel("Phone").fill("+92 300 7654321");

  await page.getByRole("button", { name: "Confirm reservation" }).click();

  await expect(page).toHaveURL(/\/reservations\/RV-[A-Z0-9]{6}/, {
    timeout: 60_000,
  });
  await expect(page.getByText("Reservation confirmed.")).toBeVisible();

  bookedReference = new URL(page.url()).pathname.split("/").pop() ?? "";
  expect(bookedReference).toMatch(/^RV-[A-Z0-9]{6}$/);
  await expect(page.getByText("$480").first()).toBeVisible();

  // Durable: a hard reload still shows the same reservation.
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    bookedReference,
  );
  await expect(page.getByText("E2E Customer")).toBeVisible();

  // The same van cannot be booked across those dates.
  await page.goto("/vans/classic");
  await chooseRange(page, offset(49), offset(54));

  await expect(page.getByText(/Already reserved/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirm reservation" }),
  ).toBeDisabled();
});

test("manage booking finds the reference", async ({ page }) => {
  test.skip(!bookedReference, "Booking test did not produce a reference");

  await page.goto("/manage");
  await page.getByLabel("Booking reference").fill(bookedReference.toLowerCase());
  await page.getByRole("button", { name: "Find my booking" }).click();

  await expect(page).toHaveURL(new RegExp(`/reservations/${bookedReference}`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(bookedReference);
});

test("admin signs in, finds the reservation, and cancels it", async ({ page }) => {
  const van = await getVan("grand");
  const quote = quoteFor(van, 4);
  const reference = "RV-E2E101";

  await createTestReservation({
    reference,
    vanId: van.id,
    pickupDate: offset(100),
    returnDate: offset(104),
    days: quote.days,
    dailyRateCents: quote.dailyRateCents,
    cleaningFeeCents: quote.cleaningFeeCents,
    customerName: "E2E Admin Target",
    customerEmail: `${TEST_EMAIL_PREFIX}admin@example.com`,
    customerPhone: "+92 300 1112223",
    unlockCode: "123456",
  });

  // Unauthenticated /admin is protected.
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);

  // Wrong password shows an error and does not sign in.
  await page.getByLabel("Admin password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("That password is not correct.")).toBeVisible();

  await page.getByLabel("Admin password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Reservations" })).toBeVisible();
  await expect(page.getByText(reference).first()).toBeVisible();

  // Search narrows the table.
  await page.getByLabel("Search reservations").fill("admin@example.com");
  await expect(page.getByText(reference).first()).toBeVisible();
  await expect(page.getByText("RV-DEMO01")).toHaveCount(0);

  await page.getByRole("link", { name: reference }).first().click();
  await expect(page.getByText("E2E Admin Target").first()).toBeVisible();

  await page.getByRole("button", { name: "Cancel reservation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel reservation" })
    .click();

  await expect(page.getByText("Reservation cancelled. Dates released.")).toBeVisible();
  await expect(page.getByText("Cancelled", { exact: true }).first()).toBeVisible();
});

test("lock control works only inside the rental window", async ({ page }) => {
  const van = await getVan("nomad");
  const reference = "RV-E2E201";
  const futureReference = "RV-E2E202";
  const quote = quoteFor(van, 2);
  const futureQuote = quoteFor(van, 3);

  await createTestReservation({
    reference,
    vanId: van.id,
    pickupDate: offset(-1),
    returnDate: offset(1),
    days: quote.days,
    dailyRateCents: quote.dailyRateCents,
    cleaningFeeCents: quote.cleaningFeeCents,
    customerName: "E2E Lock Customer",
    customerEmail: `${TEST_EMAIL_PREFIX}lock@example.com`,
    customerPhone: "+92 300 4445556",
    unlockCode: "654321",
  });

  await createTestReservation({
    reference: futureReference,
    vanId: van.id,
    pickupDate: offset(80),
    returnDate: offset(83),
    days: futureQuote.days,
    dailyRateCents: futureQuote.dailyRateCents,
    cleaningFeeCents: futureQuote.cleaningFeeCents,
    customerName: "E2E Future Customer",
    customerEmail: `${TEST_EMAIL_PREFIX}future@example.com`,
    customerPhone: "+92 300 7778889",
    unlockCode: "112233",
  });

  await page.goto(`/reservations/${reference}`);
  await expect(page.getByText("The van is locked.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Unlock van" })).toBeEnabled();

  await page.getByRole("button", { name: "Unlock van" }).click();
  await expect(page.getByText("The van is unlocked.")).toBeVisible();

  // Persisted across a reload.
  await page.reload();
  await expect(page.getByText("The van is unlocked.")).toBeVisible();
  await page.getByRole("button", { name: "Lock van" }).click();
  await expect(page.getByText("The van is locked.")).toBeVisible();

  // Outside the window the control is disabled.
  await page.goto(`/reservations/${futureReference}`);
  await expect(page.getByRole("button", { name: "Unlock van" })).toBeDisabled();
  await expect(page.getByText(/lock activates on pickup day/)).toBeVisible();
});
