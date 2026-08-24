import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CologneStationClient,
  type FetchLike,
} from "./cologne-station-client.js";

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
  });
}

describe("CologneStationClient", () => {
  it("validates, maps, and paginates ArcGIS features", async () => {
    const requestedUrls: URL[] = [];
    const responses = [
      {
        exceededTransferLimit: true,
        features: [
          {
            attributes: { objectid: 1, adresse: "First Str. 1" },
            geometry: { x: 6.9, y: 50.9 },
          },
          {
            attributes: { objectid: 2, adresse: "Second Str. 2" },
            geometry: { x: 7, y: 51 },
          },
        ],
      },
      {
        exceededTransferLimit: false,
        features: [
          {
            attributes: { objectid: 3, adresse: "Third Str. 3" },
            geometry: { x: 7.1, y: 51.1 },
          },
        ],
      },
    ];

    const fetchImpl: FetchLike = async (input) => {
      requestedUrls.push(new URL(input));
      const payload = responses.shift();
      assert.ok(payload);
      return jsonResponse(payload);
    };
    const client = new CologneStationClient({
      sourceUrl: "https://example.test/query",
      pageSize: 2,
      fetchImpl,
    });

    const stations = await client.fetchStations();

    assert.deepEqual(stations, [
      {
        externalId: 1,
        address: "First Str. 1",
        longitude: 6.9,
        latitude: 50.9,
      },
      {
        externalId: 2,
        address: "Second Str. 2",
        longitude: 7,
        latitude: 51,
      },
      {
        externalId: 3,
        address: "Third Str. 3",
        longitude: 7.1,
        latitude: 51.1,
      },
    ]);
    assert.equal(requestedUrls.length, 2);
    assert.equal(requestedUrls[0]?.searchParams.get("outSR"), "4326");
    assert.equal(requestedUrls[0]?.searchParams.get("resultOffset"), "0");
    assert.equal(requestedUrls[1]?.searchParams.get("resultOffset"), "2");
  });

  it("rejects invalid records before they reach the database", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        features: [
          {
            attributes: { objectid: 98, adresse: "" },
            geometry: { x: 6.96, y: 50.91 },
          },
        ],
      });
    const client = new CologneStationClient({ fetchImpl });

    await assert.rejects(
      client.fetchStations(),
      /Invalid station source response/,
    );
  });

  it("reports ArcGIS errors", async () => {
    const fetchImpl: FetchLike = async () =>
      jsonResponse({
        error: {
          code: 400,
          message: "Invalid query",
          details: ["The where clause is invalid."],
        },
      });
    const client = new CologneStationClient({ fetchImpl });

    await assert.rejects(client.fetchStations(), /ArcGIS error 400/);
  });
});
