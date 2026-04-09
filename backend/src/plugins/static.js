import fp from "fastify-plugin";
import staticFiles from "@fastify/static";
import { COVERS_DIR } from "../config.js";

export default fp(async (fastify) => {
  fastify.register(staticFiles, {
    root: COVERS_DIR,
    prefix: "/covers",
  });
});
