import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapStationRow } from "./station.js";

describe("mapStationRow", () => {
  it("maps PostgreSQL column names to the application model", () => {
    const createdAt = new Date("2026-01-01T10:00:00.000Z");
    const updatedAt = new Date("2026-01-02T10:00:00.000Z");
    const lastSeenAt = new Date("2026-01-03T10:00:00.000Z");

    const station = mapStationRow({
      id: 1,
      external_id: 98,
      address: "Bonner Str. 98 (50677 Neustadt/Süd)",
      latitude: 50.916095041454554,
      longitude: 6.960644911005172,
      is_active: true,
      last_seen_at: lastSeenAt,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    assert.deepEqual(station, {
      id: 1,
      externalId: 98,
      address: "Bonner Str. 98 (50677 Neustadt/Süd)",
      latitude: 50.916095041454554,
      longitude: 6.960644911005172,
      isActive: true,
      lastSeenAt,
      createdAt,
      updatedAt,
    });
  });
});
