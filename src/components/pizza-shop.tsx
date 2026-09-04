"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  MapPin,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

import {
  bases,
  pizzas,
  proteins,
  sizes,
  toppings,
  type Pizza,
} from "@/data/menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const euro = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);

export function PizzaShop() {
  const [selectedPizza, setSelectedPizza] = useState<Pizza>(pizzas[0]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [size, setSize] = useState(sizes[0].id);
  const [base, setBase] = useState(bases[0].id);
  const [protein, setProtein] = useState(proteins[0].id);
  const [extras, setExtras] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [toast, setToast] = useState(false);

  const unitPrice = useMemo(() => {
    const sizePrice = sizes.find((item) => item.id === size)?.price ?? 0;
    const basePrice = bases.find((item) => item.id === base)?.price ?? 0;
    const proteinPrice =
      proteins.find((item) => item.id === protein)?.price ?? 0;
    const extrasPrice = extras.reduce(
      (sum, id) => sum + (toppings.find((item) => item.id === id)?.price ?? 0),
      0,
    );
    return selectedPizza.price + sizePrice + basePrice + proteinPrice + extrasPrice;
  }, [base, extras, protein, selectedPizza.price, size]);

  function openComposer(pizza: Pizza) {
    setSelectedPizza(pizza);
    setSize("solo");
    setBase("tomate");
    setProtein("none");
    setExtras([]);
    setQuantity(1);
    setComposerOpen(true);
  }

  function toggleExtra(id: string) {
    setExtras((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 5
          ? [...current, id]
          : current,
    );
  }

  function addToCart() {
    setCartCount((count) => count + quantity);
    setCartTotal((total) => total + unitPrice * quantity);
    setComposerOpen(false);
    setToast(true);
    window.setTimeout(() => setToast(false), 2800);
  }

  return (
    <main className="site-shell">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            className="toast"
            role="status"
          >
            <span className="toast-icon"><Check size={16} /></span>
            Pizza ajoutée au panier
          </motion.div>
        )}
      </AnimatePresence>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fourchette, accueil">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Fourchette</span>
        </a>

        <button className="location-pill" type="button">
          <MapPin size={16} />
          <span className="location-copy">
            <strong>Lycée Jean-Moulin</strong>
            <small>Aujourd’hui · 11:30–14:00</small>
          </span>
          <ChevronDown size={15} />
        </button>

        <button className="cart-button" type="button" aria-label="Ouvrir le panier">
          <ShoppingBag size={19} />
          <span className="cart-label">Panier</span>
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
      </header>

      <section className="intro" id="top">
        <div className="intro-copy">
          <div className="eyebrow"><span /> Le food-truck du campus</div>
          <h1>La pizza qui arrive<br />avant la <em>sonnerie.</em></h1>
          <p>
            Choisis une recette ou compose la tienne. On la prépare,
            tu la récupères sans perdre ta pause.
          </p>
          <div className="intro-actions">
            <a className="primary-action" href="#menu">
              Voir la carte <ArrowRight size={18} />
            </a>
            <span className="prep-time"><Clock3 size={17} /> Prête en 12 min</span>
          </div>
        </div>

        <div className="intro-visual">
          <div className="hero-photo">
            <Image
              src="/images/pizza-burrata.jpg"
              alt="Pizza artisanale à la burrata"
              fill
              priority
              sizes="(max-width: 760px) 100vw, 48vw"
            />
          </div>
          <div className="price-sticker">
            <small>À partir de</small>
            <strong>8<span>€50</span></strong>
          </div>
          <div className="hand-note">Pâte fraîche<br />chaque matin ↗</div>
        </div>
      </section>

      <section className="menu-section" id="menu">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Notre sélection</p>
            <h2>Les préférées du bahut</h2>
          </div>
          <button className="compose-shortcut" onClick={() => openComposer(pizzas[0])}>
            <Sparkles size={17} /> Composer de zéro
          </button>
        </div>

        <div className="filter-row" aria-label="Filtres de la carte">
          <button className="filter active">Toutes</button>
          <button className="filter">Les classiques</button>
          <button className="filter">Végétariennes</button>
          <button className="filter">Ça pique</button>
        </div>

        <div className="pizza-grid">
          {pizzas.map((pizza, index) => (
            <motion.article
              key={pizza.id}
              className="pizza-card"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.06 }}
            >
              <button className="pizza-image" onClick={() => openComposer(pizza)}>
                <Image
                  src={pizza.image}
                  alt={`Pizza ${pizza.name}`}
                  fill
                  sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 23vw"
                />
                {pizza.popular && (
                  <span className="popular-tag"><Flame size={14} /> Populaire</span>
                )}
                <span className="quick-add"><Plus size={20} /></span>
              </button>
              <div className="pizza-info">
                <div className="pizza-title-row">
                  <h3>{pizza.name}</h3>
                  <strong>{euro(pizza.price)}</strong>
                </div>
                <p>{pizza.description}</p>
                <div className="tag-row">
                  {pizza.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="promise-band">
        <p>Une pause, pas une attente.</p>
        <div>
          <span><strong>01</strong> Commande en ligne</span>
          <span><strong>02</strong> Préparée devant toi</span>
          <span><strong>03</strong> Récupérée au camion</span>
        </div>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark">F</span><span>Fourchette</span></div>
        <p>Pizza chaude. Pause intacte.</p>
        <small>Projet scolaire · Démonstration</small>
      </footer>

      {cartCount > 0 && (
        <button className="mobile-cart" type="button">
          <span><ShoppingBag size={18} /> {cartCount} article{cartCount > 1 ? "s" : ""}</span>
          <strong>Voir le panier · {euro(cartTotal)}</strong>
        </button>
      )}

      <Sheet open={composerOpen} onOpenChange={setComposerOpen}>
        <SheetContent className="composer-sheet" side="right">
          <SheetHeader className="composer-header">
            <div className="composer-thumb">
              <Image src={selectedPizza.image} alt="" fill sizes="72px" />
            </div>
            <div>
              <span className="composer-kicker">À ta façon</span>
              <SheetTitle>{selectedPizza.name}</SheetTitle>
              <SheetDescription>Compose-la sans te tromper.</SheetDescription>
            </div>
          </SheetHeader>

          <div className="composer-body">
            <OptionSection number="1" title="Quelle taille ?">
              <div className="choice-grid two">
                {sizes.map((item) => (
                  <ChoiceButton
                    key={item.id}
                    selected={size === item.id}
                    onClick={() => setSize(item.id)}
                    label={item.label}
                    detail={`${item.detail}${item.price ? ` · +${euro(item.price)}` : ""}`}
                  />
                ))}
              </div>
            </OptionSection>

            <OptionSection number="2" title="Choisis ta base">
              <div className="choice-grid">
                {bases.map((item) => (
                  <ChoiceButton
                    key={item.id}
                    selected={base === item.id}
                    onClick={() => setBase(item.id)}
                    label={item.label}
                    detail={item.price ? `+${euro(item.price)}` : "Inclus"}
                  />
                ))}
              </div>
            </OptionSection>

            <OptionSection number="3" title="Une protéine ?" optional>
              <div className="choice-grid two">
                {proteins.map((item) => (
                  <ChoiceButton
                    key={item.id}
                    selected={protein === item.id}
                    onClick={() => setProtein(item.id)}
                    label={item.label}
                    detail={item.price ? `+${euro(item.price)}` : "Inclus"}
                  />
                ))}
              </div>
            </OptionSection>

            <OptionSection number="4" title="Les petits plus" optional note={`${extras.length}/5`}>
              <div className="extra-list">
                {toppings.map((item) => {
                  const checked = extras.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      className={`extra-row ${checked ? "selected" : ""}`}
                      onClick={() => toggleExtra(item.id)}
                      disabled={!checked && extras.length >= 5}
                    >
                      <span className="check-box">{checked && <Check size={14} />}</span>
                      <span>{item.label}</span>
                      <strong>+{euro(item.price)}</strong>
                    </button>
                  );
                })}
              </div>
            </OptionSection>
          </div>

          <div className="composer-footer">
            <div className="quantity-stepper" aria-label="Quantité">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Retirer une pizza"><Minus size={16} /></button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((value) => Math.min(9, value + 1))} aria-label="Ajouter une pizza"><Plus size={16} /></button>
            </div>
            <button className="add-button" onClick={addToCart}>
              Ajouter <span>{euro(unitPrice * quantity)}</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

function OptionSection({
  number,
  title,
  optional,
  note,
  children,
}: {
  number: string;
  title: string;
  optional?: boolean;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="option-section">
      <div className="option-heading">
        <span>{number}</span>
        <h3>{title}</h3>
        {optional && <small>Optionnel</small>}
        {note && <small className="option-note">{note}</small>}
      </div>
      {children}
    </section>
  );
}

function ChoiceButton({
  selected,
  onClick,
  label,
  detail,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  detail: string;
}) {
  return (
    <button className={`choice-button ${selected ? "selected" : ""}`} onClick={onClick}>
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <span className="radio-dot">{selected && <i />}</span>
    </button>
  );
}
