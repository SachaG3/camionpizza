"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BadgeEuro,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Flame,
  MapPin,
  Minus,
  Plus,
  Pizza as PizzaIcon,
  Search,
  ShoppingBag,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

import { AccountDialog } from "@/components/account-dialog";
import { LocationDialog } from "@/components/location-dialog";

import {
  bases,
  pizzas,
  proteins,
  sizes,
  toppings,
  type Pizza,
} from "@/data/menu";
import { locations, parseSelectedLocationId } from "@/data/locations";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  addCartLine,
  cartCount,
  cartTotal,
  changeCartLineQuantity,
  parseStoredCart,
  type CartLine,
} from "@/lib/cart";
import type { PublicLoyaltyUser } from "@/lib/loyalty-store";
import {
  createDefaultCartLine,
  filterPizzas,
  type MenuFilter,
} from "@/lib/menu-actions";
import {
  COMBO_DISCOUNT,
  emptyAddonSelection,
  orderAddons,
  orderTotal,
  parseStoredAddons,
  selectedAddons,
  type AddonSelection,
  type OrderAddon,
} from "@/lib/order-addons";

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
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [pickupTime, setPickupTime] = useState(locations[0].slots[0]);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<MenuFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState<PublicLoyaltyUser | null>(null);
  const [loyaltyEarned, setLoyaltyEarned] = useState(0);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationId, setLocationId] = useState(locations[0].id);
  const [locationReady, setLocationReady] = useState(false);
  const [addons, setAddons] = useState<AddonSelection>(emptyAddonSelection);
  const [addonsReady, setAddonsReady] = useState(false);
  const [confirmedAddons, setConfirmedAddons] = useState<string[]>([]);

  const itemCount = cartCount(cart);
  const pizzaValue = cartTotal(cart);
  const cartValue = orderTotal(cart, addons);
  const chosenAddons = selectedAddons(addons);
  const hasCombo = Boolean(addons.drinkId && addons.dessertId);
  const filteredPizzas = useMemo(
    () => filterPizzas(pizzas, activeFilter, searchQuery),
    [activeFilter, searchQuery],
  );
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === locationId) ?? locations[0],
    [locationId],
  );

  useEffect(() => {
    const restoreCart = window.setTimeout(() => {
      setCart(parseStoredCart(window.localStorage.getItem("fourchette-cart")));
      setCartReady(true);
    }, 0);

    return () => window.clearTimeout(restoreCart);
  }, []);

  useEffect(() => {
    if (cartReady) {
      window.localStorage.setItem("fourchette-cart", JSON.stringify(cart));
    }
  }, [cart, cartReady]);

  useEffect(() => {
    const restoreAddons = window.setTimeout(() => {
      setAddons(parseStoredAddons(window.localStorage.getItem("fourchette-addons")));
      setAddonsReady(true);
    }, 0);
    return () => window.clearTimeout(restoreAddons);
  }, []);

  useEffect(() => {
    if (addonsReady) {
      window.localStorage.setItem("fourchette-addons", JSON.stringify(addons));
    }
  }, [addons, addonsReady]);

  useEffect(() => {
    const restoreLocation = window.setTimeout(() => {
      const restoredId = parseSelectedLocationId(
        window.localStorage.getItem("fourchette-location"),
      );
      const restored = locations.find((location) => location.id === restoredId) ?? locations[0];
      setLocationId(restored.id);
      setPickupTime(restored.slots[0]);
      setLocationReady(true);
    }, 0);
    return () => window.clearTimeout(restoreLocation);
  }, []);

  useEffect(() => {
    if (locationReady) {
      window.localStorage.setItem("fourchette-location", locationId);
    }
  }, [locationId, locationReady]);

  useEffect(() => {
    function focusMenuSearch(event: KeyboardEvent) {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      const input = document.querySelector<HTMLInputElement>("[data-page-search]");
      if (!input || input.disabled || input.offsetParent === null) return;
      event.preventDefault();
      input.focus();
    }

    window.addEventListener("keydown", focusMenuSearch);
    return () => window.removeEventListener("keydown", focusMenuSearch);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((response) => response.json())
      .then((result) => {
        if (active) setUser(result.user ?? null);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

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
    const sizeChoice = sizes.find((item) => item.id === size)!;
    const baseChoice = bases.find((item) => item.id === base)!;
    const proteinChoice = proteins.find((item) => item.id === protein)!;
    const extraChoices = extras
      .map((id) => toppings.find((item) => item.id === id)?.label)
      .filter((label): label is string => Boolean(label));
    const configurationId = [selectedPizza.id, size, base, protein, ...extras.toSorted()].join("-");

    setCart((current) =>
      addCartLine(current, {
        id: configurationId,
        pizzaId: selectedPizza.id,
        name: selectedPizza.name,
        image: selectedPizza.image,
        unitPrice,
        quantity,
        details: [
          `${sizeChoice.label} · ${sizeChoice.detail}`,
          baseChoice.label,
          ...(proteinChoice.id === "none" ? [] : [proteinChoice.label]),
          ...extraChoices,
        ],
      }),
    );
    setComposerOpen(false);
    setToast(`${selectedPizza.name} ajoutée au panier`);
    window.setTimeout(() => setToast(null), 2800);
  }

  function quickAdd(pizza: Pizza) {
    setCart((current) => addCartLine(current, createDefaultCartLine(pizza)));
    setToast(`${pizza.name} ajoutée en Solo`);
    window.setTimeout(() => setToast(null), 2800);
  }

  function selectLocation(id: string) {
    const location = locations.find((item) => item.id === id) ?? locations[0];
    setLocationId(location.id);
    setPickupTime(location.slots[0]);
    setLocationOpen(false);
  }

  function chooseAddon(item: OrderAddon) {
    const key = item.kind === "drink" ? "drinkId" : "dessertId";
    setAddons((current) => ({
      ...current,
      [key]: current[key] === item.id ? null : item.id,
    }));
  }

  async function placeOrder() {
    setLoyaltyEarned(0);
    if (user) {
      const response = await fetch("/api/loyalty/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pizzaCount: itemCount }),
      });
      if (response.ok) {
        const result = await response.json();
        setUser(result.user);
        setLoyaltyEarned(itemCount);
      }
    }
    const randomOrder = window.crypto.getRandomValues(new Uint32Array(1))[0] % 900;
    setConfirmedAddons(chosenAddons.map((item) => item.name));
    setOrderNumber(String(100 + randomOrder));
    setCart([]);
    setAddons(emptyAddonSelection);
    setCartOpen(false);
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
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="topbar">
        <a className="brand" href="#top" aria-label="Fourchette, accueil">
          <span className="brand-mark" aria-hidden="true">F</span>
          <span>Fourchette</span>
        </a>

        <button className="location-pill" type="button" onClick={() => setLocationOpen(true)}>
          <MapPin size={16} />
          <span className="location-copy">
            <strong>{selectedLocation.name}</strong>
            <small>{selectedLocation.dayLabel} · {selectedLocation.hours}</small>
          </span>
          <ChevronDown size={15} />
        </button>

        <div className="header-actions">
          <button className={`account-button ${user ? "connected" : ""}`} type="button" onClick={() => setAccountOpen(true)}>
            <span className="account-avatar">{user ? user.name.slice(0, 1).toUpperCase() : <UserRound size={17} />}</span>
            <span>{user ? user.name : "Mon compte"}</span>
          </button>
          <button className="cart-button" type="button" aria-label="Ouvrir le panier" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={19} />
            <span className="cart-label">Panier</span>
            {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
          </button>
        </div>
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

        <div className="menu-discovery">
          <label className="sr-only" htmlFor="menu-search">Rechercher une pizza ou un ingrédient</label>
          <div className="menu-search">
            <Search size={19} aria-hidden="true" />
            <input
              id="menu-search"
              data-page-search
              aria-keyshortcuts="/"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Une pizza, un ingrédient…"
              autoComplete="off"
            />
            {searchQuery ? (
              <button type="button" aria-label="Effacer la recherche" onClick={() => setSearchQuery("")}>
                <X size={16} />
              </button>
            ) : (
              <kbd aria-hidden="true">/</kbd>
            )}
          </div>

          <div className="menu-toolbar">
            <div className="filter-row" aria-label="Filtres de la carte">
              {([
                ["all", "Toutes"],
                ["classic", "Les classiques"],
                ["veggie", "Végétariennes"],
                ["spicy", "Ça pique"],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  className={`filter ${activeFilter === id ? "active" : ""}`}
                  aria-pressed={activeFilter === id}
                  onClick={() => setActiveFilter(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="recipe-count" aria-live="polite">
              {filteredPizzas.length} recette{filteredPizzas.length > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="pizza-grid">
          {filteredPizzas.map((pizza) => (
            <motion.article
              key={pizza.id}
              className="pizza-card"
              layout
              transition={{ layout: { duration: .25 } }}
            >
              <div className="pizza-image">
                <Image
                  src={pizza.image}
                  alt={`Pizza ${pizza.name}`}
                  fill
                  sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 23vw"
                />
                {pizza.popular && (
                  <span className="popular-tag"><Flame size={14} /> Populaire</span>
                )}
                <button className="pizza-open" type="button" aria-label={`Personnaliser ${pizza.name}`} onClick={() => openComposer(pizza)} />
                <span className="customize-hint">Personnaliser</span>
                <button className="quick-add" type="button" aria-label={`Ajouter ${pizza.name} en taille Solo`} onClick={() => quickAdd(pizza)}>
                  <Plus size={20} />
                </button>
              </div>
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
          {filteredPizzas.length === 0 && (
            <div className="menu-empty" role="status">
              <PizzaIcon size={24} />
              <h3>{searchQuery ? `Rien pour « ${searchQuery.trim()} »` : "Aucune pizza ici pour l’instant"}</h3>
              <p>Essaie un autre ingrédient ou reviens à toute la carte.</p>
              <button type="button" onClick={() => { setActiveFilter("all"); setSearchQuery(""); }}>
                Réinitialiser la recherche
              </button>
            </div>
          )}
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

      {itemCount > 0 && (
        <button className="mobile-cart" type="button" onClick={() => setCartOpen(true)}>
          <span><ShoppingBag size={18} /> {itemCount} article{itemCount > 1 ? "s" : ""}</span>
          <strong>Voir le panier · {euro(cartValue)}</strong>
        </button>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent className="cart-sheet" side="right">
          <SheetHeader className="cart-header">
            <span className="composer-kicker">Ta commande</span>
            <SheetTitle>Le panier de la pause</SheetTitle>
            <SheetDescription>
              Récupération au camion, sans passer par la file.
            </SheetDescription>
          </SheetHeader>

          <div className="cart-body">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <span><ShoppingBag size={26} /></span>
                <h3>Ton panier est vide</h3>
                <p>Choisis une recette de la carte pour commencer.</p>
                <button onClick={() => setCartOpen(false)}>Retour à la carte</button>
              </div>
            ) : (
              <>
                <div className="cart-lines">
                  {cart.map((line) => (
                    <motion.article layout key={line.id} className="cart-line">
                      <div className="cart-line-image">
                        <Image src={line.image} alt="" fill sizes="80px" />
                      </div>
                      <div className="cart-line-copy">
                        <div><h3>{line.name}</h3><strong>{euro(line.unitPrice * line.quantity)}</strong></div>
                        <p>{line.details.join(" · ")}</p>
                        <div className="line-stepper">
                          <button aria-label={`Retirer une ${line.name}`} onClick={() => setCart((current) => changeCartLineQuantity(current, line.id, -1))}><Minus size={13} /></button>
                          <span>{line.quantity}</span>
                          <button aria-label={`Ajouter une ${line.name}`} onClick={() => setCart((current) => changeCartLineQuantity(current, line.id, 1))}><Plus size={13} /></button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </div>

                <section className="pause-formula" aria-labelledby="formula-title">
                  <div className="formula-heading">
                    <span><BadgeEuro size={18} /></span>
                    <div>
                      <h3 id="formula-title">Complète ta pause</h3>
                      <p>Une boisson + un dessert = {euro(COMBO_DISCOUNT)} offert</p>
                    </div>
                    {hasCombo && <strong>Formule</strong>}
                  </div>
                  {(["drink", "dessert"] as const).map((kind) => (
                    <div className="addon-group" key={kind}>
                      <small>{kind === "drink" ? "Ta boisson" : "La touche sucrée"}</small>
                      <div className="addon-list">
                        {orderAddons.filter((item) => item.kind === kind).map((item) => {
                          const selected = addons[kind === "drink" ? "drinkId" : "dessertId"] === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              className={selected ? "selected" : ""}
                              aria-pressed={selected}
                              onClick={() => chooseAddon(item)}
                            >
                              <span className="addon-symbol" aria-hidden="true">{item.symbol}</span>
                              <span><strong>{item.name}</strong><small>{item.detail}</small></span>
                              <b>+{euro(item.price)}</b>
                              {selected && <i><Check size={12} /></i>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </section>

                <section className="pickup-section">
                  <div className="pickup-heading">
                    <span><CalendarClock size={18} /></span>
                    <div><h3>Heure de retrait</h3><p>{selectedLocation.name} · {selectedLocation.pickupLabel}</p></div>
                  </div>
                  <div className="time-grid">
                    {selectedLocation.slots.map((time) => (
                      <button key={time} className={pickupTime === time ? "selected" : ""} onClick={() => setPickupTime(time)}>
                        {time}
                      </button>
                    ))}
                  </div>
                </section>

                <section className={`cart-loyalty ${user ? "connected" : ""}`}>
                  <span className="account-avatar">{user ? user.name.slice(0, 1).toUpperCase() : <UserRound size={15} />}</span>
                  <div>
                    <strong>{user ? `${user.stamps}/6 sur ta carte` : "Commande sans compte"}</strong>
                    <p>{user ? "Les pizzas de cette commande seront ajoutées." : "C’est possible. Connecte-toi seulement si tu veux cumuler des tampons."}</p>
                  </div>
                  <button type="button" onClick={() => setAccountOpen(true)}>{user ? "Voir" : "Se connecter"}</button>
                </section>
              </>
            )}
          </div>

          {cart.length > 0 && (
            <div className="cart-footer">
              {(chosenAddons.length > 0 || hasCombo) && (
                <div className="cart-breakdown">
                  <span>Pizzas <b>{euro(pizzaValue)}</b></span>
                  {chosenAddons.map((item) => <span key={item.id}>{item.name} <b>{euro(item.price)}</b></span>)}
                  {hasCombo && <span className="combo-saving">Remise formule <b>−{euro(COMBO_DISCOUNT)}</b></span>}
                </div>
              )}
              <div className="cart-total-row"><span>Total</span><strong>{euro(cartValue)}</strong></div>
              <p>Paiement au camion · retrait à {pickupTime}</p>
              <button className="checkout-button" onClick={placeOrder}>
                Confirmer la commande <ArrowRight size={18} />
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {orderNumber && (
          <motion.div className="order-overlay" onClick={() => setOrderNumber(null)}>
            <motion.div className="order-card" role="dialog" aria-modal="true" aria-labelledby="order-title" initial={{ y: 24, scale: .96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 16, scale: .97 }} onClick={(event) => event.stopPropagation()}>
              <span className="order-check"><Check size={30} /></span>
              <p className="section-kicker">C’est dans le four</p>
              <h2 id="order-title">Commande n°{orderNumber}</h2>
              <p>On t’attend {selectedLocation.dayLabel.toLowerCase()} à <strong>{pickupTime}</strong>, {selectedLocation.pickupLabel.toLowerCase()}.</p>
              {confirmedAddons.length > 0 && (
                <div className="confirmed-formula">
                  <span>En plus de tes pizzas</span>
                  <strong>{confirmedAddons.join(" · ")}</strong>
                </div>
              )}
              {loyaltyEarned > 0 && <p className="loyalty-earned">+{loyaltyEarned} tampon{loyaltyEarned > 1 ? "s" : ""} ajouté{loyaltyEarned > 1 ? "s" : ""} à ta carte</p>}
              <div className="order-ticket"><span>À présenter au camion</span><strong>#{orderNumber}</strong></div>
              <button onClick={() => setOrderNumber(null)}>Retourner à la carte</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AccountDialog open={accountOpen} onOpenChange={setAccountOpen} user={user} onUserChange={setUser} />
      <LocationDialog open={locationOpen} onOpenChange={setLocationOpen} selectedId={locationId} onSelect={selectLocation} />

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
