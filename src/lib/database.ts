import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { promisify } from "node:util";

import { LoyaltyError, type PublicLoyaltyUser } from "./loyalty-store";
import type { CreateOrderInput, CustomerOrder, EmailKind, OrderStatus } from "./order-store";

const scrypt = promisify(scryptCallback);
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
const publicUser = (row: Record<string, unknown>): PublicLoyaltyUser => ({ id: String(row.id), name: String(row.name), email: String(row.email), stamps: Number(row.stamps), rewards: Number(row.rewards), totalOrders: Number(row.total_orders), role: row.role === "admin" ? "admin" : "customer" });
const round = (value: number) => Math.round(value * 100) / 100;
const statusRank = { received: 0, preparing: 1, ready: 2, picked_up: 3 } as const;

export type OutboxEntry = { id: number; orderId: string; kind: EmailKind | "ready"; status: "pending" | "processing" | "sent" | "failed"; attempts: number; error?: string; createdAt: string; updatedAt: string };

export class FourchetteDatabase {
  private db: DatabaseSync;

  constructor(filePath: string, private legacyDir = dirname(filePath)) {
    mkdirSync(dirname(filePath), { recursive: true });
    this.db = new DatabaseSync(filePath);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, stamps INTEGER NOT NULL DEFAULT 0, rewards INTEGER NOT NULL DEFAULT 0, total_orders INTEGER NOT NULL DEFAULT 0, role TEXT NOT NULL DEFAULT 'customer');
      CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id), number TEXT NOT NULL UNIQUE, status TEXT NOT NULL, location_name TEXT NOT NULL, pickup_time TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, payload TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
      CREATE TABLE IF NOT EXISTS outbox (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE, kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, error TEXT, next_attempt_at TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(order_id, kind));`);
    this.migrateLegacy();
  }

  close() { this.db.close(); }

  private migrateLegacy() {
    if (this.db.prepare("SELECT value FROM meta WHERE key='legacy-imported'").get()) return;
    const accounts = join(this.legacyDir, "accounts.json");
    const orders = join(this.legacyDir, "orders.json");
    this.db.exec("BEGIN");
    try {
      if (existsSync(accounts)) {
        const data = JSON.parse(readFileSync(accounts, "utf8"));
        const userStatement = this.db.prepare("INSERT OR IGNORE INTO users(id,name,email,password_hash,password_salt,stamps,rewards,total_orders,role) VALUES(?,?,?,?,?,?,?,?,?)");
        for (const user of data.users ?? []) userStatement.run(user.id, user.name, user.email, user.passwordHash, user.passwordSalt, user.stamps ?? 0, user.rewards ?? 0, user.totalOrders ?? 0, user.role ?? "customer");
        const sessionStatement = this.db.prepare("INSERT OR IGNORE INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)");
        for (const session of data.sessions ?? []) sessionStatement.run(session.tokenHash, session.userId, session.expiresAt);
      }
      if (existsSync(orders)) {
        const statement = this.db.prepare("INSERT OR IGNORE INTO orders(id,user_id,number,status,location_name,pickup_time,created_at,updated_at,payload) VALUES(?,?,?,?,?,?,?,?,?)");
        for (const order of JSON.parse(readFileSync(orders, "utf8")).orders ?? []) statement.run(order.id, order.userId, order.number, order.status, order.locationName, order.pickupTime, order.createdAt, order.updatedAt, JSON.stringify(order));
      }
      this.db.prepare("INSERT INTO meta(key,value) VALUES('legacy-imported',?)").run(new Date().toISOString());
      this.db.exec("COMMIT");
    } catch (error) { this.db.exec("ROLLBACK"); throw error; }
  }

  getPublicUserById(id: string) {
    const row = this.db.prepare("SELECT * FROM users WHERE id=?").get(id) as Record<string, unknown> | undefined;
    return row ? publicUser(row) : null;
  }

  async createAccount(input: { name: string; email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    if (this.db.prepare("SELECT id FROM users WHERE email=?").get(email)) throw new LoyaltyError("EMAIL_EXISTS", "Un compte existe déjà avec cet e-mail.");
    const salt = randomBytes(16).toString("hex");
    const passwordHash = Buffer.from(await scrypt(input.password, salt, 64) as ArrayBuffer).toString("hex");
    const id = randomBytes(16).toString("hex");
    this.db.prepare("INSERT INTO users(id,name,email,password_hash,password_salt,role) VALUES(?,?,?,?,?,'customer')").run(id, input.name.trim(), email, passwordHash, salt);
    const token = this.createSession(id);
    return { user: this.getPublicUserById(id)!, token };
  }

  private createSession(userId: string) {
    const token = randomBytes(32).toString("hex");
    this.db.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").run(hashToken(token), userId, new Date(Date.now() + 30 * 86400000).toISOString());
    return token;
  }

  async login(input: { email: string; password: string }) {
    const row = this.db.prepare("SELECT * FROM users WHERE email=?").get(input.email.trim().toLowerCase()) as Record<string, unknown> | undefined;
    if (!row) throw new LoyaltyError("INVALID_CREDENTIALS", "E-mail ou mot de passe incorrect.");
    const candidate = Buffer.from(await scrypt(input.password, String(row.password_salt), 64) as ArrayBuffer);
    const stored = Buffer.from(String(row.password_hash), "hex");
    if (candidate.length !== stored.length || !timingSafeEqual(candidate, stored)) throw new LoyaltyError("INVALID_CREDENTIALS", "E-mail ou mot de passe incorrect.");
    return { user: publicUser(row), token: this.createSession(String(row.id)) };
  }

  async getUserByToken(token: string) {
    const row = this.db.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?").get(hashToken(token), new Date().toISOString()) as Record<string, unknown> | undefined;
    return row ? publicUser(row) : null;
  }

  async addOrder(token: string, pizzaCount: number) {
    const user = await this.getUserByToken(token);
    if (!user) throw new LoyaltyError("INVALID_SESSION", "La session a expiré.");
    const earned = Math.max(1, Math.floor(pizzaCount));
    const total = user.stamps + earned;
    this.db.prepare("UPDATE users SET stamps=?, rewards=rewards+?, total_orders=total_orders+1 WHERE id=?").run(total % 6, Math.floor(total / 6), user.id);
    return this.getPublicUserById(user.id)!;
  }

  async logout(token: string) { this.db.prepare("DELETE FROM sessions WHERE token_hash=?").run(hashToken(token)); }
  async setRoleByEmail(email: string, role: "customer" | "admin") { return this.db.prepare("UPDATE users SET role=? WHERE email=?").run(role, email.trim().toLowerCase()).changes > 0; }

  private saveOrder(order: CustomerOrder) {
    this.db.prepare("INSERT INTO orders(id,user_id,number,status,location_name,pickup_time,created_at,updated_at,payload) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET status=excluded.status,updated_at=excluded.updated_at,payload=excluded.payload").run(order.id, order.userId, order.number, order.status, order.locationName, order.pickupTime, order.createdAt, order.updatedAt, JSON.stringify(order));
  }

  async create(input: CreateOrderInput) {
    const now = new Date().toISOString();
    const subtotal = round(input.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0) + input.addons.reduce((s, i) => s + i.unitPrice, 0));
    const order: CustomerOrder = { ...input, id: randomBytes(16).toString("hex"), number: `F-${randomBytes(4).toString("hex").slice(0, 6).toUpperCase()}`, subtotal, total: round(subtotal - input.discount), status: "received", createdAt: now, updatedAt: now, emails: { confirmation: { status: "pending" }, invoice: { status: "pending" } } };
    this.saveOrder(order); return order;
  }
  async getById(id: string) { const row = this.db.prepare("SELECT payload FROM orders WHERE id=?").get(id) as { payload: string } | undefined; return row ? JSON.parse(row.payload) as CustomerOrder : null; }
  listOrders() { return (this.db.prepare("SELECT payload FROM orders ORDER BY created_at DESC").all() as { payload: string }[]).map(r => JSON.parse(r.payload) as CustomerOrder); }
  async listAll() { return this.listOrders(); }
  listOrdersForUser(id: string) { return (this.db.prepare("SELECT payload FROM orders WHERE user_id=? ORDER BY created_at DESC").all(id) as { payload: string }[]).map(r => JSON.parse(r.payload) as CustomerOrder); }
  async listForUser(id: string) { return this.listOrdersForUser(id); }

  async updateStatus(id: string, next: OrderStatus) {
    const order = await this.getById(id); if (!order) throw new Error("Commande introuvable.");
    if (order.status === next) return order;
    const valid = next === "cancelled" ? order.status === "received" : order.status !== "cancelled" && statusRank[next as keyof typeof statusRank] === statusRank[order.status as keyof typeof statusRank] + 1;
    if (!valid) throw new Error("Cette transition de commande est invalide.");
    order.status = next; order.updatedAt = new Date().toISOString(); if (next === "picked_up") order.pickedUpAt = order.updatedAt; this.saveOrder(order); return order;
  }
  async recordEmail(id: string, kind: EmailKind, status: "sent" | "failed", detail?: string) { const order = await this.getById(id); if (!order) throw new Error("Commande introuvable."); order.emails[kind] = { status, attemptedAt: new Date().toISOString(), ...(status === "sent" && detail ? { messageId: detail } : {}), ...(status === "failed" && detail ? { error: detail.slice(0, 240) } : {}) }; order.updatedAt = new Date().toISOString(); this.saveOrder(order); return order; }

  slotAvailability(location: string, time: string, capacity = 8) { const used = this.listOrders().filter(o => o.locationName === location && o.pickupTime === time && o.status !== "cancelled").length; return { remaining: Math.max(0, capacity - used), full: used >= capacity }; }
  estimateMinutes() { const active = Number((this.db.prepare("SELECT COUNT(*) count FROM orders WHERE status IN ('received','preparing')").get() as { count: number }).count); return 12 + active * 3; }
  enqueue(orderId: string, kind: EmailKind | "ready") { const now = new Date().toISOString(); this.db.prepare("INSERT INTO outbox(order_id,kind,status,attempts,next_attempt_at,created_at,updated_at) VALUES(?,?,'pending',0,?,?,?) ON CONFLICT(order_id,kind) DO UPDATE SET status='pending',next_attempt_at=excluded.next_attempt_at,updated_at=excluded.updated_at").run(orderId, kind, now, now, now); }
  pendingOutbox(limit = 10) { const rows = this.db.prepare("SELECT id,order_id orderId,kind,status,attempts,error,created_at createdAt,updated_at updatedAt FROM outbox WHERE status IN ('pending','failed') AND next_attempt_at<=? AND attempts<4 ORDER BY id LIMIT ?").all(new Date().toISOString(), limit) as OutboxEntry[]; return rows.map((row) => ({ ...row })); }
  markOutbox(id: number, status: "processing" | "sent" | "failed", error?: string) { const delay = new Date(Date.now() + 60000).toISOString(); this.db.prepare("UPDATE outbox SET status=?,attempts=attempts+1,error=?,next_attempt_at=?,updated_at=? WHERE id=?").run(status, error?.slice(0, 240) ?? null, delay, new Date().toISOString(), id); }
  listOutbox() { const rows = this.db.prepare("SELECT id,order_id orderId,kind,status,attempts,error,created_at createdAt,updated_at updatedAt FROM outbox ORDER BY id DESC LIMIT 100").all() as OutboxEntry[]; return rows.map((row) => ({ ...row })); }
}
