import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { stationQuerySchema } from "./station-query.js";

describe("stationQuerySchema", () => {
  it("applies defaults to an unfiltered request", () => {
    assert.deepEqual(stationQuerySchema.parse({}), { sort: "asc" });
  });

  it("parses a combined search, sort, and radius filter", () => {
    assert.deepEqual(
      stationQuerySchema.parse({
        lat: "50.94",
        lng: "6.96",
        radius: "5",
        search: "  Bonner  ",
        sort: "desc",
      }),
      {
        latitude: 50.94,
        longitude: 6.96,
        radiusKm: 5,
        search: "Bonner",
        sort: "desc",
      },
    );
  });

  it("accepts distance sorting with a complete location filter", () => {
    assert.deepEqual(
      stationQuerySchema.parse({
        lat: "50.94",
        lng: "6.96",
        radius: "10",
        sort: "nearest",
      }),
      {
        latitude: 50.94,
        longitude: 6.96,
        radiusKm: 10,
        sort: "nearest",
      },
    );
  });

  it("rejects distance sorting without a location filter", () => {
    const result = stationQuerySchema.safeParse({ sort: "farthest" });

    assert.equal(result.success, false);
    assert.match(
      result.error?.issues[0]?.message ?? "",
      /requires lat, lng, and radius/,
    );
  });

  it("rejects partial location filters", () => {
    const result = stationQuerySchema.safeParse({ lat: "50.94", lng: "6.96" });

    assert.equal(result.success, false);
    assert.match(
      result.error?.issues[0]?.message ?? "",
      /must be provided together/,
    );
  });

  it("rejects unsupported radii and out-of-range coordinates", () => {
    assert.equal(
      stationQuerySchema.safeParse({
        lat: "91",
        lng: "6.96",
        radius: "3",
      }).success,
      false,
    );
  });
});
