# Templates

`dynamic-app` is the base for the Dynamic Catalog tier: a standalone Vite + React + Firebase app
(one Firebase project per customer, no secrets in the repo). Each business type is a preset chosen
at build time with `VITE_VERTICAL` (see `manifest.json`).

The app source is added in a follow-up commit; this folder currently holds the manifest the platform
registry (`src/lib/dynamic-templates.ts`) is checked against.
