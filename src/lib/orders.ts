import { join } from "node:path";

import { OrderStore } from "./order-store";

export const orderStore = new OrderStore(
  join(process.env.FOURCHETTE_DATA_DIR ?? join(process.cwd(), ".data"), "orders.json"),
);
