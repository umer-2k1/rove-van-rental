import "dotenv/config";
import { chromium, devices } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const base = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const out = "docs/screenshots";
await mkdir(out, { recursive: true });

const browser = await chromium.launch();

async function desktop(path, file, options = {}) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 980 },
    deviceScaleFactor: 2,
  });
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  if (options.before) await options.before(page);
  await page.screenshot({ path: `${out}/${file}.png`, fullPage: options.fullPage ?? true });
  await page.close();
}

await desktop("/", "home");
await desktop("/vans/classic", "van-detail", { fullPage: false });
await desktop("/manage", "manage");

await desktop("/admin/login", "admin-login", { fullPage: false });

const admin = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 2 });
await admin.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
await admin.getByLabel("Admin password").fill(process.env.ADMIN_PASSWORD);
await admin.getByRole("button", { name: "Sign in" }).click();
await admin.waitForURL(/\/admin$/);
await admin.waitForTimeout(600);
await admin.screenshot({ path: `${out}/admin-dashboard.png`, fullPage: true });

const row = admin.getByRole("link", { name: /^RV-/ }).first();
await row.click();
await admin.waitForTimeout(600);
await admin.screenshot({ path: `${out}/admin-reservation.png`, fullPage: true });
await admin.close();

// A confirmation page with the lock panel.
await desktop("/reservations/RV-DEMO01", "reservation", { fullPage: true });

const mobile = await browser.newPage({ ...devices["iPhone 13"], deviceScaleFactor: 2 });
await mobile.goto(`${base}/`, { waitUntil: "networkidle" });
await mobile.screenshot({ path: `${out}/mobile-home.png`, fullPage: true });
await mobile.goto(`${base}/vans/classic`, { waitUntil: "networkidle" });
await mobile.screenshot({ path: `${out}/mobile-van.png`, fullPage: true });
await mobile.close();

await browser.close();
console.log("Screenshots written to", out);
