import { streamVideo } from "../controllers/video.controller.js";

export async function videoRoutes(fastify) {
  fastify.get("/video/*", streamVideo);
}
