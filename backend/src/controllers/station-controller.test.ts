import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NextFunction, Request, Response } from "express";
import type {
  StationListItem,
  StationRepository,
} from "../repositories/station-repository.js";
import { createListStationsHandler } from "./station-controller.js";

interface ResponseCapture {
  statusCode: number;
  body: unknown;
  response: Response;
}

function createResponseCapture(): ResponseCapture {
  const capture = {
    statusCode: 200,
    body: undefined as unknown,
  };
  const response = {
    status(code: number) {
      capture.statusCode = code;
      return response;
    },
    json(body: unknown) {
      capture.body = body;
      return response;
    },
  } as unknown as Response;

  return {
    get statusCode() {
      return capture.statusCode;
    },
    get body() {
      return capture.body;
    },
    response,
  };
}

describe("list stations controller", () => {
  it("returns repository results and their count", async () => {
    const stations: StationListItem[] = [
      {
        id: 1,
        externalId: 98,
        address: "Bonner Str. 98",
        latitude: 50.916,
        longitude: 6.961,
        distanceKm: null,
      },
    ];
    const repository: StationRepository = {
      async findAll(filters) {
        assert.deepEqual(filters, { search: "Bonner", sort: "asc" });
        return stations;
      },
    };
    const handler = createListStationsHandler(repository);
    const capture = createResponseCapture();
    const request = { query: { search: "Bonner" } } as unknown as Request;

    await handler(request, capture.response, (() => {}) as NextFunction);

    assert.equal(capture.statusCode, 200);
    assert.deepEqual(capture.body, { data: stations, meta: { count: 1 } });
  });

  it("returns 400 without querying the repository for invalid filters", async () => {
    let repositoryCalled = false;
    const repository: StationRepository = {
      async findAll() {
        repositoryCalled = true;
        return [];
      },
    };
    const handler = createListStationsHandler(repository);
    const capture = createResponseCapture();
    const request = { query: { radius: "100" } } as unknown as Request;

    await handler(request, capture.response, (() => {}) as NextFunction);

    assert.equal(capture.statusCode, 400);
    assert.equal(repositoryCalled, false);
    assert.match(JSON.stringify(capture.body), /INVALID_QUERY/);
  });
});
