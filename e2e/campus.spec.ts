import { expect, test } from "@playwright/test";

test("campus quiz, vote and collectible badge work together", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /01 · DÉCOUVRIR/ }).click();
  await page.getByRole("button", { name: /Team végétarienne/ }).click();
  await page.getByRole("button", { name: /Très, très crémeuse/ }).click();
  await page.getByRole("button", { name: /Place au coup de cœur/ }).click();
  await expect(page.getByRole("heading", { name: "L’épicurien du campus" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ma carte", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("mon-pizza-match.svg");
  await page.getByRole("button", { name: "La battle", exact: true }).click();
  await page.getByRole("button", { name: "Je défends cette pizza" }).first().click();
  await expect(page.getByRole("button", { name: "Ton vote est compté" })).toBeVisible();
  await page.getByRole("button", { name: "Mon passeport", exact: true }).click();
  await page.getByRole("button", { name: "Débloquer mon badge" }).click();
  await expect(page.locator(".reward-code")).toContainText("PIONNIER-FOURCHETTE");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("button", { name: "Pizza match", exact: true }).click();
  await page.getByRole("button", { name: /C’est ma pizza/ }).click();
  await expect(page.getByRole("heading", { name: "La Boursière", exact: true })).toBeVisible();
});
