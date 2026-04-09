import { mkdirSync } from "fs";
import Fastify from "fastify";
import { initDb } from "./db/index.js";
import { COVERS_DIR, PORT } from "./config.js";
import corsPlugin      from "./plugins/cors.js";
import multipartPlugin from "./plugins/multipart.js";
import staticPlugin    from "./plugins/static.js";
import { libraryRoutes }  from "./routes/library.routes.js";
import { videoRoutes }    from "./routes/video.routes.js";
import { progressRoutes } from "./routes/progress.routes.js";
import { coversRoutes }   from "./routes/covers.routes.js";

mkdirSync(COVERS_DIR, { recursive: true });
initDb();

const fastify = Fastify({ logger: true });

await fastify.register(corsPlugin);
await fastify.register(multipartPlugin);
await fastify.register(staticPlugin);

await fastify.register(libraryRoutes,  { prefix: "/api" });
await fastify.register(videoRoutes,    { prefix: "/api" });
await fastify.register(progressRoutes, { prefix: "/api" });
await fastify.register(coversRoutes,   { prefix: "/api" });

await fastify.listen({ port: PORT, host: "0.0.0.0" });
