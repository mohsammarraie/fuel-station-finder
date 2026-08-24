# Backend logging

The backend uses Pino and `pino-http` for structured JSON logging. The same
logger is shared by Express, database utilities, and the station import job.

## Request logs

Each completed HTTP request is logged with its method, URL, response status,
response time, and request ID. Every response includes the ID in its
`X-Request-Id` header. Successful requests use the `info` level,
client errors (`4xx`) use `warn`, and server errors (`5xx`) use `error`.

Successful health checks at `/api/health` are not logged to avoid repetitive
output from uptime monitoring.

## Request IDs

Clients may send an `X-Request-Id` header. The backend preserves a non-empty ID
of at most 100 characters and returns it in the response. Otherwise, it creates
a UUID. This lets a frontend error report be matched to the corresponding
backend log.

```bash
curl -i -H 'X-Request-Id: local-test-1' http://localhost:3000/api/stations
```

## Configuration

The default log level is `info`. Override it through the backend environment:

```dotenv
LOG_LEVEL=debug
```

Tests default to silent logging when `NODE_ENV=test`. Supported standard levels
include `trace`, `debug`, `info`, `warn`, `error`, `fatal`, and `silent`.

Authorization, cookie, and API-key request headers are redacted. Request bodies
are not added to logs.
