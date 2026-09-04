import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const orderStatuses = ["received", "preparing", "ready", "picked_up", "cancelled"] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export type EmailKind = "confirmation" | "invoice";
export type EmailDelivery = {
  status: "pending" | "sent" | "failed";
  attemptedAt?: string;
  messageId?: string;
  error?: string;
};
export type OrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  details: string[];
};
export type OrderAddonLine = { name: string; unitPrice: number };
export type CustomerOrder = {
  id: string;
  number: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  locationName: string;
  pickupLabel: string;
  pickupTime: string;
  items: OrderItem[];
  addons: OrderAddonLine[];
  discount: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  pickedUpAt?: string;
  emails: Record<EmailKind, EmailDelivery>;
};
export type CreateOrderInput = Omit<CustomerOrder, "id" | "number" | "subtotal" | "total" | "status" | "createdAt" | "updatedAt" | "pickedUpAt" | "emails">;

type StoreData = { orders: CustomerOrder[] };
const round = (value: number) => Math.round(value * 100) / 100;
const statusRank: Record<Exclude<OrderStatus, "cancelled">, number> = {
  received: 0,
  preparing: 1,
  ready: 2,
  picked_up: 3,
};

export class OrderStore {
  private writeQueue = Promise.resolve();

  constructor(private readonly filePath: string) {}

  private async read(): Promise<StoreData> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as StoreData;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return { orders: [] };
      throw error;
    }
  }

  private async write(data: StoreData) {
    await mkdir(dirname(this.filePath), { recursive: true });
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(data, null, 2), { mode: 0o600 });
    await rename(temporary, this.filePath);
  }

  private transact<T>(operation: (data: StoreData) => Promise<T> | T): Promise<T> {
    const run = this.writeQueue.then(async () => {
      const data = await this.read();
      const result = await operation(data);
      await this.write(data);
      return result;
    });
    this.writeQueue = run.then(() => undefined, () => undefined);
    return run;
  }

  async create(input: CreateOrderInput) {
    return this.transact((data) => {
      const now = new Date().toISOString();
      const subtotal = round(
        input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
        + input.addons.reduce((sum, addon) => sum + addon.unitPrice, 0),
      );
      const order: CustomerOrder = {
        ...input,
        id: randomBytes(16).toString("hex"),
        number: `F-${randomBytes(4).toString("hex").slice(0, 6).toUpperCase()}`,
        subtotal,
        total: round(subtotal - input.discount),
        status: "received",
        createdAt: now,
        updatedAt: now,
        emails: {
          confirmation: { status: "pending" },
          invoice: { status: "pending" },
        },
      };
      data.orders.push(order);
      return order;
    });
  }

  async getById(id: string) {
    return (await this.read()).orders.find((order) => order.id === id) ?? null;
  }

  async listForUser(userId: string) {
    return (await this.read()).orders
      .filter((order) => order.userId === userId)
      .toReversed();
  }

  async listAll() {
    return (await this.read()).orders.toReversed();
  }

  async updateStatus(id: string, next: OrderStatus) {
    return this.transact((data) => {
      const order = data.orders.find((candidate) => candidate.id === id);
      if (!order) throw new Error("Commande introuvable.");
      if (order.status === next) return order;
      const valid = next === "cancelled"
        ? order.status !== "picked_up"
        : order.status !== "cancelled"
          && statusRank[next] === statusRank[order.status as Exclude<OrderStatus, "cancelled">] + 1;
      if (!valid) throw new Error("Cette transition de commande est invalide.");
      order.status = next;
      order.updatedAt = new Date().toISOString();
      if (next === "picked_up") order.pickedUpAt = order.updatedAt;
      return order;
    });
  }

  async recordEmail(id: string, kind: EmailKind, status: "sent" | "failed", detail?: string) {
    return this.transact((data) => {
      const order = data.orders.find((candidate) => candidate.id === id);
      if (!order) throw new Error("Commande introuvable.");
      order.emails[kind] = {
        status,
        attemptedAt: new Date().toISOString(),
        ...(status === "sent" && detail ? { messageId: detail } : {}),
        ...(status === "failed" && detail ? { error: detail.slice(0, 240) } : {}),
      };
      order.updatedAt = new Date().toISOString();
      return order;
    });
  }
}
