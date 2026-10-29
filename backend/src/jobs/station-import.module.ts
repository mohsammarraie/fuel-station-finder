import { Module } from "@nestjs/common";
import { CologneStationClient } from "../clients/cologne-station-client.js";
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

@Module({
  providers: [
    {
      provide: CologneStationClient,
      useFactory: () => new CologneStationClient({
        sourceUrl: process.env.STATION_SOURCE_URL,
        pageSize: readPageSize(process.env.STATION_IMPORT_PAGE_SIZE),
      }),
    },
    StationImportService,
  ],
})
export class StationImportModule {}
