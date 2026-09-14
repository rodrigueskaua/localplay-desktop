import { unlinkSync, existsSync, writeFileSync } from "fs";
import { join, resolve, basename } from "path";
import { COVERS_DIR, COVER_EXTENSIONS } from "../config.js";

function sanitizeCursoNome(cursoNome) {
  const safe = basename(String(cursoNome ?? ""));
  if (!safe || safe === "." || safe === "..") {
    throw new Error("Nome de curso inválido.");
  }
  return safe;
}

export function saveCover(cursoNome, ext, buffer) {
  const safeName = sanitizeCursoNome(cursoNome);
  const coversRoot = resolve(COVERS_DIR);

  for (const oldExt of COVER_EXTENSIONS) {
    const old = resolve(coversRoot, `${safeName}${oldExt}`);
    if (!old.startsWith(coversRoot + "/")) continue;
    if (existsSync(old)) unlinkSync(old);
  }

  const target = resolve(coversRoot, `${safeName}${ext}`);
  if (!target.startsWith(coversRoot + "/")) {
    throw new Error("Caminho de capa inválido.");
  }

  writeFileSync(target, buffer);

  return `/covers/${safeName}${ext}`;
}
