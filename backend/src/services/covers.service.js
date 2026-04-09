import { unlinkSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { COVERS_DIR, COVER_EXTENSIONS } from "../config.js";

export function saveCover(cursoNome, ext, buffer) {
  for (const oldExt of COVER_EXTENSIONS) {
    const old = join(COVERS_DIR, `${cursoNome}${oldExt}`);
    if (existsSync(old)) unlinkSync(old);
  }

  writeFileSync(join(COVERS_DIR, `${cursoNome}${ext}`), buffer);

  return `/covers/${cursoNome}${ext}`;
}
