import { verificarAtualizacao } from "../services/update.service.js";

export async function updateRoutes(fastify) {
  fastify.get("/update", async (req, reply) => {
    try {
      return reply.send(await verificarAtualizacao());
    } catch (err) {
      req.log.error(err);
      return reply.code(500).send({ error: "Não foi possível verificar atualizações." });
    }
  });
}
