# Fuel Station Finder

Vue and Express application for finding fuel stations, backed by PostgreSQL and
PostGIS.

## Local database setup

Start PostgreSQL/PostGIS:

```bash
docker compose up -d database
```

Configure and migrate the backend:

```bash
cd backend
cp .env.example .env
npm run db:migrate
npm run db:seed
```

The migration is safe to run repeatedly. Applied versions are recorded in the
`schema_migrations` table. The seed is also repeatable and inserts ten
representative records from the City of Cologne's public fuel-station dataset.
Existing records with the same external ID are updated only when their source
data has changed.

## Import live station data

After applying the migrations, synchronize the complete official Cologne
dataset:

```bash
cd backend
npm run stations:import
```

The importer validates and paginates the ArcGIS response, upserts stations by
their external ID, records every import attempt, and deactivates missing records
only after a complete successful download. See
`backend/docs/station-import.md` for details.

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
npm run dev
```

Vite forwards `/api` requests to the backend. The frontend displays active
stations with loading, empty, and retryable error states. Street search,
address sorting, and optional 2/5/10-kilometre radius filtering are available
through the filter form. See `frontend/docs/station-list.md` and
`frontend/docs/station-filters.md` for details.

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
