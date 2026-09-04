import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OrderStore } from "./order-store";

let directory: string;
let store: OrderStore;

const input = {
  userId: "user-1",
  customerName: "Lina",
  customerEmail: "lina@example.fr",
  locationName: "Lycée Jean-Moulin",
  pickupLabel: "Portail principal",
  pickupTime: "12:30",
  items: [{ name: "La Major", quantity: 2, unitPrice: 8.5, details: ["Solo", "Tomate"] }],
  addons: [{ name: "Citronnade", unitPrice: 1.8 }],
  discount: 0,
};

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), "fourchette-orders-"));
  store = new OrderStore(join(directory, "orders.json"));
});

afterEach(() => undefined);

describe("OrderStore", () => {
  it("creates a priced order and lists it only for its owner", async () => {
    const order = await store.create(input);

    expect(order.number).toMatch(/^F-[A-Z0-9]{6}$/);
    expect(order.status).toBe("received");
    expect(order.total).toBe(18.8);
    expect(await store.listForUser("user-1")).toEqual([order]);
    expect(await store.listForUser("user-2")).toEqual([]);
  });

  it("moves forward through the pickup workflow and refuses regressions", async () => {
    const order = await store.create(input);

    expect((await store.updateStatus(order.id, "preparing")).status).toBe("preparing");
    expect((await store.updateStatus(order.id, "ready")).status).toBe("ready");
    expect((await store.updateStatus(order.id, "picked_up")).pickedUpAt).toBeTruthy();
    await expect(store.updateStatus(order.id, "ready")).rejects.toThrow("transition");
  });

  it("records confirmation and invoice delivery without storing message content", async () => {
    const order = await store.create(input);
    await store.recordEmail(order.id, "confirmation", "sent", "smtp-message-1");
    await store.recordEmail(order.id, "invoice", "failed", "Mailbox unavailable");

    const stored = JSON.parse(await readFile(join(directory, "orders.json"), "utf8"));
    expect(stored.orders[0].emails.confirmation).toMatchObject({ status: "sent", messageId: "smtp-message-1" });
    expect(stored.orders[0].emails.invoice).toMatchObject({ status: "failed", error: "Mailbox unavailable" });
  });

  it("lists newest orders first for administration", async () => {
    const first = await store.create(input);
    const second = await store.create({ ...input, customerName: "Noé" });

    expect((await store.listAll()).map((order) => order.id)).toEqual([second.id, first.id]);
  });
});
