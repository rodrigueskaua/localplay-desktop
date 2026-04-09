import { listProgress, getProgress, saveProgress } from "../controllers/progress.controller.js";

export async function progressRoutes(fastify) {
  fastify.get("/progress",    listProgress);
  fastify.get("/progress/*",  getProgress);
  fastify.post("/progress/*", saveProgress);
}
