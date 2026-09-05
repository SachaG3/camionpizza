import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { AdminCampus } from "@/components/admin-campus";
export const dynamic = "force-dynamic";
export default async function Page() { if (!await requireAdmin()) redirect("/"); return <AdminCampus />; }
