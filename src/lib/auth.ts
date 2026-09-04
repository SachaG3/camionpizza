import { cookies } from "next/headers";

import { loyaltyStore, SESSION_COOKIE } from "./loyalty";

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? loyaltyStore.getUserByToken(token) : null;
}

export async function requireAdmin() {
  const user = await currentUser();
  return user?.role === "admin" ? user : null;
}
