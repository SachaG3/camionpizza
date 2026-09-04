import { join } from "node:path";

import { FourchetteDatabase } from "./database";

const dataDir = process.env.FOURCHETTE_DATA_DIR ?? join(process.cwd(), ".data");

declare global {
  var fourchetteDatabase: FourchetteDatabase | undefined;
}

export const database = globalThis.fourchetteDatabase ?? new FourchetteDatabase(join(dataDir, "fourchette.db"), dataDir);
if (process.env.NODE_ENV !== "production") globalThis.fourchetteDatabase = database;
