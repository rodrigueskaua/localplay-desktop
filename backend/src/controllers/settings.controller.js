import { listLibraries, addLibrary, removeLibrary } from "../services/settings.service.js";

export function getSettings(_req, reply) {
  return reply.send({ libraries: listLibraries() });
}

export function createLibrary(req, reply) {
  const { path, name } = req.body ?? {};
  if (!path || typeof path !== "string") {
    return reply.code(400).send({ error: "Informe um caminho de pasta válido." });
  }

  try {
    const library = addLibrary(path, name ?? null);
    return reply.send({ library, libraries: listLibraries() });
  } catch (err) {
    return reply.code(400).send({ error: err.message });
  }
}

export function deleteLibrary(req, reply) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return reply.code(400).send({ error: "Id de biblioteca inválido." });
  }
  removeLibrary(id);
  return reply.send({ libraries: listLibraries() });
}
