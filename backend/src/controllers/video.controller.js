import { resolveVideo, streamFull, streamRange } from "../services/video.service.js";

export function streamVideo(req, reply) {
  const { error, videoPath, size, mimeType } = resolveVideo(req.params["*"]);

  if (error === "forbidden") return reply.code(403).send({ error: "Acesso negado" });
  if (error === "not_found") return reply.code(404).send({ error: "Vídeo não encontrado" });

  const rangeHeader = req.headers.range;
  const result = rangeHeader
    ? streamRange(videoPath, size, mimeType, rangeHeader)
    : streamFull(videoPath, size, mimeType);

  if (result.error === "invalid_range") {
    return reply.code(416).send({ error: "Range inválido" });
  }

  reply.code(result.status).headers(result.headers);
  return reply.send(result.stream);
}
