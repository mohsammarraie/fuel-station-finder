# Fuel Station Finder frontend

Vue 3 and TypeScript frontend for browsing fuel stations in Cologne, styled
with Bootstrap 5 and a small custom SCSS layer.

## Development

Start the backend on port `3000`, then run:

```bash
npm install
npm run dev
```

Vite proxies `/api` requests to the backend during development.

## Checks

```bash
npm test
npm run build
```

See [`docs/station-list.md`](docs/station-list.md) for the current feature
contract and project structure.
