import { getLibrary } from "../services/library.service.js";

export function listCourses(req, reply) {
  try {
    return reply.send(getLibrary());
  } catch (err) {
    req.log.error(err);
    return reply.code(500).send({ error: "Não foi possível ler a biblioteca de vídeos." });
  }
}
