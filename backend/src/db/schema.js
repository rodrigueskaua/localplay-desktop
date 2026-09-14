import { sqliteTable, text, real, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const libraries = sqliteTable("libraries", {
  id:         integer("id").primaryKey({ autoIncrement: true }),
  path:       text("path").notNull().unique(),
  name:       text("name"),
  createdAt:  text("created_at").default(sql`(datetime('now'))`).notNull(),
  lastUsedAt: text("last_used_at").default(sql`(datetime('now'))`).notNull(),
});

export const progress = sqliteTable(
  "progress",
  {
    libraryId:   integer("library_id").notNull().references(() => libraries.id, { onDelete: "cascade" }),
    videoId:     text("video_id").notNull(),
    currentTime: real("current_time").default(0).notNull(),
    duration:    real("duration").default(0).notNull(),
    completed:   integer("completed", { mode: "boolean" }).default(false).notNull(),
    updatedAt:   text("updated_at").default(sql`(datetime('now'))`).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.libraryId, table.videoId] }),
  })
);
