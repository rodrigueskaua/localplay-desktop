import { getLibrary } from "../services/library.service.js";

export function listCourses(_req, reply) {
  return reply.send(getLibrary());
}
