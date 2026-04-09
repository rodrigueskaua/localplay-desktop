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

function buildAula(filePath) {
  const id = toVideoId(filePath);
  return { id, nome: basename(filePath, extname(filePath)), arquivo: id };
}

function scanModulo(dir) {
  return readdirSync(dir)
    .sort(naturalSort)
    .filter((f) => VIDEO_EXTENSIONS.has(extname(f).toLowerCase()))
    .map((f) => buildAula(join(dir, f)));
}

export function getLibrary() {
  if (!existsSync(VIDEOS_DIR)) return [];

  return readdirSync(VIDEOS_DIR)
    .sort(naturalSort)
    .filter((name) => statSync(join(VIDEOS_DIR, name)).isDirectory())
    .flatMap((cursoName) => {
      const cursoPath = join(VIDEOS_DIR, cursoName);
      const modulos = [];
      const aulasRaiz = [];

      for (const entry of readdirSync(cursoPath).sort(naturalSort)) {
        const fullPath = join(cursoPath, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          const aulas = scanModulo(fullPath);
          if (aulas.length) modulos.push({ nome: entry, aulas });
        } else if (stat.isFile() && VIDEO_EXTENSIONS.has(extname(entry).toLowerCase())) {
          aulasRaiz.push(buildAula(fullPath));
        }
      }

      if (!modulos.length && aulasRaiz.length) modulos.push({ nome: "Aulas", aulas: aulasRaiz });
      else if (aulasRaiz.length) modulos.unshift({ nome: "Introdução", aulas: aulasRaiz });

      if (!modulos.length) return [];

      return [{ id: cursoName, nome: cursoName, cover: findCover(cursoName), modulos }];
    });
}
