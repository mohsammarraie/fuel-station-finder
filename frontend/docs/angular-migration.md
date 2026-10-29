# Angular migration and learning notes

This migration replaces the Vue/Vite frontend with a standard Angular 22 CLI application. The backend API, German copy, page design, filters, geolocation, and four request states are preserved. The frontend uses the Angular CLI build and test builders; production static files are in `dist/browser`.

## Follow one request

1. `StationFiltersComponent` holds editable values in a typed reactive form. Submitting emits `StationFilters` through Angular's `output()` API.
2. `App` passes those filters to `StationStore`. The store remembers them so Retry can repeat the same request.
3. The store's RxJS `switchMap` replaces the prior request when new filters arrive. `HttpClient` cancels the underlying request on unsubscription.
4. `StationApiService` builds query parameters with `HttpParams` and returns an `Observable<StationListResponse>`.
5. The store converts the request stream to a signal with `toSignal()`. The template reads the signal and renders loading, success, empty, or error with `@switch`.

## Modern Angular features in this code

| Feature | Example | Why it is here |
| --- | --- | --- |
| Standalone components | `App`, `StationList` | Components import what their templates use; no NgModule is needed. |
| Function-based dependency injection | `inject(StationStore)` | Keeps dependencies explicit without constructor boilerplate. |
| Signal inputs and outputs | `input.required()` and `output()` | Typed component boundaries with Angular's current APIs. |
| Signals and derived state | `toSignal()` and `computed()` | Templates read synchronous state; the announcement is derived rather than stored twice. |
| Built-in control flow | `@if`, `@for`, `@switch` | Clear conditional and list rendering; `track station.id` gives each row stable identity. |
| Typed reactive forms | `FormBuilder.nonNullable` | Form values and validation are modeled together, including numeric coordinates. |
| RxJS request pipeline | `Subject`, `switchMap`, `catchError` | Handles async HTTP, cancellation, and failures where a stream is useful. |
| Functional HTTP setup | `provideHttpClient()` | Registers `HttpClient` in the application configuration. |
| Angular HTTP tests | `provideHttpClientTesting()` | Verifies request URLs and responses without a running backend. |

RxJS is limited to the asynchronous request lifecycle and form value changes. Local UI flags, such as geolocation progress, use signals. There is no global state library, router, or Material component layer because the app has one page and a small state surface.

## Files to explore

- `src/app/app.ts` and `src/app/app.html`: page composition and UI states
- `src/app/components/station-filters.ts` and `.html`: typed form, signal input, typed outputs
- `src/app/stations/station.store.ts`: signal and RxJS bridge
- `src/app/stations/station-api.service.ts`: typed HTTP boundary
- `src/app/app.spec.ts`: UI and cancellation tests

Run `npm test` and `npm run build` from `frontend`. For a useful exercise, add a new sort option to the typed model, form, and API test, then trace how the backend validates it.
