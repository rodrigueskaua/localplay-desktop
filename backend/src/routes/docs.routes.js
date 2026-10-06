import { getDoc, getAnexoPath } from "../controllers/docs.controller.js";

export async function docsRoutes(fastify) {
  fastify.get("/doc/*", getDoc);
  fastify.get("/anexo/*", getAnexoPath);
}
