import { getDoc } from "../controllers/docs.controller.js";

export async function docsRoutes(fastify) {
  fastify.get("/doc/*", getDoc);
}
