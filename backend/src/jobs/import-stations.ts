import "dotenv/config";
import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { INestApplicationContext } from "@nestjs/common";
import { closeDatabasePool } from "../database/client.js";
import { logger } from "../logger.js";
import { StationImportService } from "../services/station-import-service.js";
import { StationImportModule } from "./station-import.module.js";

let app: INestApplicationContext | undefined;
try {
  app = await NestFactory.createApplicationContext(StationImportModule, { logger: false });
  const summary = await app.get(StationImportService).run();

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
  await app?.close();
  await closeDatabasePool();
}
