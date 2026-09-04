import { redirect } from "next/navigation";

import { AdminOrders } from "@/components/admin-orders";
import { requireAdmin } from "@/lib/auth";
import { orderStore } from "@/lib/orders";
import { database } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!await requireAdmin()) redirect("/");
  return <AdminOrders initialOrders={await orderStore.listAll()} initialOutbox={database.listOutbox()} />;
}
