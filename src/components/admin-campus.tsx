"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Award, Check, Crown, Gamepad2, ShoppingBag, Sparkles, Trophy, Users, Vote } from "lucide-react";

import "./admin-campus.css";

type Choice = "burrata" | "nduja";
type State = {
  settings: { quiz: boolean; battle: boolean; club: boolean };
  metrics: { participants: number; quizzes: number; votes: number; badges: number };
  battle: { counts: Record<Choice, number>; winner: Choice | null; closed: boolean };
};

const contenders: { id: Choice; name: string; detail: string; image: string }[] = [
  { id: "burrata", name: "La Boursière", detail: "Pesto, burrata, courgette", image: "/images/pizza-burrata-bosco-v2.webp" },
  { id: "nduja", name: "La Copie Double", detail: "Nduja, mozzarella fumée, piment", image: "/images/pizza-diavola-bosco.webp" },
];

const experiences = [
  { key: "quiz", title: "Pizza match", detail: "Quiz de recommandation au-dessus de la carte.", icon: Sparkles },
  { key: "battle", title: "Battle du campus", detail: "Duel sous l’accueil. Masquer suspend les votes.", icon: Vote },
  { key: "club", title: "Défis du Club", detail: "Défis et badge dans le compte client.", icon: Award },
] as const;

const rules = [
  { title: "Quiz", text: "Recommande selon le régime, l’envie et le budget. Les recettes épuisées sont exclues." },
  { title: "Badge Pionnier", text: "Débloqué après le quiz et un vote. Honorifique, il ne remplace pas la fidélité." },
  { title: "Participants", text: "Un compte ou un navigateur invité, pas forcément une personne unique." },
];

export function AdminCampus() {
  const [data, setData] = useState<State | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [tie, setTie] = useState<Choice>("burrata");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/admin/campus");
        if (!response.ok) throw new Error();
        const next = await response.json();
        if (active) setData(next);
      } catch {
        if (active) setMessage("Chargement impossible. Actualise cette page.");
      }
    }
    void load();
    const timer = setInterval(load, 10000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  async function update(body: object) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/campus", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const next = await response.json();
      if (!response.ok) throw new Error(next.error);
      setData(next);
      setMessage("Modification enregistrée et publiée.");
      setConfirmation(false);
    } catch (error) {
      setMessage(error instanceof Error && error.message ? error.message : "Enregistrement impossible.");
    } finally {
      setPending(false);
    }
  }

  const total = data ? data.battle.counts.burrata + data.battle.counts.nduja : 0;
  const leader: Choice | null = data && total > 0 && data.battle.counts.burrata !== data.battle.counts.nduja
    ? (data.battle.counts.burrata > data.battle.counts.nduja ? "burrata" : "nduja")
    : null;
  const tied = Boolean(data && total > 0 && !leader);
  const quizRate = data && data.metrics.participants ? Math.round((data.metrics.quizzes / data.metrics.participants) * 100) : 0;

  return (
    <main className="admin-shell">
      <aside className="admin-rail">
        <Link className="brand admin-brand" href="/"><span className="brand-mark">DB</span><span>Pizza del Bosco</span></Link>
        <nav>
          <Link href="/admin"><ShoppingBag size={17} /> Commandes</Link>
          <a className="active" href="#campus" aria-current="page"><Gamepad2 size={17} /> Campus & marketing</a>
        </nav>
        <Link className="admin-back" href="/"><ArrowLeft size={16} /> Retour à la boutique</Link>
      </aside>

      <section className="admin-main campus-board" id="campus">
        <header className="admin-header">
          <div>
            <p className="section-kicker">Animation & fidélisation</p>
            <h1>La vie du campus</h1>
            <span>Mise à jour automatique toutes les 10 secondes</span>
          </div>
          {data && (
            <span className={`campus-live ${data.battle.closed ? "closed" : ""}`}>
              <i /> {data.battle.closed ? "Battle clôturée" : "Battle en cours"}
            </span>
          )}
        </header>

        {message && <div className="admin-notice" role="status"><Check size={15} /> {message}</div>}

        {!data ? (
          <div className="campus-loading" aria-busy="true">Chargement…</div>
        ) : (
          <>
            <div className="admin-stats">
              <div><span><Users size={13} /> Participants</span><strong>{data.metrics.participants}</strong></div>
              <div><span><Sparkles size={13} /> Quiz terminés</span><strong>{data.metrics.quizzes}</strong><small>{quizRate} % des participants</small></div>
              <div><span><Vote size={13} /> Votes</span><strong>{data.metrics.votes}</strong></div>
              <div><span><Award size={13} /> Badges débloqués</span><strong>{data.metrics.badges}</strong></div>
            </div>

            <div className="campus-grid">
              <section className="campus-card campus-battle-card" aria-labelledby="battle-title">
                <div className="campus-card-head">
                  <div>
                    <p className="campus-card-kicker"><Trophy size={14} /> Battle du campus</p>
                    <h2 id="battle-title">La Boursière contre La Copie Double</h2>
                  </div>
                  <span className="campus-total">{total} vote{total > 1 ? "s" : ""}</span>
                </div>

                <div className="campus-duel">
                  {contenders.map((pizza) => {
                    const votes = data.battle.counts[pizza.id];
                    const share = total ? Math.round((votes / total) * 100) : 0;
                    const crowned = data.battle.closed ? data.battle.winner === pizza.id : leader === pizza.id;
                    return (
                      <article key={pizza.id} className={`campus-contender ${crowned ? "leading" : ""}`}>
                        <div className="campus-contender-photo"><Image src={pizza.image} alt="" fill sizes="96px" /></div>
                        <div className="campus-contender-copy">
                          <h3>{pizza.name}</h3>
                          <p>{pizza.detail}</p>
                          {crowned && <span className="campus-crown"><Crown size={12} /> {data.battle.closed ? "Gagnante" : "En tête"}</span>}
                        </div>
                        <div className="campus-contender-score">
                          <strong>{share} %</strong>
                          <span>{votes} vote{votes > 1 ? "s" : ""}</span>
                        </div>
                        <div className="campus-meter" role="meter" aria-label={`Part des votes pour ${pizza.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={share}><i style={{ width: `${share}%` }} /></div>
                      </article>
                    );
                  })}
                </div>

                <div className="campus-battle-footer">
                  <p>
                    {data.battle.closed
                      ? `Édition clôturée. ${data.battle.winner === "burrata" ? "La Boursière" : "La Copie Double"} est mise à l’honneur sur l’accueil.`
                      : tied ? "Égalité parfaite pour l’instant." : total ? "Vote ouvert. La gagnante sera mise à l’honneur sur l’accueil." : "Aucun vote pour l’instant."}
                  </p>
                  {!confirmation ? (
                    <button className={data.battle.closed ? "cb-secondary" : "cb-primary"} onClick={() => setConfirmation(true)}>
                      {data.battle.closed ? "Rouvrir les votes" : "Clôturer et publier la gagnante"}
                    </button>
                  ) : (
                    <div className="campus-confirm">
                      <p>{data.battle.closed ? "Les votes sont conservés ; la mise à l’honneur est retirée jusqu’à la prochaine clôture." : "La recette majoritaire sera publiée sur l’accueil."}</p>
                      {!data.battle.closed && tied && (
                        <label>Départager l’égalité
                          <select value={tie} onChange={(event) => setTie(event.target.value as Choice)}>
                            <option value="burrata">La Boursière</option>
                            <option value="nduja">La Copie Double</option>
                          </select>
                        </label>
                      )}
                      {!data.battle.closed && data.metrics.votes === 0 && <p className="campus-warning">Il faut au moins un vote pour publier une gagnante.</p>}
                      <div>
                        <button className="cb-primary" disabled={pending || (!data.battle.closed && data.metrics.votes === 0)} onClick={() => void update(data.battle.closed ? { action: "reopen" } : { action: "close", winner: tie })}><Check size={15} /> Confirmer</button>
                        <button className="cb-ghost" onClick={() => setConfirmation(false)}>Annuler</button>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="campus-card campus-settings" aria-labelledby="settings-title">
                <p className="campus-card-kicker">Visibilité</p>
                <h2 id="settings-title">Ce que voient les visiteurs</h2>
                <p className="campus-card-note">Masquer une expérience ne supprime ni les votes ni les progressions.</p>
                <ul>
                  {experiences.map(({ key, title, detail, icon: Icon }) => {
                    const on = data.settings[key];
                    return (
                      <li key={key}>
                        <span className="campus-setting-icon"><Icon size={17} /></span>
                        <span className="campus-setting-copy"><strong>{title}</strong><small>{detail}</small></span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          aria-label={`${title} : ${on ? "publié" : "masqué"}`}
                          className={`cb-switch ${on ? "on" : ""}`}
                          disabled={pending}
                          onClick={() => void update({ action: "settings", ...data.settings, [key]: !on })}
                        ><i /></button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            <section className="campus-rules" aria-labelledby="rules-title">
              <h2 id="rules-title">Règles de cette édition</h2>
              <div>
                {rules.map((rule) => (
                  <article key={rule.title}><strong>{rule.title}</strong><p>{rule.text}</p></article>
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
