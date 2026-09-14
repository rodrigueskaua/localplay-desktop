import { readdirSync, statSync, existsSync } from "fs";
import { join, relative, extname, basename } from "path";
import { COVERS_DIR, VIDEO_EXTENSIONS } from "../config.js";
import { getActiveLibraryPath } from "./settings.service.js";

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

function toVideoId(videosDir, filePath) {
  return relative(videosDir, filePath).replace(/\\/g, "/");
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

const MAX_SCAN_DEPTH = 8;

function firstVideoIn(videosDir, dir, depth = 0) {
  if (depth > MAX_SCAN_DEPTH) return null;

  for (const entry of readdirSync(dir).sort(naturalSort)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isFile() && isVideoFile(entry)) return toVideoId(videosDir, full);
    if (stat.isDirectory()) {
      const found = firstVideoIn(videosDir, full, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function scanModulo(videosDir, dir) {
  const entries = readdirSync(dir).sort(naturalSort);

  const videosDirectos = entries.filter(
    (f) => statSync(join(dir, f)).isFile() && isVideoFile(f)
  );

  if (videosDirectos.length > 0) {
    return videosDirectos.map((f) => {
      const full = join(dir, f);
      const id = toVideoId(videosDir, full);
      return { id, nome: basename(f, extname(f)), arquivo: id };
    });
  }

  const aulas = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (!stat.isDirectory()) continue;

    const videoId = firstVideoIn(videosDir, full);
    if (videoId) {
      aulas.push({ id: videoId, nome: entry, arquivo: videoId });
    }
  }
  return aulas;
}

function scanCursoPasta(videosDir, cursoName, cursoPath) {
  const entries = readdirSync(cursoPath).sort(naturalSort);
  const modulos = [];
  const aulasRaiz = [];

  for (const entry of entries) {
    const fullPath = join(cursoPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const aulas = scanModulo(videosDir, fullPath);
      if (aulas.length) modulos.push({ nome: entry, aulas });
    } else if (stat.isFile() && isVideoFile(entry)) {
      const id = toVideoId(videosDir, fullPath);
      aulasRaiz.push({ id, nome: basename(entry, extname(entry)), arquivo: id });
    }
  }

  if (!modulos.length && aulasRaiz.length) modulos.push({ nome: "Aulas", aulas: aulasRaiz });
  else if (aulasRaiz.length) modulos.unshift({ nome: "Introdução", aulas: aulasRaiz });

  if (!modulos.length) return null;

  const cover = findCover(cursoName);
  const firstVideo = modulos[0]?.aulas[0]?.id ?? null;

  return { id: cursoName, nome: cursoName, cover, firstVideo, modulos };
}

const VIDEOS_SOLTOS_ID = "__videos_soltos__";

function scanVideosSoltos(videosDir, entries) {
  const aulas = entries
    .filter((name) => statSync(join(videosDir, name)).isFile() && isVideoFile(name))
    .sort(naturalSort)
    .map((name) => {
      const fullPath = join(videosDir, name);
      const id = toVideoId(videosDir, fullPath);
      return { id, nome: basename(name, extname(name)), arquivo: id };
    });

  if (!aulas.length) return null;

  return {
    id: VIDEOS_SOLTOS_ID,
    nome: "Vídeos soltos",
    cover: findCover(VIDEOS_SOLTOS_ID),
    firstVideo: aulas[0].id,
    modulos: [{ nome: "Vídeos", aulas }],
  };
}

export function getLibrary() {
  const videosDir = getActiveLibraryPath();
  if (!videosDir || !existsSync(videosDir)) return [];

  const entries = readdirSync(videosDir).sort(naturalSort);

  const cursos = entries
    .filter((name) => statSync(join(videosDir, name)).isDirectory())
    .flatMap((cursoName) => {
      try {
        const curso = scanCursoPasta(videosDir, cursoName, join(videosDir, cursoName));
        return curso ? [curso] : [];
      } catch {
        return [];
      }
    });

  const videosSoltos = scanVideosSoltos(videosDir, entries);
  return videosSoltos ? [...cursos, videosSoltos] : cursos;
}
