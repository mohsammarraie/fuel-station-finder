# Station Import Reference

This document explains the live-data synchronization.

## Purpose

The importer downloads the official Cologne fuel-station dataset and keeps the
local PostgreSQL/PostGIS database synchronized with it.

It is designed to prevent incomplete or malformed upstream responses from
damaging existing local data.

## Source

Dataset page:

<https://offenedaten-koeln.de/dataset/tankstellen-koeln>

ArcGIS query endpoint:

```text
https://geoportal.stadt-koeln.de/arcgis/rest/services/verkehr/gefahrgutstrecken/MapServer/0/query
```

The importer adds these query parameters:

| Parameter | Value | Purpose |
| --- | --- | --- |
| `where` | `objectid is not null` | Select records with a source ID |
| `outFields` | `objectid,adresse` | Request only required attributes |
| `returnGeometry` | `true` | Include station coordinates |
| `outSR` | `4326` | Return longitude and latitude |
| `orderByFields` | `objectid ASC` | Make pagination deterministic |
| `resultOffset` | Page offset | Request the next page |
| `resultRecordCount` | Configured page size | Bound each response |
| `f` | `json` | Request JSON |

## Configuration

The backend supports:

```env
STATION_SOURCE_URL=https://geoportal.stadt-koeln.de/arcgis/rest/services/verkehr/gefahrgutstrecken/MapServer/0/query
STATION_IMPORT_PAGE_SIZE=500
```

The page size must be an integer from 1 to 5000. The source URL has a safe
default but remains configurable in case the portal changes its endpoint.

## Running the importer

Apply all migrations first:

```bash
cd backend
npm run db:migrate
```

Run the TypeScript importer during development:

```bash
npm run stations:import
```

After building the backend, run the compiled production job with:

```bash
npm run stations:import:prod
```

A successful run writes a structured summary such as:

```json
{
  "level": 30,
  "runId": "…",
  "fetchedCount": 122,
  "upsertedCount": 122,
  "deactivatedCount": 0,
  "msg": "Station import succeeded"
}
```

## Processing flow

```text
Acquire import advisory lock
            |
Create running import record
            |
Fetch all ArcGIS pages
            |
Validate every response and record
            |
Reject empty or incomplete data
            |
Begin database transaction
            |
Upsert all downloaded stations
            |
Deactivate records not seen in this complete run
            |
Mark import successful and commit
            |
Release lock
```

If fetching, validation, or database synchronization fails, the importer records
the failure and does not deactivate existing stations.

## Response validation

Zod validates the external response before database changes begin. Each feature
must contain:

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

Validation requires:

- A positive integer `objectid`
- A non-empty address
- Longitude from -180 to 180
- Latitude from -90 to 90
- No duplicate object IDs across pages

ArcGIS error objects and non-successful HTTP responses are reported as failed
imports.

## Pagination safeguards

The importer follows `exceededTransferLimit` when ArcGIS supplies it. Otherwise,
a full page causes the importer to request the next page.

Additional protections include:

- Stable ordering by `objectid`
- A maximum of 1000 pages
- A 30-second timeout per request
- Rejection when another page is advertised but contains no records
- Cancellation when the complete source contains zero stations

## Database synchronization

Stations are matched using the unique `external_id` column.

For every source record, the importer:

1. Inserts it if the external ID is new.
2. Updates its address and location if it already exists.
3. Sets `is_active` to `true`.
4. Sets `last_seen_at` to the current synchronization timestamp.

After every downloaded station has been processed, previously active stations
whose `last_seen_at` is older than the current run are set to inactive.

Records are not immediately deleted. Soft deactivation is safer because it:

- Preserves history
- Allows temporary source removals to be reviewed
- Makes reactivation automatic if a station returns
- Supports a future CRUD or audit interface

All upserts, deactivations, and the success record are committed in one database
transaction.

## Import tracking

Migration 2 creates `station_import_runs`:

| Column | Purpose |
| --- | --- |
| `id` | Import-run identity |
| `status` | `running`, `succeeded`, or `failed` |
| `source_url` | Endpoint used by the run |
| `started_at` | Start time |
| `completed_at` | Success or failure time |
| `fetched_count` | Validated source records |
| `upserted_count` | Records processed by the upsert |
| `deactivated_count` | Missing records made inactive |
| `error_message` | Truncated failure explanation |

This history provides basic operational visibility and can later back a health
endpoint or administration screen.

## Concurrency

The importer uses a PostgreSQL advisory lock derived from:

```text
fuel-station-finder:station-import
```

If multiple schedulers start the job simultaneously, only one import can modify
the database at a time.

## Freshness strategy

The command provides the synchronization mechanism. In production, a scheduler
should invoke it periodically. A daily schedule is a reasonable default because
the public dataset does not state a dependable update interval.

Possible schedulers include:

- A hosting-provider cron job
- GitHub Actions on a schedule, if it can reach the hosted database securely
- Kubernetes CronJob
- AWS EventBridge Scheduler
- A dedicated worker process

Database credentials should be stored as platform secrets rather than in the
repository.

## Tests and verification

Unit tests cover:

- Multi-page ArcGIS responses
- Mapping source fields to the internal input model
- EPSG:4326 query configuration
- Invalid record rejection
- ArcGIS error reporting

The implementation was also verified against the real endpoint and local
PostGIS database:

```text
First run:  122 fetched, 122 upserted, 0 deactivated
Second run: 122 fetched, 122 upserted, 0 deactivated
Final table: 122 total, 122 active, 122 unique external IDs
```

The Express station endpoint reads these synchronized records and supports
street search, address sorting, radius filters, and nearest or farthest distance
sorting.
