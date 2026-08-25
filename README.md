# Fuel Station Finder

Vue and Express application for finding fuel stations, backed by PostgreSQL and
PostGIS.

## Prerequisites

- Node.js 24
- npm
- Docker with Docker Compose

## Local database setup

Start PostgreSQL/PostGIS:

```bash
docker compose up -d database
```

Configure and migrate the backend:

```bash
cd backend
npm ci
cp .env.example .env
npm run db:migrate
```

The migration is safe to run repeatedly. Applied versions are recorded in the
`schema_migrations` table.

## Import live station data

After applying the migrations, synchronize the complete official Cologne
dataset:

```bash
cd backend
npm run stations:import
```

For offline development, `npm run db:seed` can be used instead. It inserts ten
representative records and is safe to run repeatedly.

The importer validates and paginates the ArcGIS response, upserts stations by
their external ID, records every import attempt, and deactivates missing records
only after a complete successful download. See
`backend/docs/station-import.md` for details.

Start the backend in development mode:

```bash
cd backend
npm run dev
```

The API is available at `http://localhost:3000`.

## Station API

Retrieve all active stations:

```http
GET /api/stations
```

Combine street search, sorting, and radius filtering:

```http
GET /api/stations?search=Bonner&sort=asc&lat=50.94&lng=6.96&radius=5
```

Address sorting supports `asc` and `desc`. With a location filter, use
`nearest` or `farthest` to sort by calculated distance. The allowed radii are
2, 5, and 10 kilometres. See
`backend/docs/station-api.md` for the complete contract.

## Backend logging

Backend requests and application events are written as structured JSON logs.
Every response includes an `X-Request-Id`; an incoming ID is preserved when
valid, otherwise the backend generates one. Set `LOG_LEVEL` in
the backend environment to control verbosity. See `backend/docs/logging.md` for
details.

## Backend checks

```bash
cd backend
npm test
npm run build
```

## Frontend development

With the backend running on port `3000`, start the Vue development server:

```bash
cd frontend
npm ci
npm run dev
```

Vite forwards `/api` requests to the backend. The frontend displays active
stations with loading, empty, and retryable error states. Street search,
address sorting, optional 2/5/10-kilometre radius filtering, and nearest or
farthest distance sorting are available through the filter form. See
`frontend/docs/station-list.md` and `frontend/docs/station-filters.md` for
details.

Open `http://localhost:5173` in a browser.

Frontend checks run with:

```bash
cd frontend
npm test
npm run build
```

## Continuous integration

GitHub Actions runs the following checks for every pull request targeting
`main`, and again after changes are pushed to `main`:

- Backend dependency installation, tests, and TypeScript build
- Database migration and repeatability check against PostGIS
- Example-data seed and repeatability check
- Frontend dependency installation, tests, and production build

The workflow is defined in `.github/workflows/ci.yml`. Configure the `Backend`
and `Frontend` jobs as required status checks in the GitHub branch-protection
settings before enforcing pull-request merges.

## Documentation

| Area | Reference | Contents |
| --- | --- | --- |
| Assignment | [Probeaufgabe notes](docs/probeaufgabe.md) | Requirement coverage, effort estimate, task feedback, CRUD and hosting concepts |
| Backend | [Database setup](backend/docs/database-setup.md) | PostgreSQL/PostGIS schema, migrations, seed data and local setup |
| Backend | [Station import](backend/docs/station-import.md) | ArcGIS synchronization, validation, freshness and import tracking |
| Backend | [Station API](backend/docs/station-api.md) | Endpoint parameters, responses, validation and geographic queries |
| Backend | [Logging](backend/docs/logging.md) | Structured request logs, request IDs and configuration |
| Frontend | [Frontend overview](frontend/README.md) | Vue development and build commands |
| Frontend | [Station list](frontend/docs/station-list.md) | List components, UI states, styling and tests |
| Frontend | [Station filters](frontend/docs/station-filters.md) | Search, radius filtering, address/distance sorting and accessibility |
