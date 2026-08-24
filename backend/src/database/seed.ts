import "dotenv/config";
import { closeDatabasePool, getDatabasePool } from "./client.js";
import { exampleStations } from "./seeds/example-stations.js";

async function seed(): Promise<void> {
  const client = await getDatabasePool().connect();

  try {
    await client.query("BEGIN");

    for (const station of exampleStations) {
      await client.query(
        `
          INSERT INTO stations (external_id, address, location)
          VALUES (
            $1,
            $2,
            ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
          )
          ON CONFLICT (external_id) DO UPDATE
          SET
            address = EXCLUDED.address,
            location = EXCLUDED.location
          WHERE
            stations.address IS DISTINCT FROM EXCLUDED.address
            OR NOT ST_Equals(
              stations.location::geometry,
              EXCLUDED.location::geometry
            )
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
    console.log(`Seeded ${exampleStations.length} example stations.`);
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
  console.error("Database seed failed", error);
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
