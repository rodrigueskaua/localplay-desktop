import { createReadStream, statSync, existsSync } from "fs";
import { resolve } from "path";
import mime from "mime-types";
import { VIDEOS_DIR } from "../config.js";

const CHUNK_SIZE = 256 * 1024;
const VIDEOS_ROOT = resolve(VIDEOS_DIR);

export function resolveVideo(videoId) {
  const videoPath = resolve(VIDEOS_ROOT, videoId);

  if (!videoPath.startsWith(VIDEOS_ROOT + "/")) {
    return { error: "forbidden" };
  }

  if (!existsSync(videoPath) || !statSync(videoPath).isFile()) {
    return { error: "not_found" };
  }

  const { size } = statSync(videoPath);
  const mimeType = mime.lookup(videoPath) || "video/mp4";

  return { videoPath, size, mimeType };
}

export function streamFull(videoPath, size, mimeType) {
  return {
    status: 200,
    headers: {
      "Accept-Ranges": "bytes",
      "Content-Length": size,
      "Content-Type": mimeType,
    },
    stream: createReadStream(videoPath, { highWaterMark: CHUNK_SIZE }),
  };
}

export function streamRange(videoPath, size, mimeType, rangeHeader) {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return { error: "invalid_range" };

  const start = parseInt(match[1], 10);
  const end = match[2] ? Math.min(parseInt(match[2], 10), size - 1) : size - 1;

  if (start > end) return { error: "invalid_range" };

  return {
    status: 206,
    headers: {
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": end - start + 1,
      "Content-Type": mimeType,
    },
    stream: createReadStream(videoPath, { start, end, highWaterMark: CHUNK_SIZE }),
  };
}
