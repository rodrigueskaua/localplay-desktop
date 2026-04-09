import { findAll, findByVideoId, upsert } from "../services/progress.service.js";

export function listProgress(_req, reply) {
  return reply.send(findAll());
}

export function getProgress(req, reply) {
  const videoId = req.params["*"];
  const row = findByVideoId(videoId);
  return reply.send(row ?? { video_id: videoId, current_time: 0, duration: 0, completed: false });
}

export function saveProgress(req, reply) {
  const videoId = req.params["*"];
  const { current_time = 0, duration = 0, completed = false } = req.body;
  upsert(videoId, current_time, duration, completed);
  return reply.send({ ok: true });
}
