import { NextResponse } from "next/server";

import { locations } from "@/data/locations";
import { orderStore } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    estimateMinutes: orderStore.estimateMinutes(),
    locations: locations.map((location) => ({
      id: location.id,
      acceptingOrders: location.acceptingOrders,
      slots: Object.fromEntries(location.slots.map((time) => [time, orderStore.slotAvailability(location.name, time, location.slotCapacity)])),
    })),
  }, { headers: { "cache-control": "no-store" } });
}
