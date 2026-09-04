import { database } from "./data";
import { sendOrderEmail } from "./order-mail";

let running: Promise<void> | null = null;

export function processMailOutbox() {
  if (running) return running;
  running = (async () => {
    for (const entry of database.pendingOutbox()) {
      database.markOutbox(entry.id, "processing");
      const order = await database.getById(entry.orderId);
      if (!order) { database.markOutbox(entry.id, "failed", "Commande introuvable"); continue; }
      try {
        const messageId = await sendOrderEmail(order, entry.kind);
        database.markOutbox(entry.id, "sent");
        if (entry.kind === "confirmation" || entry.kind === "invoice") await database.recordEmail(order.id, entry.kind, "sent", messageId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Échec SMTP";
        database.markOutbox(entry.id, "failed", message);
        if (entry.kind === "confirmation" || entry.kind === "invoice") await database.recordEmail(order.id, entry.kind, "failed", message);
      }
    }
  })().finally(() => { running = null; });
  return running;
}
