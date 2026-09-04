"use client";

import {
  CakeSlice,
  Check,
  Citrus,
  Cookie,
  CupSoda,
  Droplet,
  Sparkles,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  COMBO_DISCOUNT,
  orderAddons,
  type AddonSelection,
  type OrderAddon,
} from "@/lib/order-addons";

const euro = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

const addonIcons = {
  water: Droplet,
  citronnade: Citrus,
  cola: CupSoda,
  cookie: Cookie,
  tiramisu: CakeSlice,
};

export function FormulaDialog({
  open,
  onOpenChange,
  selection,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selection: AddonSelection;
  onSelect: (item: OrderAddon) => void;
}) {
  const complete = Boolean(selection.drinkId && selection.dessertId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="formula-dialog">
        <DialogHeader className="formula-dialog-header">
          <span className="formula-kicker"><Sparkles size={13} /> La formule étudiante</span>
          <DialogTitle>Passe ta pause au niveau supérieur.</DialogTitle>
          <DialogDescription>
            Choisis une boisson et une douceur. On retire automatiquement {euro(COMBO_DISCOUNT)}.
          </DialogDescription>
        </DialogHeader>

        <div className="formula-dialog-body">
          {(["drink", "dessert"] as const).map((kind, groupIndex) => (
            <section className="formula-choice-group" key={kind}>
              <div className="formula-choice-heading">
                <span>0{groupIndex + 1}</span>
                <div>
                  <h3>{kind === "drink" ? "Quelque chose à boire" : "Une touche sucrée"}</h3>
                  <p>{kind === "drink" ? "Choisis-en une" : "Pour finir la pause"}</p>
                </div>
              </div>
              <div className="formula-choice-list">
                {orderAddons.filter((item) => item.kind === kind).map((item) => {
                  const selected = selection[kind === "drink" ? "drinkId" : "dessertId"] === item.id;
                  const Icon = addonIcons[item.id as keyof typeof addonIcons];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={selected ? "selected" : ""}
                      aria-pressed={selected}
                      onClick={() => onSelect(item)}
                    >
                      <span className="formula-product-icon"><Icon size={18} strokeWidth={1.8} /></span>
                      <span className="formula-product-copy">
                        <strong>{item.name}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <b>+{euro(item.price)}</b>
                      <i aria-hidden="true">{selected && <Check size={12} />}</i>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className={`formula-dialog-footer ${complete ? "complete" : ""}`}>
          <div>
            <span>{complete ? "Formule complète" : "Compose à ton rythme"}</span>
            <strong>{complete ? `${euro(COMBO_DISCOUNT)} économisé` : "Tout reste facultatif"}</strong>
          </div>
          <button type="button" onClick={() => onOpenChange(false)}>
            {complete ? "Ajouter la formule" : "Terminer"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
