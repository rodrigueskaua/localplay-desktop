import { getSettings, updateLibraryPath, deleteLibrary } from "../controllers/settings.controller.js";

export async function settingsRoutes(fastify) {
  fastify.get("/settings", getSettings);
  fastify.put("/settings/library-path", updateLibraryPath);
  fastify.delete("/settings/library/:id", deleteLibrary);
}
