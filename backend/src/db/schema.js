import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const progress = sqliteTable("progress", {
  videoId:     text("video_id").primaryKey(),
  currentTime: real("current_time").default(0).notNull(),
  duration:    real("duration").default(0).notNull(),
  completed:   integer("completed", { mode: "boolean" }).default(false).notNull(),
  updatedAt:   text("updated_at").default(sql`(datetime('now'))`).notNull(),
});
