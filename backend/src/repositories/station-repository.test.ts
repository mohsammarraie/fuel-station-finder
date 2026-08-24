import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStationListQuery } from "./station-repository.js";

describe("buildStationListQuery", () => {
  it("returns active stations in ascending address order by default", () => {
    const query = buildStationListQuery({ sort: "asc" });

    assert.match(query.text, /is_active = TRUE/);
    assert.match(query.text, /ORDER BY lower\(address\) ASC/);
    assert.deepEqual(query.values, []);
  });

  it("parameterizes radius and search filters", () => {
    const query = buildStationListQuery({
      latitude: 50.94,
      longitude: 6.96,
      radiusKm: 5,
      search: "50%_!",
      sort: "desc",
    });

    assert.match(query.text, /ST_DWithin/);
    assert.match(query.text, /lower\(address\) LIKE lower\(\$4\) ESCAPE '!'/);
    assert.match(query.text, /ORDER BY lower\(address\) DESC/);
    assert.deepEqual(query.values, [6.96, 50.94, 5_000, "%50!%!_!!%"]);
  });

  it("orders radius results from nearest to farthest", () => {
    const query = buildStationListQuery({
      latitude: 50.94,
      longitude: 6.96,
      radiusKm: 5,
      sort: "nearest",
    });

    assert.match(
      query.text,
      /ORDER BY distance_km ASC, lower\(address\) ASC, id ASC/,
    );
  });

  it("orders radius results from farthest to nearest", () => {
    const query = buildStationListQuery({
      latitude: 50.94,
      longitude: 6.96,
      radiusKm: 5,
      sort: "farthest",
    });

    assert.match(
      query.text,
      /ORDER BY distance_km DESC, lower\(address\) ASC, id ASC/,
    );
  });
});
