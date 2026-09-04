"use client";

import { FormEvent, useState } from "react";
import { Gift, LoaderCircle, LogOut, Pizza, UserRound } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicLoyaltyUser } from "@/lib/loyalty-store";

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

            <div className="stamp-card">
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
