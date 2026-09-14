import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";
import { DB_PATH } from "../config.js";

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function initDb() {
  db.run(sql`
    CREATE TABLE IF NOT EXISTS libraries (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      path          TEXT    NOT NULL UNIQUE,
      name          TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      last_used_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.run(sql`
    CREATE TABLE IF NOT EXISTS progress (
      library_id   INTEGER NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
      video_id     TEXT    NOT NULL,
      current_time REAL    NOT NULL DEFAULT 0,
      duration     REAL    NOT NULL DEFAULT 0,
      completed    INTEGER NOT NULL DEFAULT 0,
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (library_id, video_id)
    )
  `);
}
