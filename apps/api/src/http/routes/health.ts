import type { FastifyPluginAsyncTypebox } from "@fastify/type-provider-typebox";
import { Type } from "@sinclair/typebox";
import type { Db } from "../../db/client.js";

type HealthOpts = {
  db: Db;
};

const Meta = Type.Object({
  requestId: Type.String(),
});

const healthRoutes: FastifyPluginAsyncTypebox<HealthOpts> = async (
  app,
  opts,
) => {
  app.get(
    "/health",
    {
      schema: {
        response: {
          200: Type.Object({
            data: Type.Object({ status: Type.Literal("ok") }),
            meta: Meta,
          }),
        },
      },
    },
    async (request) => ({
      data: { status: "ok" as const },
      meta: { requestId: request.requestId },
    }),
  );

  app.get(
    "/ready",
    {
      schema: {
        response: {
          200: Type.Object({
            data: Type.Object({ status: Type.Literal("ready") }),
            meta: Meta,
          }),
          503: Type.Object({
            error: Type.Object({
              code: Type.Literal("INTERNAL"),
              message: Type.String(),
            }),
            meta: Meta,
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        await opts.db`select 1`;
        return {
          data: { status: "ready" as const },
          meta: { requestId: request.requestId },
        };
      } catch (err) {
        request.log.warn({ err }, "readiness check failed");
        return reply.status(503).send({
          error: {
            code: "INTERNAL" as const,
            message: "Database unavailable",
          },
          meta: { requestId: request.requestId },
        });
      }
    },
  );
};

export default healthRoutes;
