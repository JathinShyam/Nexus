import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";

async function main() {
  const config = loadConfig();
  const app = await buildApp({ config });

  const close = async () => {
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error({ err }, "shutdown failed");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void close());
  process.on("SIGTERM", () => void close());

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
