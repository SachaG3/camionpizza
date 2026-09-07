import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("mobile guest can place an order without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /La pizza qui arrive/i })).toBeVisible();
  await expect(page.locator(".hero-photo img")).toBeVisible();
  expect(await page.locator("#top").evaluate(el => el.nextElementSibling?.id)).toBe("campus-battle");
  await page.getByLabel("Ajouter La Major en taille Solo").click();
  await page.getByLabel("Ouvrir le panier").click();
  await page.getByPlaceholder("toi@exemple.fr").fill("e2e@example.test");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page.getByRole("heading", { name: /Commande n°F-/ })).toBeVisible();
  await expect(page.locator(".order-ticket strong")).toContainText("#F-");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("home has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations.filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))).toEqual([]);
});

test("manifest and service worker are available", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.webmanifest/);
  expect((await request.get("/sw.js")).status()).toBe(200);
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistration().then(Boolean))).toBe(true);
});
