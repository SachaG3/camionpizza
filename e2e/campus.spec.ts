import { DatabaseSync } from "node:sqlite";
import { expect, test } from "@playwright/test";

test("integrated quiz, inline battle and account club work together", async ({ page }) => {
  await page.goto("/");
  const response = await page.request.post("/api/auth/register", { data: { name: "Campus Test", email: `campus-${Date.now()}@example.test`, password: "Campus-Test-2026!" } });
  expect(response.ok()).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: /Tu hésites/ }).click();
  await page.getByRole("button", { name: /Team végétarienne/ }).click();
  await page.getByRole("button", { name: /Très, très crémeuse/ }).click();
  await page.getByRole("button", { name: /Place au coup de cœur/ }).click();
  await expect(page.getByRole("heading", { name: "L’épicurien du campus" })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Ma carte", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("mon-pizza-match.svg");
  await page.getByRole("button", { name: /C’est ma pizza/ }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "La Boursière", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Je défends cette pizza" }).first().click();
  await expect(page.getByRole("button", { name: "Ton vote est compté" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Ouvrir mon compte" }).click();
  await page.getByRole("button", { name: "Débloquer mon badge" }).click();
  await expect(page.locator(".reward-code")).toContainText("PIONNIER-FOURCHETTE");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("campus administration is denied to anonymous visitors", async ({ request }) => {
  expect((await request.get("/api/admin/campus")).status()).toBe(403);
  expect((await request.post("/api/admin/campus", { data: { action: "reopen" } })).status()).toBe(403);
});

test("admin publishes settings and closes then reopens the real campaign", async ({ page }) => {
  const email = `admin-campus-${Date.now()}@example.test`;
  const r = await page.request.post("/api/auth/register", { data: { name: "Admin Campus", email, password: "Campus-Test-2026!" } });
  expect(r.ok()).toBe(true);
  const db = new DatabaseSync("/tmp/fourchette-e2e/fourchette.db");
  db.prepare("UPDATE users SET role='admin' WHERE email=?").run(email); db.close();
  await page.request.post("/api/campus", { data: { action: "vote", choice: "burrata" } });
  await page.goto("/admin/campus");
  await expect(page.getByRole("heading", { name: "La vie du campus" })).toBeVisible();
  await page.getByRole("switch").first().click();
  await expect.poll(async () => (await (await page.request.get("/api/campus")).json()).settings.quiz).toBe(false);
  await page.getByRole("switch").first().click();
  await expect.poll(async () => (await (await page.request.get("/api/campus")).json()).settings.quiz).toBe(true);
  await page.getByRole("button", { name: "Clôturer et publier la gagnante" }).click();
  await page.getByRole("button", { name: "Confirmer", exact: true }).click();
  await expect(page.getByRole("button", { name: "Rouvrir les votes" })).toBeVisible();
  expect((await (await page.request.get("/api/campus")).json()).battle.closed).toBe(true);
  await page.getByRole("button", { name: "Rouvrir les votes" }).click();
  await page.getByRole("button", { name: "Confirmer", exact: true }).click();
  await expect.poll(async () => (await (await page.request.get("/api/campus")).json()).battle.closed).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
