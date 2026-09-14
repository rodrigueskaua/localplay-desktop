import { eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { progress } from "../db/schema.js";
import { parseVideoId } from "./library.service.js";

function toRow(r) {
  return {
    video_id:     r.videoId,
    current_time: r.currentTime,
    duration:     r.duration,
    completed:    r.completed,
  };
}

export function findAll() {
  return db.select().from(progress).all().map(toRow);
}

export function findByVideoId(videoId) {
  const [row] = db.select().from(progress).where(eq(progress.videoId, videoId)).all();
  return row ? toRow(row) : null;
}

export function upsert(videoId, currentTime, duration, completed) {
  const parsed = parseVideoId(videoId);
  if (!parsed) throw new Error("Id de vídeo inválido.");

  db.insert(progress)
    .values({ libraryId: parsed.libraryId, videoId, currentTime, duration, completed })
    .onConflictDoUpdate({
      target: [progress.libraryId, progress.videoId],
      set: {
        currentTime,
        duration,
        completed,
        updatedAt: sql`(datetime('now'))`,
      },
    })
    .run();
}
