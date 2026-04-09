import { uploadCover } from "../controllers/covers.controller.js";

export async function coversRoutes(fastify) {
  fastify.post("/cover/:cursoNome", uploadCover);
}
