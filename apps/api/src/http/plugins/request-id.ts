import type { FastifyPluginAsync } from "fastify";
import { randomUUID } from "node:crypto";
import fp from "fastify-plugin";

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requestIdPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (request, reply) => {
    const incoming = request.headers["x-request-id"];
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
    const requestId =
      candidate && UUID_RE.test(candidate) ? candidate : randomUUID();
    request.requestId = requestId;
    reply.header("X-Request-Id", requestId);
  });
};

export default fp(requestIdPlugin, { name: "request-id" });
