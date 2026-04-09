import fp from "fastify-plugin";
import cors from "@fastify/cors";

export default fp(async (fastify) => {
  fastify.register(cors, {
    origin(origin, cb) {
      const allowed =
        !origin ||
        origin === "null" ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

      allowed ? cb(null, true) : cb(new Error("Not allowed by CORS"), false);
    },
  });
});
