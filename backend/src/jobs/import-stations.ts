import "dotenv/config";
import { CologneStationClient } from "../clients/cologne-station-client.js";
import { closeDatabasePool } from "../database/client.js";
import { logger } from "../logger.js";
import { StationImportService } from "../services/station-import-service.js";

function readPageSize(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const pageSize = Number(value);

  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 5_000) {
    throw new Error("STATION_IMPORT_PAGE_SIZE must be an integer from 1 to 5000.");
  }

  return pageSize;
}

try {
  const sourceClient = new CologneStationClient({
    sourceUrl: process.env.STATION_SOURCE_URL,
    pageSize: readPageSize(process.env.STATION_IMPORT_PAGE_SIZE),
  });
  const summary = await new StationImportService(sourceClient).run();

  logger.info(
    {
      runId: summary.runId,
      fetchedCount: summary.fetchedCount,
      upsertedCount: summary.upsertedCount,
      deactivatedCount: summary.deactivatedCount,
    },
    "Station import succeeded",
  );
} catch (error) {
  logger.error({ err: error }, "Station import failed");
  process.exitCode = 1;
} finally {
  await closeDatabasePool();
}
