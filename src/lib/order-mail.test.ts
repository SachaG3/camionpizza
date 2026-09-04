import { describe, expect, it } from "vitest";

import type { CustomerOrder } from "./order-store";
import { createInvoicePdf, renderConfirmationEmail, renderInvoiceEmail } from "./order-mail";

const order: CustomerOrder = {
  id: "order-1",
  number: "F-ABC123",
  userId: "user-1",
  customerName: "Lina <script>",
  customerEmail: "lina@example.fr",
  locationName: "Lycée Jean-Moulin",
  pickupLabel: "Portail principal",
  pickupTime: "12:30",
  items: [{ name: "La Major", quantity: 2, unitPrice: 8.5, details: ["Solo", "Tomate"] }],
  addons: [{ name: "Citronnade", unitPrice: 1.8 }],
  discount: 0,
  subtotal: 18.8,
  total: 18.8,
  status: "received",
  createdAt: "2026-09-04T12:00:00.000Z",
  updatedAt: "2026-09-04T12:00:00.000Z",
  emails: { confirmation: { status: "pending" }, invoice: { status: "pending" } },
};

describe("order mail", () => {
  it("renders a multipart confirmation with escaped customer content", () => {
    const message = renderConfirmationEmail(order);

    expect(message.subject).toContain("F-ABC123");
    expect(message.text).toContain("Lina <script>");
    expect(message.html).toContain("Lina &lt;script&gt;");
    expect(message.html).not.toContain("Lina <script>");
    expect(message.html).toContain("18,80");
  });

  it("renders the invoice message only for a picked-up order", () => {
    expect(() => renderInvoiceEmail(order)).toThrow("récupération");
    expect(renderInvoiceEmail({ ...order, status: "picked_up", pickedUpAt: order.updatedAt }).subject)
      .toContain("facture");
  });

  it("generates a real PDF invoice", async () => {
    const pdf = await createInvoicePdf({ ...order, status: "picked_up", pickedUpAt: order.updatedAt });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
