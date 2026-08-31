export type AppConfig = {
  nodeEnv: string;
  port: number;
  logLevel: string;
  databaseUrl: string;
  databaseMigrateUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  embeddingProvider: "openai" | "voyage" | "mock";
  embeddingApiKey: string;
  embeddingDim: number;
  allowSelfTenant: boolean;
  corsOrigins: string[];
};

function bool(name: string, env: NodeJS.ProcessEnv, fallback: boolean): boolean {
  const raw = env[name];
  if (raw === undefined || raw === "") return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

function parseEmbeddingProvider(
  value: string | undefined,
): AppConfig["embeddingProvider"] {
  const v = value ?? "mock";
  if (v === "openai" || v === "voyage" || v === "mock") return v;
  throw new Error(`Invalid EMBEDDING_PROVIDER: ${v}`);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  return {
    nodeEnv: env.NODE_ENV ?? "development",
    port: Number(env.PORT ?? "3000"),
    logLevel: env.LOG_LEVEL ?? "info",
    databaseUrl,
    databaseMigrateUrl: env.DATABASE_MIGRATE_URL ?? "",
    jwtAccessSecret: env.JWT_ACCESS_SECRET ?? "dev-access-secret-change-me",
    jwtRefreshSecret: env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-me",
    embeddingProvider: parseEmbeddingProvider(env.EMBEDDING_PROVIDER),
    embeddingApiKey: env.EMBEDDING_API_KEY ?? "",
    embeddingDim: Number(env.EMBEDDING_DIM ?? "1536"),
    allowSelfTenant: bool("ALLOW_SELF_TENANT", env, false),
    corsOrigins: (env.CORS_ORIGINS ?? "http://localhost:3000")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}

/** For tests that only hit /v1/health (no real DB required). */
export function loadConfigLoose(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV ?? "test",
    port: Number(env.PORT ?? "0"),
    logLevel: env.LOG_LEVEL ?? "error",
    databaseUrl:
      env.DATABASE_URL ?? "postgres://invalid:invalid@127.0.0.1:1/invalid",
    databaseMigrateUrl: env.DATABASE_MIGRATE_URL ?? "",
    jwtAccessSecret: env.JWT_ACCESS_SECRET ?? "test-access",
    jwtRefreshSecret: env.JWT_REFRESH_SECRET ?? "test-refresh",
    embeddingProvider: parseEmbeddingProvider(env.EMBEDDING_PROVIDER ?? "mock"),
    embeddingApiKey: env.EMBEDDING_API_KEY ?? "",
    embeddingDim: Number(env.EMBEDDING_DIM ?? "1536"),
    allowSelfTenant: bool("ALLOW_SELF_TENANT", env, true),
    corsOrigins: ["http://localhost:3000"],
  };
}
