import {
  listLibraries,
  getActiveLibrary,
  setActiveLibrary,
  removeLibrary,
} from "../services/settings.service.js";

export function getSettings(_req, reply) {
  return reply.send({
    active: getActiveLibrary(),
    libraries: listLibraries(),
  });
}

export function updateLibraryPath(req, reply) {
  const { path, name } = req.body ?? {};
  if (!path || typeof path !== "string") {
    return reply.code(400).send({ error: "Informe um caminho de pasta válido." });
  }

  try {
    const library = setActiveLibrary(path, name ?? null);
    return reply.send({ active: library });
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
  return reply.send({ ok: true });
}
