import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { LoyaltyStore } from "./loyalty-store";

const temporaryDirectories: string[] = [];

async function createStore() {
  const directory = await mkdtemp(join(tmpdir(), "fourchette-loyalty-"));
  temporaryDirectories.push(directory);
  return {
    file: join(directory, "accounts.json"),
    store: new LoyaltyStore(join(directory, "accounts.json")),
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("LoyaltyStore", () => {
  it("creates an account without storing the password or session token in clear text", async () => {
    const { file, store } = await createStore();

    const result = await store.createAccount({
      name: "Lina",
      email: "LINA@example.com",
      password: "pause-pizza-2026",
    });
    const persisted = await readFile(file, "utf8");

    expect(result.user).toMatchObject({
      name: "Lina",
      email: "lina@example.com",
      stamps: 0,
      rewards: 0,
    });
    expect(result.token).toHaveLength(64);
    expect(persisted).not.toContain("pause-pizza-2026");
    expect(persisted).not.toContain(result.token);
  });

  it("rejects a duplicate email regardless of letter case", async () => {
    const { store } = await createStore();
    await store.createAccount({
      name: "Lina",
      email: "lina@example.com",
      password: "pause-pizza-2026",
    });

    await expect(
      store.createAccount({
        name: "Autre Lina",
        email: "LINA@example.com",
        password: "autre-pizza-2026",
      }),
    ).rejects.toMatchObject({ code: "EMAIL_EXISTS" });
  });

  it("logs in with the stored password hash", async () => {
    const { store } = await createStore();
    await store.createAccount({
      name: "Lina",
      email: "lina@example.com",
      password: "pause-pizza-2026",
    });

    const result = await store.login({
      email: "LINA@example.com",
      password: "pause-pizza-2026",
    });

    expect(result.user.email).toBe("lina@example.com");
    expect(result.token).toHaveLength(64);
  });

  it("rejects an incorrect password", async () => {
    const { store } = await createStore();
    await store.createAccount({
      name: "Lina",
      email: "lina@example.com",
      password: "pause-pizza-2026",
    });

    await expect(
      store.login({ email: "lina@example.com", password: "mauvais-mot-de-passe" }),
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" });
  });

  it("awards one reward every six pizzas while keeping the remainder", async () => {
    const { store } = await createStore();
    const account = await store.createAccount({
      name: "Lina",
      email: "lina@example.com",
      password: "pause-pizza-2026",
    });

    const user = await store.addOrder(account.token, 7);

    expect(user).toMatchObject({ stamps: 1, rewards: 1, totalOrders: 1 });
    await expect(store.getUserByToken(account.token)).resolves.toMatchObject({
      stamps: 1,
      rewards: 1,
    });
  });

  it("invalidates the current session on logout", async () => {
    const { store } = await createStore();
    const account = await store.createAccount({
      name: "Lina",
      email: "lina@example.com",
      password: "pause-pizza-2026",
    });

    await store.logout(account.token);

    await expect(store.getUserByToken(account.token)).resolves.toBeNull();
  });
});
