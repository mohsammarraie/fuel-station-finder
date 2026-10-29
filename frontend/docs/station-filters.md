# Station filters

`StationFiltersComponent` uses a typed, non-nullable Angular reactive form. It offers:

- Street search, trimmed on submission and limited to 100 characters
- Ascending or descending address sorting
- Nearest or farthest sorting when location filtering is enabled
- Optional 2, 5, or 10 km radius filtering
- Editable latitude and longitude, with native input ranges and Angular validators
- Browser geolocation as a convenience for filling coordinates
- Reset to the complete station list

The component emits typed `apply` and `resetFilters` outputs. Search, sort, and position are submitted together. When the location switch is turned off, a selected distance order is restored to ascending address order. The location controls use a `fieldset`, and geolocation errors appear as alerts. The backend remains the final validator of query parameters.

`src/app/components/station-filters.spec.ts` verifies normalization, location submission, sorting fallback, and reset behavior.
