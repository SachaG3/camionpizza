"use client";

import { Check, Clock3, MapPin, Navigation } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { locations } from "@/data/locations";

export function LocationDialog({
  open,
  onOpenChange,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="location-dialog">
        <DialogHeader className="location-header">
          <span className="location-illustration"><Navigation size={23} /></span>
          <p className="composer-kicker">La tournée de la semaine</p>
          <DialogTitle>Où passe le camion ?</DialogTitle>
          <DialogDescription>
            Choisis ton campus maintenant, ton créneau juste avant de commander.
          </DialogDescription>
        </DialogHeader>

        <div className="location-list" role="radiogroup" aria-label="Point de retrait">
          {locations.map((location, index) => {
            const selected = location.id === selectedId;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                aria-disabled={!location.acceptingOrders}
                disabled={!location.acceptingOrders}
                className={`location-option ${selected ? "selected" : ""} ${!location.acceptingOrders ? "closed" : ""}`}
                key={location.id}
                onClick={() => onSelect(location.id)}
              >
                <span className="route-marker">
                  <i>{selected ? <Check size={14} /> : index + 1}</i>
                </span>
                <span className="location-option-copy">
                  <span className="location-day">{location.acceptingOrders ? location.dayLabel : "Commandes closes"}</span>
                  <strong>{location.name}</strong>
                  <small><MapPin size={12} /> {location.pickupLabel}</small>
                </span>
                <span className="location-hours"><Clock3 size={13} /> {location.hours}</span>
              </button>
            );
          })}
        </div>

        <div className="location-footnote">
          <span>Four allumé</span>
          <p>Les horaires sont ceux de la démonstration du projet.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
