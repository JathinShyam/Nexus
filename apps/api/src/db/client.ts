import type { Sql } from "postgres";
import postgres from "postgres";
import type { AppConfig } from "../config.js";

export type Db = Sql;

export function createDb(config: AppConfig): Db {
  return postgres(config.databaseUrl, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}
