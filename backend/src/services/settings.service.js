import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { libraries } from "../db/schema.js";

export function listLibraries() {
  return db.select().from(libraries).orderBy(desc(libraries.lastUsedAt)).all();
}

export function getLibraryById(libraryId) {
  return db.select().from(libraries).where(eq(libraries.id, libraryId)).get() ?? null;
}

function assertValidDirectory(path) {
  const resolved = resolve(path);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    throw new Error("O caminho informado não é uma pasta válida.");
  }
  return resolved;
}

export function addLibrary(path, name = null) {
  const resolved = assertValidDirectory(path);

  const existing = db.select().from(libraries).where(eq(libraries.path, resolved)).get();
  if (existing) {
    db.update(libraries)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(libraries.id, existing.id))
      .run();
    return existing;
  }

  return db.insert(libraries).values({ path: resolved, name }).returning().get();
}

export function removeLibrary(libraryId) {
  db.delete(libraries).where(eq(libraries.id, libraryId)).run();
}
