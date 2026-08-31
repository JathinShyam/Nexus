import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { loadConfigLoose } from "../src/config.js";
import type { FastifyInstance } from "fastify";

describe("GET /v1/health", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp({ config: loadConfigLoose() });
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns 200 without requiring a database", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/health" });
    expect(res.statusCode).toBe(200);
    const body = res.json() as {
      data: { status: string };
      meta: { requestId: string };
    };
    expect(body.data.status).toBe("ok");
    expect(body.meta.requestId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(res.headers["x-request-id"]).toBe(body.meta.requestId);
  });

  it("echoes a valid incoming X-Request-Id", async () => {
    const requestId = "11111111-1111-4111-8111-111111111111";
    const res = await app.inject({
      method: "GET",
      url: "/v1/health",
      headers: { "x-request-id": requestId },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-request-id"]).toBe(requestId);
    expect(res.json().meta.requestId).toBe(requestId);
  });
});
