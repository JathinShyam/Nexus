const path = require("node:path");

/** @type {import('node-pg-migrate').RunnerOption} */
module.exports = {
  databaseUrl:
    process.env.DATABASE_MIGRATE_URL ??
    "postgres://nexus_migrator:nexus_migrator@localhost:5432/nexus",
  dir: path.join(__dirname, "migrations"),
  direction: "up",
  migrationsTable: "pgmigrations",
  verbose: true,
  // Superuser-created extensions may already exist; migrator still owns app DDL.
};
