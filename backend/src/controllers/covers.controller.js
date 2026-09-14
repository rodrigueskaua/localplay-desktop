import { extname } from "path";
import { COVER_EXTENSIONS } from "../config.js";
import { saveCover } from "../services/covers.service.js";

export async function uploadCover(req, reply) {
  const { cursoNome } = req.params;
  const data = await req.file();

  if (!data) {
    return reply.code(400).send({ error: "Nenhum arquivo enviado" });
  }

  const ext = extname(data.filename).toLowerCase();
  if (!COVER_EXTENSIONS.has(ext)) {
    return reply.code(400).send({ error: "Formato não suportado. Use jpg, png ou webp." });
  }

  try {
    const cover = saveCover(cursoNome, ext, await data.toBuffer());
    return reply.send({ cover });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}
