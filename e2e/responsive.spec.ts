import { test, expect } from "@playwright/test";

test("mobile: navigation, fleet, and no horizontal overflow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("long way");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);

  // The desktop nav is hidden; the sheet holds the links.
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("link", { name: "Manage booking" })).toBeVisible();
  await page.getByRole("link", { name: "Manage booking" }).click();

  await expect(page).toHaveURL(/\/manage/);
  await expect(page.getByLabel("Booking reference")).toBeVisible();

  await page.goto("/vans/classic");
  const vanOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(vanOverflow).toBeLessThanOrEqual(1);
  await expect(
    page.getByRole("button", { name: /^Dates/ }),
  ).toBeVisible();
});
