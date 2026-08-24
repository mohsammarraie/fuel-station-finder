import "dotenv/config";
import { logger } from "../logger.js";
import { closeDatabasePool, getDatabasePool } from "./client.js";
import { exampleStations } from "./seeds/example-stations.js";

async function seed(): Promise<void> {
  const client = await getDatabasePool().connect();

  try {
    await client.query("BEGIN");

    for (const station of exampleStations) {
      await client.query(
        `
          INSERT INTO stations (
            external_id,
            address,
            location,
            is_active,
            last_seen_at
          )
          VALUES (
            $1,
            $2,
            ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
            TRUE,
            CURRENT_TIMESTAMP
          )
          ON CONFLICT (external_id) DO UPDATE
          SET
            address = EXCLUDED.address,
            location = EXCLUDED.location,
            is_active = TRUE,
            last_seen_at = CURRENT_TIMESTAMP
          WHERE
            stations.address IS DISTINCT FROM EXCLUDED.address
            OR NOT ST_Equals(
              stations.location::geometry,
              EXCLUDED.location::geometry
            )
            OR stations.is_active = FALSE
        `,
        [
          station.externalId,
          station.address,
          station.longitude,
          station.latitude,
        ],
      );
    }

    await client.query("COMMIT");
    logger.info(
      { stationCount: exampleStations.length },
      "Example stations seeded",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  await seed();
} catch (error) {
  logger.error({ err: error }, "Database seed failed");
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
