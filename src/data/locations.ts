export type PickupLocation = {
  id: string;
  name: string;
  dayLabel: string;
  hours: string;
  pickupLabel: string;
  note: string;
  slots: string[];
  acceptingOrders: boolean;
  slotCapacity: number;
};

export const locations: PickupLocation[] = [
  {
    id: "lycee-jean-moulin",
    name: "Lycée Jean-Moulin",
    dayLabel: "Aujourd’hui",
    hours: "11:30–14:00",
    pickupLabel: "Portail principal",
    note: "Le spot du mardi",
    slots: ["12:15", "12:30", "12:45", "13:00"],
    acceptingOrders: true,
    slotCapacity: 8,
  },
  {
    id: "campus-saint-charles",
    name: "Campus Saint-Charles",
    dayLabel: "Demain",
    hours: "11:45–14:15",
    pickupLabel: "Parvis de la bibliothèque",
    note: "Le spot du mercredi",
    slots: ["12:00", "12:20", "12:40", "13:00"],
    acceptingOrders: true,
    slotCapacity: 8,
  },
  {
    id: "iut-joliette",
    name: "IUT Joliette",
    dayLabel: "Vendredi",
    hours: "11:30–13:45",
    pickupLabel: "Entrée côté quai",
    note: "Le spot du vendredi",
    slots: ["11:50", "12:10", "12:30", "12:50"],
    acceptingOrders: false,
    slotCapacity: 8,
  },
];

export function parseSelectedLocationId(value: string | null) {
  return locations.some((location) => location.id === value)
    ? value as string
    : locations[0].id;
}
