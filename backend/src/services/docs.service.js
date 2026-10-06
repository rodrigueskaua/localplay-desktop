import { readFileSync, statSync, existsSync } from "fs";
import { resolve, extname } from "path";
import { DOC_EXTENSIONS, MAX_DOC_SIZE } from "../config.js";
import { resolveVideoPath } from "./library.service.js";

export function readDoc(docId) {
  const parsed = resolveVideoPath(docId);
  if (!parsed) return { error: "not_found" };

  const root = resolve(parsed.videosDir);
  const docPath = resolve(root, parsed.relativePath);

  if (!docPath.startsWith(root + "/")) return { error: "forbidden" };
  if (!DOC_EXTENSIONS.has(extname(docPath).toLowerCase())) return { error: "forbidden" };
  if (!existsSync(docPath) || !statSync(docPath).isFile()) return { error: "not_found" };
  if (statSync(docPath).size > MAX_DOC_SIZE) return { error: "too_large" };

  return { conteudo: readFileSync(docPath, "utf8"), tipo: extname(docPath).toLowerCase() };
}
