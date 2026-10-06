import { readDoc, resolveAnexo } from "../services/docs.service.js";

const STATUS = { not_found: 404, forbidden: 403, too_large: 413 };

const MENSAGENS = {
  not_found: "Material não encontrado.",
  forbidden: "Acesso não permitido.",
  too_large: "O arquivo é grande demais para ser exibido.",
};

export function getDoc(req, reply) {
  try {
    const docId = Array.isArray(req.params["*"]) ? req.params["*"].join("/") : req.params["*"];
    const result = readDoc(decodeURIComponent(docId));

    if (result.error) {
      return reply.code(STATUS[result.error] ?? 400).send({ error: MENSAGENS[result.error] });
    }
    return reply.send(result);
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: "Não foi possível ler o material." });
  }
}

export function getAnexoPath(req, reply) {
  try {
    const fileId = Array.isArray(req.params["*"]) ? req.params["*"].join("/") : req.params["*"];
    const result = resolveAnexo(decodeURIComponent(fileId));

    if (result.error) {
      return reply.code(STATUS[result.error] ?? 400).send({ error: MENSAGENS[result.error] });
    }
    return reply.send(result);
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: "Não foi possível localizar o arquivo." });
  }
}
