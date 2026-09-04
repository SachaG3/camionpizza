"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowUpRight, FileDown, Gift, LoaderCircle, LogOut, PackageCheck, Pizza, ReceiptText, UserRound } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicLoyaltyUser } from "@/lib/loyalty-store";
import type { CustomerOrder, OrderStatus } from "@/lib/order-store";

const statusLabels: Record<OrderStatus, string> = {
  received: "Reçue",
  preparing: "En préparation",
  ready: "Prête",
  picked_up: "Récupérée",
  cancelled: "Annulée",
};

const euro = (value: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

export function AccountDialog({
  open,
  onOpenChange,
  user,
  onUserChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: PublicLoyaltyUser | null;
  onUserChange: (user: PublicLoyaltyUser | null) => void;
}) {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [section, setSection] = useState<"loyalty" | "orders">("loyalty");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersPending, setOrdersPending] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let active = true;
    const pendingTimer = window.setTimeout(() => setOrdersPending(true), 0);
    fetch("/api/orders")
      .then((response) => response.json())
      .then((result) => { if (active) setOrders(result.orders ?? []); })
      .catch(() => undefined)
      .finally(() => { if (active) setOrdersPending(false); });
    return () => { active = false; window.clearTimeout(pendingTimer); };
  }, [open, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Impossible de continuer.");
      onUserChange(result.user);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Impossible de continuer.");
    } finally {
      setPending(false);
    }
  }

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    onUserChange(null);
    setMode("login");
    setPending(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="account-dialog">
        {user ? (
          <div className="loyalty-profile">
            <DialogHeader>
              <span className="account-illustration"><Gift size={25} /></span>
              <p className="composer-kicker">Club Fourchette</p>
              <DialogTitle>Salut {user.name} !</DialogTitle>
              <DialogDescription>
                Chaque pizza commandée ajoute un tampon. La sixième débloque une pizza offerte.
              </DialogDescription>
            </DialogHeader>

            <div className="profile-tabs" role="tablist" aria-label="Mon compte">
              <button type="button" role="tab" aria-selected={section === "loyalty"} className={section === "loyalty" ? "active" : ""} onClick={() => setSection("loyalty")}>Fidélité</button>
              <button type="button" role="tab" aria-selected={section === "orders"} className={section === "orders" ? "active" : ""} onClick={() => setSection("orders")}>Mes commandes <span>{orders.length}</span></button>
            </div>

            {section === "loyalty" ? <><div className="stamp-card">
              <div className="stamp-card-heading">
                <span>Ta carte fidélité</span>
                <strong>{user.stamps}/6</strong>
              </div>
              <div className="stamp-track" aria-label={`${user.stamps} tampons sur 6`}>
                {Array.from({ length: 6 }, (_, index) => (
                  <span className={index < user.stamps ? "earned" : ""} key={index}>
                    <Pizza size={18} />
                  </span>
                ))}
              </div>
              <p>
                {user.stamps === 5
                  ? "Plus qu’une pizza avant ta récompense."
                  : `Encore ${6 - user.stamps} pizzas avant la prochaine offerte.`}
              </p>
            </div>

            <div className="reward-summary">
              <div><strong>{user.rewards}</strong><span>pizza{user.rewards > 1 ? "s" : ""} offerte{user.rewards > 1 ? "s" : ""}</span></div>
              <div><strong>{user.totalOrders}</strong><span>commande{user.totalOrders > 1 ? "s" : ""}</span></div>
            </div>

            {user.role === "admin" && <a className="admin-access" href="/admin"><PackageCheck size={16} /> Gérer les commandes <ArrowUpRight size={15} /></a>}
            </> : (
              <div className="order-history">
                {ordersPending ? <div className="history-empty"><LoaderCircle className="spin" size={22} /> Chargement…</div> : orders.length ? orders.map((order) => (
                  <article className="history-order" key={order.id}>
                    <div className="history-order-head">
                      <div><span>{new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</span><strong>{order.number}</strong></div>
                      <span className={`order-status ${order.status}`}>{statusLabels[order.status]}</span>
                    </div>
                    <p>{order.items.map((item) => `${item.quantity} × ${item.name}`).join(" · ")}</p>
                    <div className="history-order-foot">
                      <span>{order.locationName} · {order.pickupTime}</span>
                      <strong>{euro(order.total)}</strong>
                    </div>
                    {order.status === "picked_up" && <a href={`/api/orders/${order.id}/invoice`}><FileDown size={14} /> Télécharger la facture</a>}
                  </article>
                )) : <div className="history-empty"><ReceiptText size={24} /><strong>Pas encore de commande</strong><span>Ta prochaine pause apparaîtra ici.</span></div>}
              </div>
            )}

            <button className="logout-button" type="button" onClick={logout} disabled={pending}>
              <LogOut size={16} /> Se déconnecter
            </button>
          </div>
        ) : (
          <>
            <DialogHeader className="account-header">
              <span className="account-illustration"><UserRound size={25} /></span>
              <p className="composer-kicker">Club Fourchette</p>
              <DialogTitle>{mode === "register" ? "Ta pause te rapporte" : "Content de te revoir"}</DialogTitle>
              <DialogDescription>
                {mode === "register"
                  ? "Crée ton compte facultatif pour cumuler des tampons. Tu peux toujours commander sans compte."
                  : "Connecte-toi pour retrouver ta carte fidélité."}
              </DialogDescription>
            </DialogHeader>

            <div className="account-tabs" role="tablist" aria-label="Accès au compte">
              <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(""); }}>
                Créer un compte
              </button>
              <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>
                Se connecter
              </button>
            </div>

            <form className="account-form" onSubmit={submit}>
              {mode === "register" && (
                <label>
                  <span>Prénom</span>
                  <input name="name" type="text" autoComplete="given-name" minLength={2} maxLength={40} placeholder="Lina" required />
                </label>
              )}
              <label>
                <span>E-mail</span>
                <input name="email" type="email" autoComplete="email" maxLength={120} placeholder="lina@exemple.fr" required />
              </label>
              <label>
                <span>Mot de passe</span>
                <input name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 8 : 1} maxLength={128} placeholder={mode === "register" ? "8 caractères minimum" : "Ton mot de passe"} required />
              </label>
              {error && <p className="account-error" role="alert">{error}</p>}
              <button className="account-submit" type="submit" disabled={pending}>
                {pending && <LoaderCircle className="spin" size={17} />}
                {mode === "register" ? "Créer ma carte" : "Me connecter"}
              </button>
            </form>
            <p className="account-reassurance">Mot de passe haché · compte non requis pour commander</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
