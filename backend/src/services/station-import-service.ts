import type { PoolClient } from "pg";
import type { CologneStationClient } from "../clients/cologne-station-client.js";
import { getDatabasePool } from "../database/client.js";

const IMPORT_LOCK_NAME = "fuel-station-finder:station-import";
const MAX_ERROR_MESSAGE_LENGTH = 2_000;

interface ImportRunRow {
  id: string;
  started_at: Date;
}

export interface StationImportSummary {
  runId: string;
  fetchedCount: number;
  upsertedCount: number;
  deactivatedCount: number;
  startedAt: Date;
  completedAt: Date;
}

export class StationImportService {
  constructor(private readonly sourceClient: CologneStationClient) {}

  async run(): Promise<StationImportSummary> {
    const client = await getDatabasePool().connect();
    let lockAcquired = false;
    let transactionActive = false;
    let run: ImportRunRow | undefined;

    try {
      await client.query("SELECT pg_advisory_lock(hashtext($1))", [
        IMPORT_LOCK_NAME,
      ]);
      lockAcquired = true;

      const runResult = await client.query<ImportRunRow>(
        `
          INSERT INTO station_import_runs (status, source_url)
          VALUES ('running', $1)
          RETURNING id, started_at
        `,
        [this.sourceClient.sourceUrl],
      );
      run = runResult.rows[0];

      if (!run) {
        throw new Error("Database did not return an import-run record.");
      }

      const stations = await this.sourceClient.fetchStations();

      if (stations.length === 0) {
        throw new Error(
          "Station source returned no records; synchronization was cancelled.",
        );
      }

      const seenAt = new Date();
      await client.query("BEGIN");
      transactionActive = true;

      for (const station of stations) {
        await this.upsertStation(client, station, seenAt);
      }

      const deactivationResult = await client.query(
        `
          UPDATE stations
          SET is_active = FALSE
          WHERE is_active = TRUE
            AND last_seen_at < $1
        `,
        [seenAt],
      );
      const completedAt = new Date();

      await client.query(
        `
          UPDATE station_import_runs
          SET
            status = 'succeeded',
            completed_at = $2,
            fetched_count = $3,
            upserted_count = $3,
            deactivated_count = $4
          WHERE id = $1
        `,
        [run.id, completedAt, stations.length, deactivationResult.rowCount ?? 0],
      );

      await client.query("COMMIT");
      transactionActive = false;

      return {
        runId: run.id,
        fetchedCount: stations.length,
        upsertedCount: stations.length,
        deactivatedCount: deactivationResult.rowCount ?? 0,
        startedAt: run.started_at,
        completedAt,
      };
    } catch (error) {
      if (transactionActive) {
        await client.query("ROLLBACK");
      }

      if (run) {
        await this.recordFailure(client, run.id, error);
      }

      throw error;
    } finally {
      if (lockAcquired) {
        try {
          await client.query("SELECT pg_advisory_unlock(hashtext($1))", [
            IMPORT_LOCK_NAME,
          ]);
        } catch (error) {
          console.error("Failed to release station import lock", error);
        }
      }

      client.release();
    }
  }

  private async upsertStation(
    client: PoolClient,
    station: {
      externalId: number;
      address: string;
      longitude: number;
      latitude: number;
    },
    seenAt: Date,
  ): Promise<void> {
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
          $5
        )
        ON CONFLICT (external_id) DO UPDATE
        SET
          address = EXCLUDED.address,
          location = EXCLUDED.location,
          is_active = TRUE,
          last_seen_at = EXCLUDED.last_seen_at
      `,
      [
        station.externalId,
        station.address,
        station.longitude,
        station.latitude,
        seenAt,
      ],
    );
  }

  private async recordFailure(
    client: PoolClient,
    runId: string,
    error: unknown,
  ): Promise<void> {
    const message =
      error instanceof Error ? error.message : "Unknown station import error";

    await client.query(
      `
        UPDATE station_import_runs
        SET
          status = 'failed',
          completed_at = CURRENT_TIMESTAMP,
          error_message = $2
        WHERE id = $1
      `,
      [runId, message.slice(0, MAX_ERROR_MESSAGE_LENGTH)],
    );
  }
}
