# Station API Reference

This document describes the station-list endpoint.

## Endpoint

```http
GET /api/stations
```

The endpoint always returns active stations. Query parameters can optionally add
street searching, address or distance sorting, and geographic radius filtering.

## Query parameters

| Parameter | Required | Values | Purpose |
| --- | --- | --- | --- |
| `search` | No | Up to 100 characters | Case-insensitive partial address search |
| `sort` | No | `asc`, `desc`, `nearest`, `farthest` | Address or distance order; defaults to `asc` |
| `lat` | As a location group | -90 to 90 | Search-centre latitude |
| `lng` | As a location group | -180 to 180 | Search-centre longitude |
| `radius` | As a location group | `2`, `5`, `10` | Radius in kilometres |

`lat`, `lng`, and `radius` must either all be present or all be omitted.
`nearest` and `farthest` require all three location parameters because distance
needs a reference position. Equal distances are ordered by address and then by
station ID so the result order remains stable.

Unknown query parameters are rejected so misspellings cannot silently change
the meaning of a request.

## Examples

### All active stations

```http
GET /api/stations
```

### Search by street text

```http
GET /api/stations?search=Bonner
```

The search is case-insensitive and matches text anywhere in the complete
address.

### Descending address order

```http
GET /api/stations?sort=desc
```

### Stations within 5 kilometres

```http
GET /api/stations?lat=50.94&lng=6.96&radius=5
```

### Nearest stations first

```http
GET /api/stations?lat=50.94&lng=6.96&radius=5&sort=nearest
```

Use `sort=farthest` with the same location parameters to return the farthest
stations inside the selected radius first.

### Combined filters

```http
GET /api/stations?search=Bonner&sort=asc&lat=50.94&lng=6.96&radius=10
```

## Success response

```json
{
  "data": [
    {
      "id": 2,
      "externalId": 98,
      "address": "Bonner Str. 98 (50677 Neustadt/Süd)",
      "latitude": 50.916095041454554,
      "longitude": 6.960644911005172,
      "distanceKm": 2.671
    }
  ],
  "meta": {
    "count": 1
  }
}
```

`distanceKm` is:

- `null` when no location filter was requested
- The PostGIS-calculated distance, rounded to three decimal places, when a
  location filter was requested

## Validation errors

Invalid query parameters return HTTP 400:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "The station query parameters are invalid.",
    "details": [
      {
        "field": "location",
        "message": "lat, lng, and radius must be provided together."
      }
    ]
  }
}
```

Examples of rejected requests include:

```http
GET /api/stations?radius=5
GET /api/stations?lat=91&lng=6.96&radius=5
GET /api/stations?lat=50.94&lng=6.96&radius=3
GET /api/stations?sort=random
GET /api/stations?sort=nearest
GET /api/stations?serach=Bonner
```

The final example contains a misspelled parameter and is deliberately rejected.

## Not-found and server errors

Unknown routes return HTTP 404 with code `NOT_FOUND`.

Unexpected database or server errors return HTTP 500 with code
`INTERNAL_SERVER_ERROR`. Internal error details are logged on the server and are
not exposed to API clients.

## Database query behavior

The repository creates parameterized SQL. User-provided values are never
concatenated directly into the query.

The query always includes:

```sql
is_active = TRUE
```

Street searching uses:

```sql
lower(address) LIKE lower($1)
```

Special SQL wildcard characters in the user input are escaped. The expression
matches the existing `lower(address)` trigram index.

Radius filtering uses:

```sql
ST_DWithin(location, search_point, radius_in_metres)
```

Distance reporting uses:

```sql
ST_Distance(location, search_point) / 1000.0
```

Because both values are PostGIS geography objects, distances are calculated in
metres over the earth rather than as flat longitude/latitude differences. The
GiST location index supports the radius predicate.

Only a validated sort option is used to select a fixed SQL ordering clause.
Distance sorting uses the calculated `distance_km` result, while address and
distance ties have deterministic fallback fields. All search, coordinate, and
radius values remain query parameters.

## Response design

The API exposes only fields needed by the frontend. It does not expose internal
fields such as:

- `is_active`
- `last_seen_at`
- `created_at`
- `updated_at`

The response wrapper provides a stable place for metadata without changing the
station array itself.

## Verification

Automated tests cover:

- Default query values
- Combined-filter parsing
- Partial-location rejection
- Unsupported-radius rejection
- Parameterized PostGIS SQL generation
- SQL wildcard escaping
- Ascending and descending address ordering
- Nearest and farthest distance ordering
- Controller success responses
- Structured validation errors

The compiled endpoint was also verified against the local database populated by
the real ArcGIS import:

```text
All active stations:             122
Search for "Bonner":              2
Stations within 2 km of example: 11
Invalid partial/radius request:  HTTP 400
```
