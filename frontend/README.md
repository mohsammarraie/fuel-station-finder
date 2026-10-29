# Fuel Station Finder frontend

Angular 22 and TypeScript application for browsing fuel stations in Cologne. It uses standalone components, signal inputs and outputs, built-in template control flow, reactive forms, `HttpClient`, RxJS, and Bootstrap 5 with a small SCSS theme. Angular Material is intentionally absent: Bootstrap already supplies the simple controls and branded layout needed here.

## Requirements and development

Use Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`. The repository's `.nvmrc` pins Node 24.22.2; run `nvm use` from the repository root to select it. Start the backend on port 3000, then:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:4200`. The Angular dev server forwards `/api` to `http://localhost:3000` through `proxy.conf.json`. The production build uses same-origin `/api/stations`; if the API is hosted elsewhere, configure your host's reverse proxy or change the URL in `StationApiService` for that deployment.

## Checks and deployment

```bash
npm test
npm run build
```

The Angular CLI uses Vitest and JSDOM for component and HTTP tests. Publish `dist/browser` as a static site, with a fallback to `index.html` for any future client routes. No client routes are used currently.

## Where to learn the Angular patterns

See [Angular migration and learning notes](docs/angular-migration.md) for a guided tour. [Station list](docs/station-list.md) explains the request states and rendering; [station filters](docs/station-filters.md) explains form and location behavior.
