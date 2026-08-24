import "dotenv/config";
import { logger } from "../logger.js";
import { closeDatabasePool, getDatabasePool } from "./client.js";
import { createStationsMigration } from "./migrations/001-create-stations.js";
import { addStationImportTrackingMigration } from "./migrations/002-add-station-import-tracking.js";
import type { Migration } from "./migrations/types.js";

const MIGRATION_LOCK_NAME = "fuel-station-finder:migrations";

const migrations: Migration[] = [
  createStationsMigration,
  addStationImportTrackingMigration,
];

async function migrate(): Promise<void> {
  const client = await getDatabasePool().connect();

  try {
    await client.query("SELECT pg_advisory_lock(hashtext($1))", [
      MIGRATION_LOCK_NAME,
    ]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const result = await client.query<{ version: number }>(
      "SELECT version FROM schema_migrations",
    );
    const appliedVersions = new Set(result.rows.map(({ version }) => version));

    for (const migration of migrations) {
      if (appliedVersions.has(migration.version)) {
        continue;
      }

      await client.query("BEGIN");

      try {
        await migration.up(client);
        await client.query(
          "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
          [migration.version, migration.name],
        );
        await client.query("COMMIT");
        logger.info(
          { migrationName: migration.name, migrationVersion: migration.version },
          "Database migration applied",
        );
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext($1))", [
      MIGRATION_LOCK_NAME,
    ]);
    client.release();
  }
}

try {
  await migrate();
} catch (error) {
  logger.error({ err: error }, "Database migration failed");
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
