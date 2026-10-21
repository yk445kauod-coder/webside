# Automated publishing

SUDO → approve a version → **Publish to WebSide hosting**. The server renders the approved revision to static HTML (same `BlockView` as the editor), commits it to `sites/<slug>/` through the GitHub Git Data API, and records `https://web-side.pages.dev/<slug>/`. The deploy workflow copies `sites/*` to the root of the Pages bundle (`scripts/build-pages.mjs`) and serves one stable stylesheet at `/_site/site.css`.

Server-only environment variables (Cloudflare Pages → Settings → Variables and secrets; never commit them):

- `GITHUB_PUBLISH_TOKEN` — fine-grained PAT, **this repo only**, Contents: read & write.
- `GITHUB_PUBLISH_REPO` (optional, default `yk445kauod-coder/webside`), `GITHUB_PUBLISH_BRANCH` (default `master`), `PUBLIC_SITES_ORIGIN` (default `https://web-side.pages.dev`).

Reserved addresses live in `src/lib/publish/slug.ts`. Pages `_routes.json` is an include-list of app routes, so any number of site folders works.
