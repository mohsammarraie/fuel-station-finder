import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import pino, { type LevelWithSilent } from "pino";
import { pinoHttp } from "pino-http";

const MAX_REQUEST_ID_LENGTH = 100;

function resolveLogLevel(): string {
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  return process.env.NODE_ENV === "test" ? "silent" : "info";
}

export function selectRequestId(
  header: string | string[] | undefined,
  createId: () => string = randomUUID,
): string {
  if (typeof header === "string") {
    const requestId = header.trim();

    if (requestId.length > 0 && requestId.length <= MAX_REQUEST_ID_LENGTH) {
      return requestId;
    }
  }

  return createId();
}

export function requestLogLevel(
  statusCode: number,
  hasError: boolean,
): LevelWithSilent {
  if (hasError || statusCode >= 500) {
    return "error";
  }

  if (statusCode >= 400) {
    return "warn";
  }

  return "info";
}

export function shouldLogRequest(url: string | undefined): boolean {
  return url?.split("?", 1)[0] !== "/api/health";
}

export const logger = pino({
  level: resolveLogLevel(),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.x-api-key",
    ],
    censor: "[Redacted]",
  },
});

export const requestLogger = pinoHttp({
  logger,
  genReqId(request: IncomingMessage, response: ServerResponse) {
    const requestId = selectRequestId(request.headers["x-request-id"]);
    response.setHeader("X-Request-Id", requestId);
    return requestId;
  },
  customLogLevel(_request, response, error) {
    return requestLogLevel(response.statusCode, error !== undefined);
  },
  autoLogging: {
    ignore: (request) => !shouldLogRequest(request.url),
  },
});
