import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { eq, desc } from "drizzle-orm";
import { db } from "../db/index.js";
import { libraries, settings } from "../db/schema.js";

const ACTIVE_LIBRARY_KEY = "active_library_id";

let activeLibraryPath = null;

export function getActiveLibraryPath() {
  return activeLibraryPath;
}

export function listLibraries() {
  return db.select().from(libraries).orderBy(desc(libraries.lastUsedAt)).all();
}

export function getActiveLibrary() {
  const row = db.select().from(settings).where(eq(settings.key, ACTIVE_LIBRARY_KEY)).get();
  if (!row?.value) return null;

  const library = db
    .select()
    .from(libraries)
    .where(eq(libraries.id, Number(row.value)))
    .get();
  return library ?? null;
}

function assertValidDirectory(path) {
  const resolved = resolve(path);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    throw new Error("O caminho informado não é uma pasta válida.");
  }
  return resolved;
}

export function setActiveLibrary(path, name = null) {
  const resolved = assertValidDirectory(path);

  let library = db.select().from(libraries).where(eq(libraries.path, resolved)).get();

  if (library) {
    db.update(libraries)
      .set({ lastUsedAt: new Date().toISOString() })
      .where(eq(libraries.id, library.id))
      .run();
  } else {
    library = db.insert(libraries).values({ path: resolved, name }).returning().get();
  }

  db.insert(settings)
    .values({ key: ACTIVE_LIBRARY_KEY, value: String(library.id) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: String(library.id) },
    })
    .run();

  activeLibraryPath = library.path;
  return library;
}

export function removeLibrary(libraryId) {
  const active = getActiveLibrary();
  db.delete(libraries).where(eq(libraries.id, libraryId)).run();

  if (active?.id === libraryId) {
    activeLibraryPath = null;
    db.delete(settings).where(eq(settings.key, ACTIVE_LIBRARY_KEY)).run();
  }
}

export function loadActiveLibraryFromDb() {
  const library = getActiveLibrary();
  activeLibraryPath = library && existsSync(library.path) ? library.path : null;
  return activeLibraryPath;
}
