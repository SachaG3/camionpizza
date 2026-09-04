"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChefHat, Clock3, Mail, PackageCheck, RefreshCw, Search, Send, ShoppingBag } from "lucide-react";

import type { CustomerOrder, EmailKind, OrderStatus } from "@/lib/order-store";

const euro = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
const labels: Record<OrderStatus, string> = { received: "Reçue", preparing: "En préparation", ready: "Prête", picked_up: "Récupérée", cancelled: "Annulée" };
const nextAction: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = {
  received: { status: "preparing", label: "Lancer la préparation" },
  preparing: { status: "ready", label: "Marquer prête" },
  ready: { status: "picked_up", label: "Commande récupérée" },
};

export function AdminOrders({ initialOrders }: { initialOrders: CustomerOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<"active" | "picked_up" | "all">("active");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const shown = useMemo(() => orders.filter((order) => {
    const matchesFilter = filter === "all" || (filter === "active" ? !["picked_up", "cancelled"].includes(order.status) : order.status === "picked_up");
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || `${order.number} ${order.customerName} ${order.customerEmail} ${order.locationName}`.toLowerCase().includes(needle));
  }), [filter, orders, query]);
  const activeCount = orders.filter((order) => !["picked_up", "cancelled"].includes(order.status)).length;

  function replaceOrder(order: CustomerOrder) {
    setOrders((current) => current.map((candidate) => candidate.id === order.id ? order : candidate));
  }

  async function updateStatus(order: CustomerOrder, status: OrderStatus) {
    setPending(order.id);
    setNotice("");
    const response = await fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json();
    if (response.ok) {
      replaceOrder(result.order);
      setNotice(status === "picked_up"
        ? result.order.emails.invoice.status === "sent"
          ? "Commande clôturée et facture envoyée."
          : "Commande clôturée, mais la facture doit être renvoyée."
        : "Statut mis à jour.");
    } else setNotice(result.error ?? "Impossible de modifier la commande.");
    setPending(null);
  }

  async function resend(order: CustomerOrder, kind: EmailKind) {
    setPending(`${order.id}-${kind}`);
    setNotice("");
    const response = await fetch(`/api/admin/orders/${order.id}/email`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind }) });
    const result = await response.json();
    if (result.order) replaceOrder(result.order);
    setNotice(response.ok ? (kind === "invoice" ? "Facture renvoyée." : "Confirmation renvoyée.") : result.error ?? "Échec de l’envoi.");
    setPending(null);
  }

  return <main className="admin-shell">
    <aside className="admin-rail">
      <Link className="brand admin-brand" href="/"><span className="brand-mark">F</span><span>Fourchette</span></Link>
      <nav><a className="active" href="#orders"><ShoppingBag size={17} /> Commandes <span>{activeCount}</span></a></nav>
      <Link className="admin-back" href="/"><ArrowLeft size={16} /> Retour à la boutique</Link>
    </aside>
    <section className="admin-main" id="orders">
      <header className="admin-header">
        <div><p className="section-kicker">Le passe du camion</p><h1>Commandes du jour</h1><span>{activeCount} commande{activeCount > 1 ? "s" : ""} à traiter</span></div>
        <span className="service-live"><i /> Service ouvert</span>
      </header>

      <div className="admin-toolbar">
        <div className="admin-filters">
          <button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>À préparer <span>{activeCount}</span></button>
          <button className={filter === "picked_up" ? "active" : ""} onClick={() => setFilter("picked_up")}>Récupérées</button>
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Toutes</button>
        </div>
        <label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="N°, client, campus…" /></label>
      </div>
      {notice && <div className="admin-notice" role="status"><Check size={15} /> {notice}</div>}

      <div className="admin-orders">
        {shown.map((order) => {
          const action = nextAction[order.status];
          return <article className="admin-order" key={order.id}>
            <div className="admin-order-number"><span>{new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span><strong>{order.number}</strong><i className={`order-status ${order.status}`}>{labels[order.status]}</i></div>
            <div className="admin-order-customer"><strong>{order.customerName}</strong><span>{order.customerEmail}</span><small>{order.locationName} · {order.pickupTime}</small></div>
            <div className="admin-order-items">
              {order.items.map((item) => <p key={`${order.id}-${item.name}`}><strong>{item.quantity}×</strong> {item.name}<span>{item.details.slice(0, 2).join(" · ")}</span></p>)}
              {order.addons.map((item) => <p className="addon" key={`${order.id}-${item.name}`}><strong>+</strong> {item.name}</p>)}
            </div>
            <div className="admin-order-total"><strong>{euro(order.total)}</strong><span>Paiement camion</span></div>
            <div className="admin-order-actions">
              {action && <button className="status-action" disabled={pending === order.id} onClick={() => updateStatus(order, action.status)}>{pending === order.id ? <RefreshCw className="spin" size={15} /> : action.status === "preparing" ? <ChefHat size={15} /> : action.status === "ready" ? <Clock3 size={15} /> : <PackageCheck size={15} />}{action.label}</button>}
              <button className="mail-action" disabled={pending === `${order.id}-confirmation`} title="Renvoyer la confirmation" onClick={() => resend(order, "confirmation")}><Mail size={15} /><span>Confirmation</span><i className={order.emails.confirmation.status} /></button>
              {order.status === "picked_up" && <button className="mail-action" disabled={pending === `${order.id}-invoice`} title="Renvoyer la facture" onClick={() => resend(order, "invoice")}><Send size={15} /><span>Facture</span><i className={order.emails.invoice.status} /></button>}
            </div>
          </article>;
        })}
        {!shown.length && <div className="admin-empty"><PackageCheck size={28} /><h2>Le passe est vide</h2><p>Aucune commande ne correspond à cette vue.</p></div>}
      </div>
    </section>
  </main>;
}
