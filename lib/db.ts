import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { warnIfUnsafeProduction } from "./config";
import { migrate } from "./schema";
import { seedIfEmpty } from "./seed";

const globalForDb = globalThis as unknown as { __tujiDb?: DatabaseSync };

function sleep(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function openDatabase() {
  const dir = process.env.TUJI_DATA_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "tuji.sqlite"));
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      migrate(db);
      seedIfEmpty(db);
      warnIfUnsafeProduction();
      return db;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("locked") || attempt === 7) throw error;
      sleep(40 * (attempt + 1));
    }
  }
  throw lastError;
}

export const db = globalForDb.__tujiDb ?? openDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__tujiDb = db;
}
