import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { FourchetteDatabase } from "./database";

it("migrates legacy account and order JSON once into SQLite", async () => {
  const dir = await mkdtemp(join(tmpdir(), "fourchette-db-"));
  await writeFile(join(dir, "accounts.json"), JSON.stringify({ users: [{ id: "u1", name: "Lina", email: "lina@example.fr", stamps: 2, rewards: 0, totalOrders: 1, role: "customer", passwordHash: "hash", passwordSalt: "salt" }], sessions: [] }));
  await writeFile(join(dir, "orders.json"), JSON.stringify({ orders: [{ id: "o1", number: "F-ABC123", userId: "u1", customerName: "Lina", customerEmail: "lina@example.fr", locationName: "Campus", pickupLabel: "Parvis", pickupTime: "12:30", items: [], addons: [], discount: 0, subtotal: 8.5, total: 8.5, status: "received", createdAt: "2026-09-04T12:00:00Z", updatedAt: "2026-09-04T12:00:00Z", emails: { confirmation: { status: "sent" }, invoice: { status: "pending" } } }] }));

  const db = new FourchetteDatabase(join(dir, "fourchette.db"), dir);
  expect(db.getPublicUserById("u1")?.email).toBe("lina@example.fr");
  expect(db.listOrdersForUser("u1")[0]?.number).toBe("F-ABC123");
  db.close();

  const reopened = new FourchetteDatabase(join(dir, "fourchette.db"), dir);
  expect(reopened.listOrders()).toHaveLength(1);
  reopened.close();
});

describe("operational rules", () => {
  it("enforces slot capacity and derives prep estimates", () => {
    const dir = join(tmpdir(), `fourchette-db-${crypto.randomUUID()}`);
    const db = new FourchetteDatabase(join(dir, "fourchette.db"), dir);
    expect(db.slotAvailability("Campus", "12:30", 8)).toMatchObject({ remaining: 8, full: false });
    expect(db.estimateMinutes()).toBe(12);
    db.close();
  });

  it("queues each transactional email once and records retries", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fourchette-db-outbox-"));
    const db = new FourchetteDatabase(join(dir, "fourchette.db"), dir);
    const order = await db.create({ userId: null, customerName: "A", customerEmail: "a@example.test", locationName: "Campus", pickupLabel: "Hall", pickupTime: "12:30", items: [{ name: "Pizza", quantity: 1, unitPrice: 9, details: [] }], addons: [], discount: 0 });
    db.enqueue(order.id, "confirmation");
    db.enqueue(order.id, "confirmation");
    expect(db.listOutbox()).toHaveLength(1);
    const entry = db.pendingOutbox()[0];
    db.markOutbox(entry.id, "failed", "SMTP indisponible");
    expect(db.listOutbox()[0]).toMatchObject({ attempts: 1, status: "failed", error: "SMTP indisponible" });
    db.close();
  });

  it("allows cancellation only before preparation", async () => {
    const dir = await mkdtemp(join(tmpdir(), "fourchette-db-cancel-"));
    const db = new FourchetteDatabase(join(dir, "fourchette.db"), dir);
    const input = { userId: null, customerName: "A", customerEmail: "a@example.test", locationName: "Campus", pickupLabel: "Hall", pickupTime: "12:30", items: [{ name: "Pizza", quantity: 1, unitPrice: 9, details: [] }], addons: [], discount: 0 };
    const first = await db.create(input);
    await expect(db.updateStatus(first.id, "cancelled")).resolves.toMatchObject({ status: "cancelled" });
    const second = await db.create({ ...input, pickupTime: "12:40" });
    await db.updateStatus(second.id, "preparing");
    await expect(db.updateStatus(second.id, "cancelled")).rejects.toThrow("invalide");
    db.close();
  });
});
