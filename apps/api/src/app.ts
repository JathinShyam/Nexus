import Fastify from "fastify";
import {
  type TypeBoxTypeProvider,
} from "@fastify/type-provider-typebox";
import type { AppConfig } from "./config.js";
import { createDb, type Db } from "./db/client.js";
import errorHandlerPlugin from "./http/plugins/error-handler.js";
import requestIdPlugin from "./http/plugins/request-id.js";
import healthRoutes from "./http/routes/health.js";

export type AppDeps = {
  config: AppConfig;
  db?: Db;
};

export async function buildApp(deps: AppDeps) {
  const db = deps.db ?? createDb(deps.config);

  const app = Fastify({
    logger: {
      level: deps.config.logLevel,
    },
  }).withTypeProvider<TypeBoxTypeProvider>();

  app.decorate("db", db);

  await app.register(requestIdPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(healthRoutes, { prefix: "/v1", db });

  app.addHook("onClose", async () => {
    await db.end({ timeout: 5 });
  });

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
  }
}
