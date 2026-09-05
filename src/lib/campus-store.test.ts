import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { CampusStore } from "./campus-store";

let directory: string;
let store: CampusStore;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "fourchette-campus-test-"));
  store = new CampusStore(join(directory, "campus.db"));
});
afterEach(() => { store?.dispose(); rmSync(directory, { recursive: true, force: true }); });

describe("campus store", () => {
  it("persists publication settings and reopens without losing votes", () => {
    store.vote("one", "burrata");
    store.closeBattle("admin");
    store.reopenBattle();
    expect(store.getState("one").battle).toMatchObject({ closed: false, counts: { burrata: 1 } });
    store.setSettings({ quiz: false, battle: false, club: true });
    expect(() => store.vote("two", "nduja")).toThrow("désactiv");
    expect(() => store.completeQuiz("two")).toThrow("désactiv");
    expect(store.adminSummary().votes).toBe(1);
    expect(store.getSettings().quiz).toBe(false);
  });
  it("closes on the majority, never overrides it, and blocks further votes", () => {
    store.vote("user:one", "burrata");
    expect(store.closeBattle("admin:one", "nduja").battle.winner).toBe("burrata");
    expect(() => store.vote("visitor:late", "nduja")).toThrow("clos");
    store.dispose();
    store = new CampusStore(join(directory, "campus.db"));
    expect(store.closeBattle("admin:one", "nduja").battle).toMatchObject({ closed: true, winner: "burrata", counts: { burrata: 1, nduja: 0 } });
  });
  it("keeps tied battles open until an explicit tied winner is chosen", () => {
    expect(() => store.closeBattle("admin:one")).toThrow("égalité");
    expect(store.getState("admin:one").battle.closed).toBe(false);
    store.vote("user:one", "burrata");
    store.vote("user:two", "nduja");
    expect(() => store.closeBattle("admin:one")).toThrow("égalité");
    expect(store.closeBattle("admin:one", "nduja").battle.winner).toBe("nduja");
  });
  it("requires quiz plus vote and persists one collectible badge per identity", () => {
    expect(() => store.claim("user:one")).toThrow("quiz");
    store.completeQuiz("user:one");
    store.completeQuiz("user:one");
    expect(() => store.claim("user:one")).toThrow("vote");
    store.vote("user:one", "burrata");
    const code = store.claim("user:one").club.rewardCode;
    expect(code).toMatch(/^PIONNIER-FOURCHETTE-/);
    store.dispose();
    store = new CampusStore(join(directory, "campus.db"));
    expect(store.claim("user:one").club).toEqual({ quiz: true, vote: true, rewardCode: code });
    store.vote("visitor:two", "nduja");
    expect(() => store.claim("visitor:two")).toThrow("quiz");
    store.completeQuiz("visitor:two");
    expect(store.claim("visitor:two").club.rewardCode).not.toBe(code);
  });
  it("keeps the first vote per identity across connections and reopening", () => {
    store.vote("user:one", "burrata");
    const other = new CampusStore(join(directory, "campus.db"));
    try {
      other.vote("user:one", "nduja");
      other.vote("visitor:two", "nduja");
    } finally { other.dispose(); }
    store.dispose();
    store = new CampusStore(join(directory, "campus.db"));
    expect(store.getState("user:one").battle).toMatchObject({ counts: { burrata: 1, nduja: 1 }, choice: "burrata" });
  });
  it("starts with honest zero counts and plain serializable state", () => {
    const state = store.getState("visitor:one");
    expect(state).toEqual({ battle: { counts: { burrata: 0, nduja: 0 }, choice: null, closed: false, winner: null }, club: { quiz: false, vote: false, rewardCode: null } });
    expect(Object.getPrototypeOf(state.battle.counts)).toBe(Object.prototype);
    expect(JSON.parse(JSON.stringify(state))).toEqual(state);
  });
});
