# Express to NestJS

This branch keeps the API and data behavior while moving the HTTP application to
NestJS. NestJS currently uses its Express adapter here, so Express remains an
underlying HTTP implementation supplied by `@nestjs/platform-express`; route
ownership and dependency injection are NestJS's responsibility.

| Concern | Before: Express | After: NestJS |
| --- | --- | --- |
| Application setup | `app.ts` created an Express app and registered middleware and routes | `AppModule` declares controllers and providers; `createApp()` creates and configures the Nest application |
| Routes | `app.get()` and `createStationRouter()` | `@Controller()` and `@Get()` on health and station controllers |
| Dependencies | Router manually constructed `PostgresStationRepository` and passed it to a handler factory | Nest injects `StationService` into `StationController` and the repository into the service |
| Response | Handler called `res.json()` | Controller returns a value; Nest serializes it |
| Validation | Handler parsed `req.query` with Zod | Controller parses `@Query()` with the same Zod schema and throws `BadRequestException` on failure |
| Errors | Express 404 and error middleware | Global `ApiExceptionFilter` preserves the existing 400, 404, and 500 response shapes |
| Import job | CLI constructed the source client and import service manually | CLI creates a Nest application context with `StationImportModule` and resolves the service |
| Request logging and CORS | Express middleware | Existing Pino middleware and Nest `enableCors()` |

The `GET /api/health` and `GET /api/stations` paths, query parameters, status
codes, JSON bodies, CORS behavior, and `X-Request-Id` header are preserved. The
PostGIS SQL, PostgreSQL pool, migrations, seed, ArcGIS client, and import
transaction logic remain the same. The frontend still sends requests to `/api`
through Vite's proxy.

For interview practice, follow a station request from `StationController` to
`StationService` to `PostgresStationRepository`, then compare that with the old
Express router and handler in `main`. The service is deliberately thin: it
shows Nest's provider boundary without moving SQL or changing domain behavior.

Run `npm test` and `npm run build` in `backend` to verify the implementation. The
HTTP contract tests start a real Nest application with a fake repository, so
they exercise routing, injection, validation, and response formatting without
needing a database. Use the normal `db:migrate` and `stations:import` commands
for database and import operations.
