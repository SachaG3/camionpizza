"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bell, Check, ChefHat, Clock3, Mail, PackageCheck, Printer, RefreshCw, Search, Send, ShoppingBag, Volume2 } from "lucide-react";

import type { OutboxEntry } from "@/lib/database";
import type { CustomerOrder, EmailKind, OrderStatus } from "@/lib/order-store";

const euro = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
const labels: Record<OrderStatus, string> = { received: "Reçue", preparing: "En préparation", ready: "Prête", picked_up: "Récupérée", cancelled: "Annulée" };
const nextAction: Partial<Record<OrderStatus, { status: OrderStatus; label: string }>> = { received: { status: "preparing", label: "Lancer" }, preparing: { status: "ready", label: "Prête" }, ready: { status: "picked_up", label: "Récupérée" } };
type Filter = "received" | "preparing" | "ready" | "picked_up" | "all";
const elapsed = (date: string, now: number) => `${Math.max(0, Math.floor((now - new Date(date).getTime()) / 60000))} min`;

export function AdminOrders({ initialOrders, initialOutbox }: { initialOrders: CustomerOrder[]; initialOutbox: OutboxEntry[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [outbox, setOutbox] = useState(initialOutbox);
  const [filter, setFilter] = useState<Filter>("received");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [sound, setSound] = useState(false);
  const [now, setNow] = useState(0);
  const previousIds = useRef(new Set(initialOrders.map((order) => order.id)));

  useEffect(() => {
    const timer = window.setTimeout(() => setFilter((window.localStorage.getItem("fourchette-admin-filter") as Filter) || "received"), 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { window.localStorage.setItem("fourchette-admin-filter", filter); }, [filter]);
  useEffect(() => {
    let active = true;
    async function refresh() {
      setNow(Date.now());
      await fetch("/api/admin/outbox/process", { method: "POST" }).catch(() => undefined);
      const result = await fetch("/api/admin/orders", { cache: "no-store" }).then((response) => response.json()).catch(() => null);
      if (!active || !result?.orders) return;
      const incoming = result.orders.filter((order: CustomerOrder) => !previousIds.current.has(order.id));
      if (sound && incoming.length) {
        const audio = new AudioContext(); const oscillator = audio.createOscillator(); const gain = audio.createGain();
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.frequency.value = 740; gain.gain.value = .07; oscillator.start(); oscillator.stop(audio.currentTime + .16);
      }
      previousIds.current = new Set(result.orders.map((order: CustomerOrder) => order.id));
      setOrders(result.orders); setOutbox(result.outbox ?? []);
    }
    const interval = window.setInterval(refresh, 10000);
    return () => { active = false; window.clearInterval(interval); };
  }, [sound]);

  const shown = useMemo(() => orders.filter((order) => {
    const matches = filter === "all" || order.status === filter;
    const needle = query.trim().toLowerCase();
    return matches && (!needle || `${order.number} ${order.customerName} ${order.customerEmail} ${order.locationName}`.toLowerCase().includes(needle));
  }), [filter, orders, query]);
  const active = orders.filter((order) => !["picked_up", "cancelled"].includes(order.status));
  const revenue = orders.filter((order) => order.status === "picked_up").reduce((sum, order) => sum + order.total, 0);
  const pizzaCount = orders.reduce((sum, order) => sum + order.items.reduce((count, item) => count + item.quantity, 0), 0);
  const popular = Object.entries(orders.flatMap((order) => order.items).reduce<Record<string, number>>((counts, item) => ({ ...counts, [item.name]: (counts[item.name] ?? 0) + item.quantity }), {})).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  function replaceOrder(order: CustomerOrder) { setOrders((current) => current.map((candidate) => candidate.id === order.id ? order : candidate)); }
  async function updateStatus(order: CustomerOrder, status: OrderStatus) {
    setPending(order.id); setNotice("");
    const response = await fetch(`/api/admin/orders/${order.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json();
    if (response.ok) { replaceOrder(result.order); setNotice(status === "ready" ? "Commande prête, notification programmée." : status === "picked_up" ? "Commande clôturée, facture programmée." : "Statut mis à jour."); }
    else setNotice(result.error ?? "Impossible de modifier la commande.");
    setPending(null);
  }
  async function resend(order: CustomerOrder, kind: EmailKind) {
    setPending(`${order.id}-${kind}`); setNotice("");
    const response = await fetch(`/api/admin/orders/${order.id}/email`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind }) });
    const result = await response.json(); if (result.order) replaceOrder(result.order);
    setNotice(response.ok ? "E-mail ajouté à la file d’envoi." : result.error ?? "Échec de l’envoi."); setPending(null);
  }

  return <main className="admin-shell">
    <aside className="admin-rail"><Link className="brand admin-brand" href="/"><span className="brand-mark">F</span><span>Fourchette</span></Link><nav><a className="active" href="#orders"><ShoppingBag size={17} /> Commandes <span>{active.length}</span></a><Link href="/admin/campus">Campus & marketing</Link></nav><Link className="admin-back" href="/"><ArrowLeft size={16} /> Retour à la boutique</Link></aside>
    <section className="admin-main" id="orders">
      <header className="admin-header"><div><p className="section-kicker">Le passe du camion</p><h1>Commandes du jour</h1><span>Mise à jour automatique toutes les 10 secondes</span></div><div className="admin-live-actions"><button className={sound ? "enabled" : ""} onClick={() => setSound((value) => !value)}><Volume2 size={15} /> Son {sound ? "activé" : "coupé"}</button><span className="service-live"><i /> Service ouvert</span></div></header>
      <div className="admin-stats"><div><span>À traiter</span><strong>{active.length}</strong></div><div><span>Pizzas</span><strong>{pizzaCount}</strong></div><div><span>Recette favorite</span><strong>{popular}</strong></div><div><span>CA encaissé</span><strong>{euro(revenue)}</strong></div></div>
      <div className="admin-toolbar"><div className="admin-filters">{(["received", "preparing", "ready", "picked_up", "all"] as Filter[]).map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "Toutes" : labels[value]} <span>{value === "all" ? orders.length : orders.filter((order) => order.status === value).length}</span></button>)}</div><label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="N°, client, campus…" /></label></div>
      {notice && <div className="admin-notice" role="status"><Check size={15} /> {notice}</div>}
      <div className="admin-orders">{shown.map((order) => { const action = nextAction[order.status]; const late = !["picked_up", "cancelled"].includes(order.status) && now > 0 && (now - new Date(order.createdAt).getTime()) > 20 * 60000; return <article className={`admin-order ${late ? "late" : ""}`} key={order.id}>
        <div className="admin-order-number"><span>{new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {now ? elapsed(order.createdAt, now) : "à l’instant"}</span><strong>{order.number}</strong><i className={`order-status ${order.status}`}>{labels[order.status]}</i></div>
        <div className="admin-order-customer"><strong>{order.customerName}</strong><span>{order.customerEmail}</span><small>{order.locationName} · {order.pickupTime}</small></div>
        <div className="admin-order-items">{order.items.map((item) => <p key={`${order.id}-${item.name}`}><strong>{item.quantity}×</strong> {item.name}<span>{item.details.slice(0, 2).join(" · ")}</span></p>)}{order.addons.map((item) => <p className="addon" key={`${order.id}-${item.name}`}><strong>+</strong> {item.name}</p>)}{order.instructions && <p className="kitchen-note">“{order.instructions}”</p>}</div>
        <div className="admin-order-total"><strong>{euro(order.total)}</strong><span>Paiement camion</span></div>
        <div className="admin-order-actions">{action && <button className="status-action" disabled={pending === order.id} onClick={() => updateStatus(order, action.status)}>{pending === order.id ? <RefreshCw className="spin" size={15} /> : action.status === "preparing" ? <ChefHat size={15} /> : action.status === "ready" ? <Clock3 size={15} /> : <PackageCheck size={15} />}{action.label}</button>}<button className="print-action" onClick={() => window.print()}><Printer size={15} /><span>Ticket</span></button><button className="mail-action" disabled={pending === `${order.id}-confirmation`} onClick={() => resend(order, "confirmation")}><Mail size={15} /><span>Confirmation</span><i className={order.emails.confirmation.status} /></button>{order.status === "picked_up" && <button className="mail-action" disabled={pending === `${order.id}-invoice`} onClick={() => resend(order, "invoice")}><Send size={15} /><span>Facture</span><i className={order.emails.invoice.status} /></button>}</div>
      </article>; })}{!shown.length && <div className="admin-empty"><PackageCheck size={28} /><h2>Le passe est vide</h2><p>Aucune commande ne correspond à cette vue.</p></div>}</div>
      <section className="mail-journal"><h2><Bell size={18} /> Journal des e-mails</h2>{outbox.slice(0, 8).map((entry) => <div key={entry.id}><span>{entry.kind === "ready" ? "Commande prête" : entry.kind === "invoice" ? "Facture" : "Confirmation"}</span><strong className={entry.status}>{entry.status === "sent" ? "Envoyé" : entry.status === "failed" ? `Nouvelle tentative ${entry.attempts}/4` : "En attente"}</strong></div>)}</section>
    </section>
  </main>;
}
