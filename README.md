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
`backend/src/database/docs/station-import.md` for details.

## Backend checks

```bash
cd backend
npm test
npm run build
```

## Continuous integration

GitHub Actions runs the following checks for every pull request targeting
`main`, and again after changes are pushed to `main`:

- Backend dependency installation, tests, and TypeScript build
- Database migration and repeatability check against PostGIS
- Example-data seed and repeatability check
- Frontend dependency installation and production build

The workflow is defined in `.github/workflows/ci.yml`. Configure the `Backend`
and `Frontend` jobs as required status checks in the GitHub branch-protection
settings before enforcing pull-request merges.
