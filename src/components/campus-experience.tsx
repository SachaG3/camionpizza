"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Flame, Leaf, Sparkles, Trophy, Share2, Download, Ticket, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { pizzas, type Pizza } from "@/data/menu";
import { matchPizza, type MatchAnswers } from "@/lib/pizza-match";
import type { PublicLoyaltyUser } from "@/lib/loyalty-store";
import "./campus-experience.css";

type Campus = { settings: { quiz: boolean; battle: boolean; club: boolean }; battle: { counts: { burrata: number; nduja: number }; choice: "burrata" | "nduja" | null; closed: boolean; winner: "burrata" | "nduja" | null }; club: { quiz: boolean; vote: boolean; rewardCode: string | null }; isAdmin: boolean };
type Mode = "quiz" | "battle" | "club";
const titles = { quiz: "Trouve ta pizza.", battle: "Le campus tranche.", club: "Ton passeport gourmand." };

export function CampusExperience({ user, onOrder, onAccount, surface = "quiz" }: { surface?: "quiz" | "battle" | "club"; user: PublicLoyaltyUser | null; onOrder: (pizza: Pizza) => void; onAccount: () => void }) {
  const [mode, setMode] = useState<Mode | null>(surface === "quiz" ? null : surface);
  const [data, setData] = useState<Campus | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<MatchAnswers>({ diet: "all", mood: "fresh", budget: "all" });
  const [notice, setNotice] = useState("");
  const result = matchPizza(answers);
  const winner = pizzas.find(p => p.id === data?.battle.winner);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await fetch("/api/campus", { cache: "no-store" });
        if (!response.ok) throw new Error("Le campus est momentanément indisponible.");
        const next = await response.json();
        if (active) { setData(next); setError(""); }
      } catch { if (active) setError("Impossible de charger le campus. Réessaie dans un instant."); }
    };
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [user?.id]);

  async function act(payload: object) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/campus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error || "Action impossible, réessaie.");
      setData(next); return true;
    } catch (error) { setError(error instanceof Error ? error.message : "Connexion interrompue."); return false; }
    finally { setBusy(false); }
  }
  function open(next: Mode) { setNotice(""); setMode(next); }
  function order(pizza: Pizza) { setMode(null); setTimeout(() => onOrder(pizza), 150); }
  async function share() {
    const text = `Mon profil Fourchette : ${result.profile}. Ma pizza : ${result.pizza.name}. Et toi ?`;
    try {
      if (navigator.share) await navigator.share({ title: "Mon pizza match", text, url: `${location.origin}/#menu` });
      else { await navigator.clipboard.writeText(`${text} ${location.origin}/#menu`); setNotice("Ton profil et le lien sont copiés."); }
    } catch { setNotice("Partage annulé ou indisponible. Tu peux télécharger ta carte."); }
  }
  function download() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350"><rect width="1080" height="1350" fill="#f8efd9"/><circle cx="940" cy="240" r="360" fill="#ead3a9"/><text x="90" y="170" fill="#b83420" font-family="Georgia" font-size="78">fourchette.</text><text x="90" y="420" fill="#272b20" font-family="Arial" font-size="28" letter-spacing="8">MON PIZZA MATCH</text><text x="90" y="550" fill="#272b20" font-family="Georgia" font-size="55">${result.profile}</text><path d="M90 640H980" stroke="#272b20"/><text x="90" y="780" fill="#b83420" font-family="Georgia" font-size="56">${result.pizza.name}</text><text x="90" y="880" fill="#272b20" font-family="Arial" font-size="28">Une personnalité. Une pizza. Ton campus.</text><text x="90" y="1200" fill="#272b20" font-family="Arial" font-size="24">À toi de trouver la tienne sur Fourchette.</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a"); link.href = url; link.download = "mon-pizza-match.svg"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Ta carte est téléchargée.");
  }
  useEffect(() => {
    if (surface !== "quiz") return;
    const listener = () => setTimeout(() => setMode("quiz"), 150);
    window.addEventListener("fourchette-open-quiz", listener);
    return () => window.removeEventListener("fourchette-open-quiz", listener);
  }, [surface]);
  const total = data ? data.battle.counts.burrata + data.battle.counts.nduja : 0;
  if (data && !data.settings[surface]) return surface === "club" ? <p className="battle-note">Les défis reviendront bientôt. Ta fidélité reste active.</p> : null;
  return <>
    {surface === "quiz" && <button className="pizza-match-invitation" onClick={() => open("quiz")}><span className="match-invitation-icon"><Sparkles size={22} /></span><span><strong>Tu hésites ? On a ta pizza.</strong><small>3 questions pour trouver celle qui te ressemble.</small></span><span className="match-invitation-cta">Faire le match <ArrowRight size={17} /></span></button>}
    <CampusFrame surface={surface} mode={mode} onClose={() => setMode(null)}>
        {surface !== "club" && <div className="campus-dialog-head"><span className="campus-kicker">{surface === "battle" ? "LE CHOIX DU CAMPUS" : "TON PIZZA MATCH"}</span>{surface === "quiz" ? <><DialogTitle>{titles.quiz}</DialogTitle><DialogDescription>Trois questions. Une recette faite pour tes envies.</DialogDescription></> : <><h2>La battle du campus.</h2><p>La burrata fondante face à la nduja relevée. Vote pour la prochaine tête d’affiche du camion.</p></>}</div>}
        {error && <p className="campus-message" role="alert">{error}</p>}
        {mode === "quiz" && <div className="campus-quiz">
          {step < 3 ? <><div className="quiz-progress" aria-label={`Question ${step + 1} sur 3`}>{[0, 1, 2].map(i => <i key={i} className={i <= step ? "active" : ""} />)}<span>0{step + 1} / 03</span></div>
            <h3>{["Dans ton assiette ?", "Ton humeur du jour ?", "Et côté budget ?"][step]}</h3>
            <div className="quiz-choices">
              {step === 0 && <><button onClick={() => { setAnswers({ ...answers, diet: "veggie" }); setStep(1); }}><Leaf /><strong>Team végétarienne</strong><span>Le végétal en premier rôle</span></button><button onClick={() => { setAnswers({ ...answers, diet: "all" }); setStep(1); }}><Flame /><strong>Je goûte à tout</strong><span>Place à la découverte</span></button></>}
              {step === 1 && ([ ["fresh", "Fraîche & légère", "Légumes, basilic, grand air"], ["cream", "Très, très crémeuse", "Le réconfort, sans hésiter"], ["fire", "Ça doit réveiller", "Du caractère à chaque part"] ] as const).map(([mood, title, detail]) => <button key={mood} onClick={() => { setAnswers({ ...answers, mood }); setStep(2); }}><Sparkles /><strong>{title}</strong><span>{detail}</span></button>)}
              {step === 2 && ([ ["ten", "10 € maximum", "Une bonne pause, un budget gardé"], ["all", "Place au coup de cœur", "Toute la carte pour choisir"] ] as const).map(([budget, title, detail]) => <button disabled={busy} key={budget} onClick={() => { setAnswers({ ...answers, budget }); setStep(3); void act({ action: "quiz" }); }}><Ticket /><strong>{title}</strong><span>{detail}</span></button>)}
            </div>{step > 0 && <button className="campus-text-button" onClick={() => setStep(step - 1)}>← Question précédente</button>}</> : <div className="quiz-reveal" aria-live="polite"><div className="match-photo"><Image src={result.pizza.image} alt={result.pizza.name} width={520} height={360} /><span>IT’S A MATCH</span></div><div className="match-copy"><span className="campus-kicker">TON PROFIL GOURMAND</span><h3>{result.profile}</h3><h4>{result.pizza.name}</h4><p>{result.pizza.description}</p><p className="match-allergens">Allergènes : {result.pizza.allergens.join(", ")}. Recette de base, hors personnalisation.</p><button className="campus-primary" onClick={() => order(result.pizza)}>C’est ma pizza · {result.pizza.price.toFixed(2).replace(".", ",")} € <ArrowRight size={18} /></button><div className="match-actions"><button onClick={() => void share()}><Share2 size={17} /> Partager</button><button onClick={download}><Download size={17} /> Ma carte</button><button aria-label="Recommencer le quiz" onClick={() => setStep(0)}><RotateCcw size={17} /></button></div>{error && <button className="campus-text-button" disabled={busy} onClick={() => void act({ action: "quiz" })}>Enregistrer mon défi</button>}</div></div>}
        </div>}
        {mode === "battle" && <div className="campus-battle">{!data ? <p role="status">Chargement des votes…</p> : <><div className="battle-status"><span>{data.battle.closed ? "VOTE CLÔTURÉ" : "LE VOTE EST OUVERT"}</span><strong>{total} vote{total !== 1 ? "s" : ""}</strong></div><div className="battle-duel">{(["burrata", "nduja"] as const).map(id => { const pizza = pizzas.find(p => p.id === id)!; const percentage = total ? Math.round(data.battle.counts[id] / total * 100) : 0; return <article key={id} className={`battle-candidate ${data.battle.choice === id ? "chosen" : ""}`}><Image src={pizza.image} alt={pizza.name} width={400} height={280} /><div><small>{id === "burrata" ? "TEAM DOUCEUR" : "TEAM CARACTÈRE"}</small><h3>{pizza.name}</h3><p>{id === "burrata" ? "Burrata. Pistache. Tout en douceur." : "Nduja. Mozzarella fumée. Sans détour."}</p><div className="vote-result"><strong>{percentage}%</strong><span>{data.battle.counts[id]} vote{data.battle.counts[id] !== 1 ? "s" : ""}</span></div><div className="vote-meter"><i style={{ width: `${percentage}%` }} /></div><button disabled={busy || data.battle.closed || !!data.battle.choice} onClick={() => void act({ action: "vote", choice: id })}>{data.battle.winner === id ? <><Trophy size={17} /> Pizza du campus</> : data.battle.choice === id ? <><Check size={17} /> Ton vote est compté</> : data.battle.choice ? "Vote enregistré" : data.battle.closed ? "Vote terminé" : "Je défends cette pizza"}</button></div></article>; })}</div><p className="battle-note">La gagnante devient la pizza mise à l’honneur sur l’accueil. Un vote par compte ou navigateur ; résultats actualisés automatiquement.</p>{winner && <button className="campus-primary" onClick={() => order(winner)}>Goûter la gagnante <ArrowRight size={18} /></button>}</> }</div>}
        {mode === "club" && <div className="campus-club"><div className="club-pass"><div><span>FOURCHETTE SOCIAL CLUB</span><Ticket size={25} /></div><small>PASSEPORT GOURMAND</small><h3>{user ? user.name : "La promo des gourmands"}</h3><div className="club-stamps">{Array.from({ length: 6 }, (_, i) => <span key={i} className={i < (user?.stamps ?? 0) ? "earned" : ""}>{i < (user?.stamps ?? 0) ? <Check /> : String(i + 1).padStart(2, "0")}</span>)}</div><footer><span>{user ? `${user.stamps}/6 tampons · ${user.rewards} récompense(s)` : "Connecte-toi pour retrouver tes tampons"}</span><strong>MEMBER’S EDITION</strong></footer></div><div className="club-missions"><span className="campus-kicker">TES PREMIERS DÉFIS</span><button onClick={() => { onAccount(); window.dispatchEvent(new Event("fourchette-open-quiz")); }}><span className={`mission-check ${data?.club.quiz ? "done" : ""}`}>{data?.club.quiz ? <Check /> : "01"}</span><span><strong>Trouve ton alter ego gourmand</strong><small>Termine le pizza match</small></span><ArrowRight /></button><button onClick={() => { onAccount(); document.querySelector("#campus-battle")?.scrollIntoView({ behavior: "smooth" }); }}><span className={`mission-check ${data?.club.vote ? "done" : ""}`}>{data?.club.vote ? <Check /> : "02"}</span><span><strong>Fais entendre ton campus</strong><small>Vote dans la battle</small></span><ArrowRight /></button><div className={`club-reward ${data?.club.rewardCode ? "unlocked" : ""}`}><Trophy /><h3>{data?.club.rewardCode ? "Bienvenue parmi les pionniers." : "Le badge Pionnier t’attend."}</h3><p>Deux défis terminés : débloque ton badge de membre fondateur.</p>{data?.club.rewardCode ? <strong className="reward-code">{data.club.rewardCode}</strong> : <button className="campus-primary" disabled={busy || !data?.club.quiz || !data?.club.vote} onClick={() => void act({ action: "claim" })}>Débloquer mon badge</button>}<small>Badge à collectionner, sans valeur de réduction. Les tampons pizza restent liés à ton compte.</small></div></div></div>}
        {notice && <p className="campus-message" role="status">{notice}</p>}
    </CampusFrame>
  </>;
}

function CampusFrame({ surface, mode, onClose, children }: { surface: "quiz" | "battle" | "club"; mode: Mode | null; onClose: () => void; children: React.ReactNode }) {
  if (surface !== "quiz") return <section id={surface === "battle" ? "campus-battle" : undefined} className={`campus-embedded campus-${surface}-embedded`}>{children}</section>;
  return <Dialog open={mode !== null} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="campus-dialog campus-quiz-dialog">{children}</DialogContent></Dialog>;
}
