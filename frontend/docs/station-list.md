# Station list

`App` composes the page from `AppHeader`, `StationFiltersComponent`, and `StationList`. The list receives typed station data through a required signal input. The template uses Angular's `@switch`, `@if`, and `@for (...; track station.id)` syntax, with a stable ID for efficient updates.

`StationStore` owns the last applied filters and exposes one signal containing four explicit states: loading, success, empty, and error. It also derives the screen-reader result announcement with `computed`. The store maps the request stream with RxJS `switchMap`, so a newer filter submission or retry cancels an older HTTP request. Retrying repeats the last applied filters.

`StationApiService` uses Angular `HttpClient` and immutable `HttpParams` to call the existing `/api/stations` endpoint. It sends the location parameters together and leaves the backend API unchanged. Coordinates remain in the model but are not displayed. A distance badge appears only when the API returns a distance.

The page retains the skip link, semantic landmarks and list, loading status, error alert, and polite result announcement. Bootstrap provides the responsive layout and controls; `src/styles.scss` and `src/styles/_colors.scss` provide the brand colors and small visual details.

Tests in `src/app/app.spec.ts` exercise loading, success, empty, retry, and cancellation through Angular's `HttpTestingController`. `src/app/stations/station-api.service.spec.ts` checks the HTTP query contract.
