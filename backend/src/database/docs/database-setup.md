# Database Setup Reference

This document explains the database foundation implemented on the
`feature/database-setup` branch of the Fuel Station Finder project.

## Scope

This feature provides:

- A local PostgreSQL database with PostGIS
- Environment-based database configuration
- A reusable PostgreSQL connection pool
- Versioned database migrations
- A spatially indexed `stations` table
- A TypeScript station model
- Repeatable example data
- Tests and setup documentation

It does **not** yet download the complete live dataset. Fetching and synchronizing
the official ArcGIS JSON endpoint belongs in the next `station-import` feature.

## Architecture

```text
Official Cologne ArcGIS endpoint
               |
               |  Future import/synchronization job
               v
       PostgreSQL + PostGIS
               |
               v
          Express backend
               |
               v
           Vue frontend
```

## Project files

```text
fuel-station-finder/
|-- backend/
|   |-- .env.example
|   |-- package.json
|   `-- src/
|       |-- database/
|       |   |-- client.ts
|       |   |-- migrate.ts
|       |   |-- seed.ts
|       |   |-- migrations/
|       |   |   |-- 001-create-stations.ts
|       |   |   `-- types.ts
|       |   `-- seeds/
|       |       `-- example-stations.ts
|       `-- models/
|           |-- station.ts
|           `-- station.test.ts
|-- docker-compose.yml
`-- README.md
```

## Technology choices

### PostgreSQL

PostgreSQL is the application's relational database. It provides constraints,
transactions, indexing, and reliable upserts for synchronizing external data.

### PostGIS

PostGIS adds geographic data types and queries to PostgreSQL. The application
needs to find stations within 2, 5, or 10 kilometres of an arbitrary position,
so performing the calculation in the database is appropriate.

Station coordinates are stored as:

```sql
GEOGRAPHY(POINT, 4326)
```

EPSG:4326 is the longitude/latitude coordinate system returned by the official
endpoint when `outSR=4326` is requested.

### pg_trgm

The PostgreSQL `pg_trgm` extension supports efficient partial address searches.
This is useful for searches such as `Bonner`, `Dürener`, or `Str.`.

## Local setup

### 1. Start the database

From the repository root:

```bash
docker compose up -d database
```

Check its status:

```bash
docker compose ps
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

The local defaults are:

```env
PORT=3000
DATABASE_URL=postgresql://fuel_station:fuel_station@localhost:5432/fuel_station_finder
DATABASE_SSL=false
```

Do not commit the real `.env` file. It may contain production credentials.

### 3. Apply migrations

```bash
npm run db:migrate
```

The migration runner records applied versions in `schema_migrations`. It is safe
to run this command repeatedly.

### 4. Insert example stations

```bash
npm run db:seed
```

The seed inserts 10 representative records from the official Cologne dataset.
It can be run repeatedly without creating duplicate external IDs.

### 5. Run backend checks

```bash
npm test
npm run build
```

## Available database commands

| Command | Purpose |
| --- | --- |
| `npm run db:migrate` | Apply pending migrations from TypeScript source |
| `npm run db:migrate:prod` | Apply compiled migrations in production |
| `npm run db:seed` | Insert or update local example data |
| `npm run db:seed:prod` | Run the compiled seed in production |
| `npm test` | Run backend unit tests |
| `npm run build` | Compile the TypeScript backend |

## Database connection

`backend/src/database/client.ts` manages a PostgreSQL connection pool.

It:

- Requires `DATABASE_URL`
- Reuses database connections
- Supports SSL when `DATABASE_SSL=true`
- Reports unexpected connection errors
- Provides a clean shutdown function for scripts

For a hosted database, the environment might look like:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE
DATABASE_SSL=true
```

Secrets should be configured in the hosting provider, not committed to Git.

## Migration system

`backend/src/database/migrate.ts` is a small versioned migration runner.

The execution flow is:

```text
Connect to PostgreSQL
        |
Acquire advisory lock
        |
Create schema_migrations if missing
        |
Read applied versions
        |
Run each pending migration in a transaction
        |
Record successful version
        |
Release lock and close connections
```

The advisory lock prevents two application instances from applying migrations
simultaneously. Each migration runs inside a transaction so a failure does not
leave a partially applied schema.

Future migrations should use increasing numbers, for example:

```text
001-create-stations.ts
002-create-import-runs.ts
003-add-station-active-status.ts
```

## Stations schema

The first migration creates this table:

```text
stations
|-- id
|-- external_id
|-- address
|-- location
|-- created_at
`-- updated_at
```

### Columns

| Column | Type | Purpose |
| --- | --- | --- |
| `id` | Integer identity | Internal application primary key |
| `external_id` | Integer, unique | `objectid` from the source system |
| `address` | Text | Complete source address |
| `location` | Geography point | Longitude and latitude in EPSG:4326 |
| `created_at` | Timestamp with timezone | Local creation time |
| `updated_at` | Timestamp with timezone | Last local update time |

The external `objectid` is deliberately not used as the primary key. Keeping an
internal ID gives the application control of its own identity model while the
unique external ID supports synchronization.

### Constraints

The database rejects:

- Duplicate external IDs
- Empty addresses
- Longitudes outside -180 to 180
- Latitudes outside -90 to 90

An update trigger automatically refreshes `updated_at` when a station changes.

### Indexes

| Index | Purpose |
| --- | --- |
| Primary-key index | Internal ID lookup |
| Unique external-ID index | Import upserts and source lookup |
| GiST location index | Radius and distance filtering |
| GIN address index | Partial, case-insensitive address searching |

## Source-data mapping

An official source record looks like:

```json
{
  "attributes": {
    "objectid": 98,
    "adresse": "Bonner Str. 98 (50677 Neustadt/Süd)"
  },
  "geometry": {
    "x": 6.960644911005172,
    "y": 50.916095041454554
  }
}
```

It maps to the database as follows:

| Source | Database |
| --- | --- |
| `attributes.objectid` | `external_id` |
| `attributes.adresse` | `address` |
| `geometry.x` | Longitude |
| `geometry.y` | Latitude |

PostGIS points must be constructed in longitude/latitude order:

```sql
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
```

Reversing the arguments would store an incorrect location.

## TypeScript model

The application model uses TypeScript-style property names:

```ts
interface Station {
  id: number;
  externalId: number;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: Date;
  updatedAt: Date;
}
```

The row mapper converts PostgreSQL names such as `external_id` and `created_at`
to `externalId` and `createdAt`. A unit test verifies the conversion.

## Example-data seed

The seed contains 10 geographically varied Cologne stations. Each insert uses:

```sql
ON CONFLICT (external_id) DO UPDATE
```

Its behaviour is:

- Insert stations that do not exist
- Update existing stations if their address or location changed
- Avoid duplicate external IDs
- Leave unrelated database records untouched
- Perform all changes in one transaction

The seed is useful for frontend and API development, but it is not a replacement
for the live synchronization job.

## Official data source

Dataset page:

<https://offenedaten-koeln.de/dataset/tankstellen-koeln>

Simplified JSON request:

```text
https://geoportal.stadt-koeln.de/arcgis/rest/services/verkehr/gefahrgutstrecken/MapServer/0/query?where=objectid%20is%20not%20null&outFields=*&returnGeometry=true&outSR=4326&f=json
```

The search-page URL provided with the assignment is a discovery page. The
backend importer should use the ArcGIS query endpoint rather than scraping the
HTML search page.

## Verification performed

The feature was checked by:

- Applying the migration to a real local PostGIS container
- Running the migration a second time
- Confirming that PostGIS and pg_trgm are enabled
- Confirming all expected indexes exist
- Inserting and rolling back a source-format station
- Running the seed twice
- Confirming 10 rows and 10 unique external IDs
- Reading longitude and latitude back from PostGIS
- Running the unit test
- Compiling the TypeScript backend

## Current limitations and next feature

The next feature should implement the live station importer. It should:

1. Fetch the official ArcGIS JSON endpoint.
2. Validate the response structure and each record.
3. Request EPSG:4326 coordinates with `outSR=4326`.
4. Handle ArcGIS pagination even though the current dataset is small.
5. Upsert stations by `external_id` in a transaction.
6. Track when synchronization started, completed, or failed.
7. Only deactivate missing stations after a complete successful download.
8. Run manually and on a configurable schedule.
9. Log imported, updated, skipped, and deactivated record counts.

After the importer, the following feature can add the station-list API with
address search, sorting, and 2/5/10-kilometre radius filters.

