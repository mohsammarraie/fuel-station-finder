import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  requestLogLevel,
  selectRequestId,
  shouldLogRequest,
} from "./logger.js";

describe("selectRequestId", () => {
  it("preserves a valid incoming request ID", () => {
    assert.equal(selectRequestId(" request-123 "), "request-123");
  });

  it("creates an ID when the incoming value is missing or invalid", () => {
    const createId = () => "generated-id";

    assert.equal(selectRequestId(undefined, createId), "generated-id");
    assert.equal(selectRequestId("   ", createId), "generated-id");
    assert.equal(selectRequestId("x".repeat(101), createId), "generated-id");
  });
});

describe("requestLogLevel", () => {
  it("uses levels based on the response outcome", () => {
    assert.equal(requestLogLevel(200, false), "info");
    assert.equal(requestLogLevel(404, false), "warn");
    assert.equal(requestLogLevel(500, false), "error");
    assert.equal(requestLogLevel(200, true), "error");
  });
});

describe("shouldLogRequest", () => {
  it("ignores health checks but logs other requests", () => {
    assert.equal(shouldLogRequest("/api/health"), false);
    assert.equal(shouldLogRequest("/api/health?full=true"), false);
    assert.equal(shouldLogRequest("/api/stations"), true);
  });
});
