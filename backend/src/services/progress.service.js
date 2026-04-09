import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { progress } from "../db/schema.js";

export function findAll() {
  return db.select().from(progress);
}

export function findByVideoId(videoId) {
  const [row] = db.select().from(progress).where(eq(progress.videoId, videoId));
  return row ?? null;
}

export function upsert(videoId, currentTime, duration, completed) {
  db.insert(progress)
    .values({ videoId, currentTime, duration, completed })
    .onConflictDoUpdate({
      target: progress.videoId,
      set: {
        currentTime,
        duration,
        completed,
        updatedAt: sql`(datetime('now'))`,
      },
    })
    .run();
}
