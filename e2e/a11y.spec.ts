import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(tags).analyze();

  const summary = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    nodes: violation.nodes.map((node) => node.target.join(" ")),
  }));

  expect(summary, `${label} has accessibility violations`).toEqual([]);
}

test("accessibility: public pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoViolations(page, "home");

  await page.goto("/vans/classic");
  await expect(page.getByRole("button", { name: /Pickup/ })).toBeVisible();
  await expectNoViolations(page, "van detail");

  await page.goto("/manage");
  await expect(page.getByLabel("Booking reference")).toBeVisible();
  await expectNoViolations(page, "manage");

  await page.goto("/reservations/RV-DEMO01");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expectNoViolations(page, "reservation");
});

test("accessibility: admin sign-in and dashboard", async ({ page }) => {
  await page.goto("/admin/login");
  await expectNoViolations(page, "admin login");

  await page.getByLabel("Admin password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Reservations" })).toBeVisible();
  await expectNoViolations(page, "admin dashboard");
});
