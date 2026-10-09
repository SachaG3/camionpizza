import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Clock3, MapPin } from "lucide-react";

import { locations } from "@/data/locations";
import "./about-page.css";

export const metadata: Metadata = {
  title: "À propos — Pizza del Bosco",
  description: "L’histoire de Pizza del Bosco, la pizzeria ambulante des campus de Mulhouse.",
};

const steps = [
  { number: "01", title: "La pâte, la veille", text: "Farine italienne, levain et 48 heures de maturation au frais. Une pâte légère, qui se digère avant le cours suivant." },
  { number: "02", title: "Le four, sur place", text: "Chaque pizza est étalée à la main et cuite devant toi, en moins de deux minutes, à plus de 400 °C." },
  { number: "03", title: "La pause, intacte", text: "Tu commandes en ligne, tu choisis ton créneau, tu récupères au camion. Pas de file, pas de pause gâchée." },
];

const values = [
  { title: "Le local d’abord", text: "Fromages, légumes et charcuteries choisis chez des producteurs d’Alsace dès que la saison le permet." },
  { title: "Un prix étudiant", text: "Une vraie pizza à partir de 8,50 €, et une formule avec boisson et dessert pour les grosses journées." },
  { title: "Zéro gaspillage", text: "Les créneaux limitent la surproduction et les invendus de fin de service partent à prix doux." },
];

export default function AboutPage() {
  return (
    <main className="about-page">
      <header className="about-nav">
        <Link className="about-nav-back" href="/"><ArrowLeft size={17} /> Retour à la carte</Link>
        <Link className="about-nav-brand" href="/">pizza del bosco.</Link>
        <Link className="about-nav-cta" href="/#menu">Commander</Link>
      </header>

      <section className="about-hero">
        <div className="about-hero-copy">
          <p className="about-kicker">À propos</p>
          <h1>Une pizzeria qui a pris <em>la route</em> du campus.</h1>
          <p>
            Pizza del Bosco, c’est un camion, un four à bois et une idée simple : servir une vraie
            pizza napolitaine entre deux cours, sans sacrifier la pause.
          </p>
        </div>
        <div className="about-hero-visual">
          <div className="about-hero-photo">
            <Image src="/images/pizza-margherita-bosco.webp" alt="Pizza Margherita de Pizza del Bosco" fill priority sizes="(max-width: 760px) 100vw, 45vw" />
          </div>
          <div className="about-hero-sticker"><strong>Depuis</strong><span>2026</span></div>
        </div>
      </section>

      <section className="about-block about-story-block">
        <p className="about-kicker">Notre histoire</p>
        <div className="about-story-grid">
          <h2>Tout est parti d’une file d’attente.</h2>
          <div className="about-story-text">
            <p>
              Midi, campus Illberg : quarante minutes de queue pour un sandwich tiède, et un cours qui
              reprend à 13 h 30. C’est là qu’est née l’idée de Pizza del Bosco — <em>« la pizza du bois »</em>,
              en hommage au four qui fait tout le travail.
            </p>
            <p>
              Plutôt que d’attendre que les étudiants viennent à la pizzeria, la pizzeria vient à eux.
              Un camion, deux arrêts à Mulhouse, et une commande en ligne pensée pour qu’une pause
              de quarante-cinq minutes suffise largement.
            </p>
          </div>
        </div>
        <dl className="about-numbers">
          <div><dt>48 h</dt><dd>de maturation pour la pâte</dd></div>
          <div><dt>90 s</dt><dd>de cuisson au feu de bois</dd></div>
          <div><dt>~15 min</dt><dd>entre la commande et le retrait</dd></div>
          <div><dt>2</dt><dd>arrêts à Mulhouse chaque semaine</dd></div>
        </dl>
      </section>

      <section className="about-block about-method">
        <p className="about-kicker">Notre méthode</p>
        <h2>Trois étapes, aucune file.</h2>
        <ol className="about-steps">
          {steps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-block about-gallery" aria-label="Quelques recettes">
        {[
          ["pizza-burrata-bosco.webp", "La Boursière, burrata et pesto de pistache"],
          ["pizza-diavola-bosco.webp", "La Copie Double, nduja et piment"],
          ["pizza-veggie-bosco.webp", "La Mention Très Bien, légumes du marché"],
        ].map(([file, label]) => (
          <figure key={file}>
            <div className="about-gallery-photo"><Image src={`/images/${file}`} alt={label} fill sizes="(max-width: 760px) 100vw, 33vw" /></div>
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </section>

      <section className="about-block about-values">
        <p className="about-kicker">Ce qui compte pour nous</p>
        <h2>Bien manger, sans se ruiner.</h2>
        <div className="about-values-grid">
          {values.map((value) => (
            <article key={value.title}>
              <h3>{value.title}</h3>
              <p>{value.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-block about-route" id="ou-passe-le-camion">
        <p className="about-kicker">Où passe le camion</p>
        <h2>Deux arrêts, toute la semaine.</h2>
        <div className="about-route-grid">
          {locations.map((location, index) => (
            <article key={location.id}>
              <span className="about-route-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{location.name}</h3>
              <p className="about-route-line"><MapPin size={16} /> {location.pickupLabel}</p>
              <p className="about-route-line"><Clock3 size={16} /> {location.dayLabel} · {location.hours}</p>
              <Link href={`/?lieu=${location.id}#menu`}>Commander pour ce lieu <ArrowRight size={16} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="about-final">
        <h2>On garde une pizza au chaud pour toi.</h2>
        <Link href="/#menu">Voir la carte <ArrowRight size={18} /></Link>
      </section>

      <footer className="about-footer">
        <span>Pizza del Bosco</span>
        <small>Projet scolaire · Démonstration</small>
      </footer>
    </main>
  );
}
