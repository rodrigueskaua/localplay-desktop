import { listCourses } from "../controllers/library.controller.js";

export async function libraryRoutes(fastify) {
  fastify.get("/library", listCourses);
}
