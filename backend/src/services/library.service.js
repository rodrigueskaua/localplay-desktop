import { readdirSync, statSync, existsSync } from "fs";
import { join, relative, extname, basename } from "path";
import { VIDEOS_DIR, COVERS_DIR, VIDEO_EXTENSIONS } from "../config.js";

function naturalSortKey(name) {
  return name.split(/(\d+)/).map((p) => (/^\d+$/.test(p) ? parseInt(p, 10) : p.toLowerCase()));
}

function naturalSort(a, b) {
  const ka = naturalSortKey(a);
  const kb = naturalSortKey(b);
  for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
    const ai = ka[i] ?? "";
    const bi = kb[i] ?? "";
    if (ai < bi) return -1;
    if (ai > bi) return 1;
  }
  return 0;
}

function toVideoId(filePath) {
  return relative(VIDEOS_DIR, filePath).replace(/\\/g, "/");
}

function findCover(cursoNome) {
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    if (existsSync(join(COVERS_DIR, `${cursoNome}${ext}`))) {
      return `/covers/${cursoNome}${ext}`;
    }
  }
  return null;
}

function isVideoFile(name) {
  return VIDEO_EXTENSIONS.has(extname(name).toLowerCase());
}

function firstVideoIn(dir) {
  for (const entry of readdirSync(dir).sort(naturalSort)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isFile() && isVideoFile(entry)) return toVideoId(full);
    if (stat.isDirectory()) {
      const found = firstVideoIn(full);
      if (found) return found;
    }
  }
  return null;
}

function scanModulo(dir) {
  const entries = readdirSync(dir).sort(naturalSort);

  const videosDirectos = entries.filter(
    (f) => statSync(join(dir, f)).isFile() && isVideoFile(f)
  );

  if (videosDirectos.length > 0) {
    return videosDirectos.map((f) => {
      const full = join(dir, f);
      return { id: toVideoId(full), nome: basename(f, extname(f)), arquivo: toVideoId(full) };
    });
  }

  const aulas = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (!stat.isDirectory()) continue;

    const videoId = firstVideoIn(full);
    if (videoId) {
      aulas.push({ id: videoId, nome: entry, arquivo: videoId });
    }
  }
  return aulas;
}

export function getLibrary() {
  if (!existsSync(VIDEOS_DIR)) return [];

  return readdirSync(VIDEOS_DIR)
    .sort(naturalSort)
    .filter((name) => statSync(join(VIDEOS_DIR, name)).isDirectory())
    .flatMap((cursoName) => {
      const cursoPath = join(VIDEOS_DIR, cursoName);
      const entries = readdirSync(cursoPath).sort(naturalSort);
      const modulos = [];
      const aulasRaiz = [];

      for (const entry of entries) {
        const fullPath = join(cursoPath, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          const aulas = scanModulo(fullPath);
          if (aulas.length) modulos.push({ nome: entry, aulas });
        } else if (stat.isFile() && isVideoFile(entry)) {
          const id = toVideoId(fullPath);
          aulasRaiz.push({ id, nome: basename(entry, extname(entry)), arquivo: id });
        }
      }

      if (!modulos.length && aulasRaiz.length) modulos.push({ nome: "Aulas", aulas: aulasRaiz });
      else if (aulasRaiz.length) modulos.unshift({ nome: "Introdução", aulas: aulasRaiz });

      if (!modulos.length) return [];

      const cover = findCover(cursoName);
      const firstVideo = modulos[0]?.aulas[0]?.id ?? null;

      return [{ id: cursoName, nome: cursoName, cover, firstVideo, modulos }];
    });
}
