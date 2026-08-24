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

## Backend checks

```bash
cd backend
npm test
npm run build
```
