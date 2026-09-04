import { join } from "node:path";

import { LoyaltyStore } from "./loyalty-store";

export const loyaltyStore = new LoyaltyStore(
  join(process.env.FOURCHETTE_DATA_DIR ?? join(process.cwd(), ".data"), "accounts.json"),
);

export const SESSION_COOKIE = "fourchette-session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60;
