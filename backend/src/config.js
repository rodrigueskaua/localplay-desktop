import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_DIR = resolve(__dirname, "..");

export const VIDEOS_DIR = process.env.VIDEOS_DIR ?? resolve(BASE_DIR, "..", "videos");
export const COVERS_DIR = process.env.COVERS_DIR ?? join(BASE_DIR, "covers");
export const DB_PATH    = process.env.DB_PATH    ?? join(BASE_DIR, "progress.db");
export const PORT       = parseInt(process.env.PORT ?? "8000", 10);

export const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"]);
export const COVER_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
