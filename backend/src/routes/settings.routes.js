import { getSettings, createLibrary, deleteLibrary } from "../controllers/settings.controller.js";

export async function settingsRoutes(fastify) {
  fastify.get("/settings", getSettings);
  fastify.post("/settings/libraries", createLibrary);
  fastify.delete("/settings/libraries/:id", deleteLibrary);
}
