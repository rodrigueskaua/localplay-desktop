import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { progress } from "../db/schema.js";
import { getActiveLibrary } from "./settings.service.js";

function toRow(r) {
  return {
    video_id:     r.videoId,
    current_time: r.currentTime,
    duration:     r.duration,
    completed:    r.completed,
  };
}

function requireActiveLibraryId() {
  const library = getActiveLibrary();
  if (!library) throw new Error("Nenhuma biblioteca ativa configurada.");
  return library.id;
}

export function findAll() {
  const libraryId = requireActiveLibraryId();
  return db
    .select()
    .from(progress)
    .where(eq(progress.libraryId, libraryId))
    .all()
    .map(toRow);
}

export function findByVideoId(videoId) {
  const libraryId = requireActiveLibraryId();
  const [row] = db
    .select()
    .from(progress)
    .where(and(eq(progress.libraryId, libraryId), eq(progress.videoId, videoId)))
    .all();
  return row ? toRow(row) : null;
}

export function upsert(videoId, currentTime, duration, completed) {
  const libraryId = requireActiveLibraryId();
  db.insert(progress)
    .values({ libraryId, videoId, currentTime, duration, completed })
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
