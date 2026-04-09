import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";
import { DB_PATH } from "../config.js";

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });

export function initDb() {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS progress (
      video_id     TEXT PRIMARY KEY,
      current_time REAL    NOT NULL DEFAULT 0,
      duration     REAL    NOT NULL DEFAULT 0,
      completed    INTEGER NOT NULL DEFAULT 0,
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
