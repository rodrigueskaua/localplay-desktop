import { readdirSync, statSync, existsSync } from "fs";
import { join, relative, extname, basename } from "path";
import { COVERS_DIR, VIDEO_EXTENSIONS, DOC_EXTENSIONS } from "../config.js";
import { listLibraries } from "./settings.service.js";

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

export function makeVideoId(libraryId, relativePath) {
  return `${libraryId}::${relativePath.replace(/\\/g, "/")}`;
}

export function parseVideoId(videoId) {
  const sep = videoId.indexOf("::");
  if (sep === -1) return null;
  const libraryId = Number(videoId.slice(0, sep));
  const relativePath = videoId.slice(sep + 2);
  if (!Number.isInteger(libraryId) || !relativePath) return null;
  return { libraryId, relativePath };
}

function toVideoId(libraryId, videosDir, filePath) {
  return makeVideoId(libraryId, relative(videosDir, filePath));
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

function isDocFile(name) {
  return DOC_EXTENSIONS.has(extname(name).toLowerCase());
}

function toDoc(libraryId, videosDir, dir, name) {
  const id = makeVideoId(libraryId, relative(videosDir, join(dir, name)));
  return { id, nome: basename(name, extname(name)), tipo: extname(name).toLowerCase() };
}

function collectDocs(libraryId, videosDir, dir, entries) {
  const docNames = entries.filter((f) => {
    try {
      return statSync(join(dir, f)).isFile() && isDocFile(f);
    } catch {
      return false;
    }
  });

  if (!docNames.length) return { gerais: [], porAula: new Map() };

  const videoBases = new Set(
    entries
      .filter((f) => {
        try {
          return statSync(join(dir, f)).isFile() && isVideoFile(f);
        } catch {
          return false;
        }
      })
      .map((f) => basename(f, extname(f)).toLowerCase())
  );

  const gerais = [];
  const porAula = new Map();

  for (const name of docNames) {
    const base = basename(name, extname(name)).toLowerCase();
    const doc = toDoc(libraryId, videosDir, dir, name);
    if (videoBases.has(base)) {
      if (!porAula.has(base)) porAula.set(base, []);
      porAula.get(base).push(doc);
    } else {
      gerais.push(doc);
    }
  }

  return { gerais, porAula };
}

function docsDaAula(porAula, fileName) {
  return porAula.get(basename(fileName, extname(fileName)).toLowerCase()) ?? [];
}

const MAX_SCAN_DEPTH = 8;

function firstVideoIn(libraryId, videosDir, dir, depth = 0) {
  if (depth > MAX_SCAN_DEPTH) return null;

  for (const entry of readdirSync(dir).sort(naturalSort)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isFile() && isVideoFile(entry)) return toVideoId(libraryId, videosDir, full);
    if (stat.isDirectory()) {
      const found = firstVideoIn(libraryId, videosDir, full, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

function scanModulo(libraryId, videosDir, dir) {
  const entries = readdirSync(dir).sort(naturalSort);
  const { gerais, porAula } = collectDocs(libraryId, videosDir, dir, entries);

  const videosDirectos = entries.filter(
    (f) => statSync(join(dir, f)).isFile() && isVideoFile(f)
  );

  if (videosDirectos.length > 0) {
    const aulas = videosDirectos.map((f) => {
      const full = join(dir, f);
      const id = toVideoId(libraryId, videosDir, full);
      return { id, nome: basename(f, extname(f)), arquivo: id, docs: docsDaAula(porAula, f) };
    });
    return { aulas, docs: gerais };
  }

  const aulas = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (!stat.isDirectory()) continue;

    const videoId = firstVideoIn(libraryId, videosDir, full);
    if (videoId) {
      const subEntries = readdirSync(full).sort(naturalSort);
      const sub = collectDocs(libraryId, videosDir, full, subEntries);
      aulas.push({
        id: videoId,
        nome: entry,
        arquivo: videoId,
        docs: [...sub.gerais, ...docsDaAula(sub.porAula, basename(videoId))],
      });
    }
  }
  return { aulas, docs: gerais };
}

function scanCursoPasta(libraryId, videosDir, cursoName, cursoPath, idPrefix) {
  const entries = readdirSync(cursoPath).sort(naturalSort);
  const { gerais: docsCurso, porAula } = collectDocs(libraryId, videosDir, cursoPath, entries);
  const modulos = [];
  const aulasRaiz = [];

  for (const entry of entries) {
    const fullPath = join(cursoPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      const { aulas, docs } = scanModulo(libraryId, videosDir, fullPath);
      if (aulas.length) modulos.push({ nome: entry, aulas, docs });
    } else if (stat.isFile() && isVideoFile(entry)) {
      const id = toVideoId(libraryId, videosDir, fullPath);
      aulasRaiz.push({
        id,
        nome: basename(entry, extname(entry)),
        arquivo: id,
        docs: docsDaAula(porAula, entry),
      });
    }
  }

  if (!modulos.length && aulasRaiz.length) modulos.push({ nome: "Aulas", aulas: aulasRaiz, docs: [] });
  else if (aulasRaiz.length) modulos.unshift({ nome: "Introdução", aulas: aulasRaiz, docs: [] });

  if (!modulos.length) return null;

  const cover = findCover(`${idPrefix}${cursoName}`);
  const firstVideo = modulos[0]?.aulas[0]?.id ?? null;

  return { id: `${idPrefix}${cursoName}`, nome: cursoName, cover, firstVideo, modulos, docs: docsCurso };
}

function scanVideosSoltos(libraryId, videosDir, entries, idPrefix) {
  const { porAula } = collectDocs(libraryId, videosDir, videosDir, entries);

  const aulas = entries
    .filter((name) => statSync(join(videosDir, name)).isFile() && isVideoFile(name))
    .sort(naturalSort)
    .map((name) => {
      const fullPath = join(videosDir, name);
      const id = toVideoId(libraryId, videosDir, fullPath);
      return { id, nome: basename(name, extname(name)), arquivo: id, docs: docsDaAula(porAula, name) };
    });

  if (!aulas.length) return null;

  const cursoId = `${idPrefix}__videos_soltos__`;
  return {
    id: cursoId,
    nome: "Vídeos soltos",
    cover: findCover(cursoId),
    firstVideo: aulas[0].id,
    modulos: [{ nome: "Vídeos", aulas, docs: [] }],
    docs: [],
  };
}

function scanOneLibrary(library) {
  const videosDir = library.path;
  if (!existsSync(videosDir)) return [];

  const idPrefix = `${library.id}::`;
  const entries = readdirSync(videosDir).sort(naturalSort);

  const cursos = entries
    .filter((name) => statSync(join(videosDir, name)).isDirectory())
    .flatMap((cursoName) => {
      try {
        const curso = scanCursoPasta(library.id, videosDir, cursoName, join(videosDir, cursoName), idPrefix);
        return curso ? [curso] : [];
      } catch {
        return [];
      }
    });

  const videosSoltos = scanVideosSoltos(library.id, videosDir, entries, idPrefix);
  return videosSoltos ? [...cursos, videosSoltos] : cursos;
}

export function getLibrary() {
  return listLibraries().flatMap(scanOneLibrary);
}

export function resolveVideoPath(videoId) {
  const parsed = parseVideoId(videoId);
  if (!parsed) return null;

  const library = listLibraries().find((l) => l.id === parsed.libraryId);
  if (!library) return null;

  return { videosDir: library.path, relativePath: parsed.relativePath };
}
