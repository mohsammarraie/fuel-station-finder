import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, describe, it } from "node:test";
import { Module, type INestApplication } from "@nestjs/common";
import { createApp } from "../app.js";
import { HealthController } from "./health-controller.js";
import { StationController } from "./station-controller.js";
import {
  PostgresStationRepository,
  type StationListItem,
  type StationRepository,
} from "../repositories/station-repository.js";
import { StationService } from "../services/station-service.js";

const stations: StationListItem[] = [{
  id: 1,
  externalId: 98,
  address: "Bonner Str. 98",
  latitude: 50.916,
  longitude: 6.961,
  distanceKm: null,
}];

let failQuery = false;
let queryCount = 0;
const repository: StationRepository = {
  async findAll(filters) {
    queryCount += 1;
    if (failQuery) {
      throw new Error("Database unavailable");
    }
    assert.deepEqual(filters, { search: "Bonner", sort: "asc" });
    return stations;
  },
};

@Module({
  controllers: [HealthController, StationController],
  providers: [StationService, { provide: PostgresStationRepository, useValue: repository }],
})
class TestModule {}

describe("NestJS HTTP contract", () => {
  let app: INestApplication;
  let baseUrl: string;

  before(async () => {
    app = await createApp(TestModule);
    await app.listen(0, "127.0.0.1");
    const address = app.getHttpServer().address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await app?.close();
  });

  it("returns health status and keeps request ID and CORS headers", async () => {
    const response = await fetch(`${baseUrl}/api/health`, {
      headers: { "X-Request-Id": "test-request", Origin: "http://localhost:5173" },
    });

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
    assert.equal(response.headers.get("x-request-id"), "test-request");
    assert.equal(response.headers.get("access-control-allow-origin"), "*");
    assert.equal(response.headers.get("x-powered-by"), null);
  });

  it("returns station data and count using the existing query contract", async () => {
    const response = await fetch(`${baseUrl}/api/stations?search=Bonner`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: stations, meta: { count: 1 } });
  });

  it("rejects invalid filters without querying the repository", async () => {
    const previousCount = queryCount;
    const response = await fetch(`${baseUrl}/api/stations?radius=5`);

    assert.equal(response.status, 400);
    assert.equal(queryCount, previousCount);
    assert.deepEqual(await response.json(), {
      error: {
        code: "INVALID_QUERY",
        message: "The station query parameters are invalid.",
        details: [{ field: "location", message: "lat, lng, and radius must be provided together." }],
      },
    });
  });

  it("keeps the not-found response", async () => {
    const response = await fetch(`${baseUrl}/api/missing`);

    assert.equal(response.status, 404);
    assert.deepEqual(await response.json(), {
      error: { code: "NOT_FOUND", message: "The requested resource was not found." },
    });
  });

  it("hides unexpected repository failures", async () => {
    failQuery = true;
    try {
      const response = await fetch(`${baseUrl}/api/stations?search=Bonner`);

      assert.equal(response.status, 500);
      assert.deepEqual(await response.json(), {
        error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred." },
      });
    } finally {
      failQuery = false;
    }
  });
});
