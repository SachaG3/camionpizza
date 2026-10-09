import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("about page tells the story and links a stop to the menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#a-propos")).toHaveCount(0);
  await page.locator(".topbar").getByRole("link", { name: "À propos" }).click();
  await expect(page).toHaveURL(/\/a-propos$/);
  await expect(page.getByRole("heading", { level: 1, name: /Une pizzeria qui a pris/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "IUT de Mulhouse" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "La Fonderie" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);

  await page.locator(".about-route-grid article").filter({ hasText: "La Fonderie" }).getByRole("link").click();
  await expect(page.locator(".location-pill strong")).toHaveText("La Fonderie");
});
