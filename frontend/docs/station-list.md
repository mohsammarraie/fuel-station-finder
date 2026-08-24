# Station list

The first frontend feature loads active fuel stations from the backend and
displays them in a responsive list.

## Styling

Bootstrap 5 provides the responsive grid, cards, badges, alerts, buttons,
spinner, spacing, and typography utilities. `src/styles.scss` contains only the
small branded layer for colors, the hero, station markers, and subtle card
interaction. Bootstrap JavaScript and BootstrapVueNext are not included because
this feature does not use interactive Bootstrap widgets.

The semantic application palette lives in `src/styles/_colors.scss`. Component
styles access it through the `colors` namespace, keeping raw theme colors out of
layout rules.

## Local development

Run the backend on port `3000` and the frontend separately:

```bash
cd backend
npm run start
```

```bash
cd frontend
npm run dev
```

The Vite development server forwards requests beginning with `/api` to
`http://localhost:3000`. In a deployed same-origin setup, no additional
configuration is needed. Set `VITE_API_BASE_URL` at build time when the API is
hosted on a different origin.

## UI states

The station view handles four explicit states:

- Loading while the request is active
- Success with the station count and responsive station cards
- Empty when the API returns no active stations
- Error with a retry action

Requests are cancelled when the component is removed or a retry starts. Each
station card shows its source address. Coordinates remain in the typed station
model for radius filtering and potential map features but are not presented as
user-facing information. Distance appears only when the API supplies it.

The page uses semantic landmarks and lists, provides a skip link, announces
result changes to assistive technology, and exposes loading and error states
through live-region roles.

## Structure

- `src/api/stations.ts` defines the API contract and request function.
- `src/composables/useStations.ts` owns request lifecycle and view state.
- `src/components/AppHeader.vue` contains the static page introduction.
- `src/components/StationList.vue` renders station data.
- `src/App.vue` composes the page and renders the result states.
- `src/App.test.ts` tests behavior through accessible UI queries.
- `src/api/stations.test.ts` tests the HTTP boundary.

## Tests

Vitest runs tests in JSDOM. Vue Testing Library is used to exercise the UI from
a user's perspective, and `@testing-library/jest-dom` provides DOM assertions.

```bash
npm test
```
