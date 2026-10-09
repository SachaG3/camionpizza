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
    id: "iut-mulhouse-illberg",
    name: "IUT de Mulhouse",
    dayLabel: "Lundi · Mardi · Jeudi",
    hours: "11:30–14:00",
    pickupLabel: "Campus Illberg, devant l’entrée principale",
    note: "Campus Illberg",
    slots: ["11:45", "12:00", "12:15", "12:30", "12:45", "13:00"],
    acceptingOrders: true,
    slotCapacity: 8,
  },
  {
    id: "la-fonderie",
    name: "La Fonderie",
    dayLabel: "Mercredi · Vendredi",
    hours: "11:45–14:15",
    pickupLabel: "Parvis de La Fonderie",
    note: "Campus Fonderie",
    slots: ["12:00", "12:15", "12:30", "12:45", "13:00", "13:15"],
    acceptingOrders: true,
    slotCapacity: 8,
  },
];

export function parseSelectedLocationId(value: string | null) {
  return locations.some((location) => location.id === value)
    ? value as string
    : locations[0].id;
}
