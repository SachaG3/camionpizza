import nodemailer from "nodemailer";
import PDFDocument from "pdfkit";

import type { CustomerOrder, EmailKind } from "./order-store";

const euro = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
})[character]!);
const lineSummary = (order: CustomerOrder) => [
  ...order.items.map((item) => `${item.quantity} × ${item.name} — ${euro(item.unitPrice * item.quantity)}`),
  ...order.addons.map((item) => `1 × ${item.name} — ${euro(item.unitPrice)}`),
].join("\n");

function emailFrame(title: string, preheader: string, body: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f6f1e7;color:#25231f;font-family:Arial,Helvetica,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f6f1e7"><tr><td style="padding:28px 12px"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#fffdf8" style="width:100%;max-width:600px;border:1px solid #ded7ca;border-radius:20px;overflow:hidden"><tr><td bgcolor="#25231f" style="padding:24px 28px;color:#fffdf8"><div style="font-family:Georgia,serif;font-size:24px;font-weight:bold"><span style="color:#e65a3c">F</span> Fourchette</div></td></tr><tr><td style="padding:30px 28px"><p style="margin:0 0 8px;color:#d94a31;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px">Pizza campus</p><h1 style="margin:0 0 20px;font-family:Georgia,serif;font-size:32px;line-height:1.1">${escapeHtml(title)}</h1>${body}</td></tr><tr><td bgcolor="#486149" style="padding:18px 28px;color:#fff;font-size:12px">Pizza chaude. Pause intacte. · Projet scolaire de démonstration</td></tr></table></td></tr></table></body></html>`;
}

function itemRows(order: CustomerOrder) {
  return [...order.items.map((item) => ({ name: `${item.quantity} × ${item.name}`, price: item.unitPrice * item.quantity })), ...order.addons.map((item) => ({ name: item.name, price: item.unitPrice }))]
    .map((item) => `<tr><td style="padding:9px 0;border-bottom:1px solid #ded7ca">${escapeHtml(item.name)}</td><td align="right" style="padding:9px 0;border-bottom:1px solid #ded7ca;font-weight:bold">${escapeHtml(euro(item.price))}</td></tr>`).join("");
}

export function renderConfirmationEmail(order: CustomerOrder) {
  const subject = `Commande ${order.number} confirmée · Fourchette`;
  const text = `Salut ${order.customerName},\n\nTa commande ${order.number} est confirmée.\n${lineSummary(order)}\n\nTotal : ${euro(order.total)}\nRetrait : ${order.locationName}, ${order.pickupLabel}, à ${order.pickupTime}.\nPaiement au camion.\n\nFourchette`;
  const html = emailFrame(
    `C’est dans le four, ${order.customerName}.`,
    `Commande ${order.number} confirmée pour ${order.pickupTime}.`,
    `<p style="margin:0 0 20px;color:#726e66;line-height:1.6">Présente le numéro <strong style="color:#25231f">${escapeHtml(order.number)}</strong> au camion.</p><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${itemRows(order)}${order.discount ? `<tr><td style="padding:9px 0;color:#486149">Remise formule</td><td align="right" style="padding:9px 0;color:#486149;font-weight:bold">−${escapeHtml(euro(order.discount))}</td></tr>` : ""}<tr><td style="padding:16px 0;font-size:18px;font-weight:bold">Total</td><td align="right" style="padding:16px 0;font-family:Georgia,serif;font-size:24px;font-weight:bold">${escapeHtml(euro(order.total))}</td></tr></table><div style="padding:16px;background:#f6f1e7;border-radius:12px"><strong>${escapeHtml(order.locationName)}</strong><br><span style="color:#726e66">${escapeHtml(order.pickupLabel)} · retrait à ${escapeHtml(order.pickupTime)}</span></div>`,
  );
  return { subject, text, html };
}

export function renderInvoiceEmail(order: CustomerOrder) {
  if (order.status !== "picked_up") throw new Error("La facture est disponible après récupération de la commande.");
  const subject = `Ta facture ${order.number} · Fourchette`;
  const text = `Salut ${order.customerName},\n\nTa commande ${order.number} a bien été récupérée. Ta facture est jointe à cet e-mail.\n\nTotal : ${euro(order.total)}\n\nMerci et à bientôt,\nFourchette`;
  const html = emailFrame(
    "Merci pour ta commande.",
    `La facture de la commande ${order.number} est jointe.`,
    `<p style="margin:0 0 18px;color:#726e66;line-height:1.6">Ta commande <strong style="color:#25231f">${escapeHtml(order.number)}</strong> a bien été récupérée. La facture PDF est jointe à ce message.</p><div style="padding:18px;background:#f6f1e7;border-radius:12px"><span style="color:#726e66">Montant réglé au camion</span><br><strong style="font-family:Georgia,serif;font-size:26px">${escapeHtml(euro(order.total))}</strong></div>`,
  );
  return { subject, text, html };
}

export async function createInvoicePdf(order: CustomerOrder): Promise<Buffer> {
  if (order.status !== "picked_up") throw new Error("La facture est disponible après récupération de la commande.");
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({ size: "A4", margin: 54, info: { Title: `Facture ${order.number}`, Author: "Fourchette" } });
    const chunks: Buffer[] = [];
    document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
    document.fillColor("#d94a31").fontSize(13).text("FOURCHETTE", { characterSpacing: 2 });
    document.moveDown(.4).fillColor("#25231f").fontSize(30).text("Facture", { continued: true }).fontSize(13).text(`  ${order.number}`);
    document.moveDown().fontSize(10).fillColor("#726e66").text(`Émise le ${new Date(order.pickedUpAt ?? order.updatedAt).toLocaleDateString("fr-FR")} · Paiement au camion`);
    document.moveDown(2).fillColor("#25231f").fontSize(11).text(order.customerName).text(order.customerEmail).moveDown(.5).text(`${order.locationName} · ${order.pickupLabel}`).text(`Retrait à ${order.pickupTime}`);
    document.moveDown(2);
    const rows = [...order.items.map((item) => [`${item.quantity} × ${item.name}`, euro(item.unitPrice * item.quantity)]), ...order.addons.map((item) => [item.name, euro(item.unitPrice)])];
    for (const [name, price] of rows) {
      document.fillColor("#25231f").text(name, { continued: true }).text(price, { align: "right" });
      document.moveDown(.7).strokeColor("#ded7ca").moveTo(54, document.y).lineTo(541, document.y).stroke().moveDown(.7);
    }
    if (order.discount) document.fillColor("#486149").text("Remise formule", { continued: true }).text(`−${euro(order.discount)}`, { align: "right" }).moveDown();
    document.moveDown().fillColor("#25231f").fontSize(17).text("Total", { continued: true }).text(euro(order.total), { align: "right" });
    document.moveDown(5).fontSize(9).fillColor("#726e66").text("Fourchette · Camion-pizzeria campus · Projet scolaire de démonstration").text("Aucun paiement en ligne n’a été traité.");
    document.end();
  });
}

function transport() {
  const port = Number(process.env.SMTP_PORT ?? 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: (process.env.SMTP_SSL ?? String(port === 465)) === "true",
    requireTLS: process.env.SMTP_STARTTLS === "true",
    auth: process.env.SMTP_AUTH === "false" ? undefined : { user: process.env.SMTP_USERNAME, pass: process.env.SMTP_PASSWORD },
  });
}

export async function verifyMailTransport() {
  await transport().verify();
}

export async function sendOrderEmail(order: CustomerOrder, kind: EmailKind) {
  const content = kind === "confirmation" ? renderConfirmationEmail(order) : renderInvoiceEmail(order);
  const invoice = kind === "invoice" ? await createInvoicePdf(order) : null;
  const result = await transport().sendMail({
    from: process.env.MAIL_FROM,
    to: order.customerEmail,
    ...content,
    attachments: invoice ? [{ filename: `facture-${order.number}.pdf`, content: invoice, contentType: "application/pdf" }] : [],
  });
  return result.messageId;
}
