// Assembles a Cloudflare Pages "advanced mode" bundle from the OpenNext output.
// Run after `opennextjs-cloudflare build`. Result: ./pages-out
//   pages-out/            static assets (from .open-next/assets)
//   pages-out/_worker.js  the whole Next server, bundled into one file by wrangler
import { execFileSync } from "node:child_process";
import { cpSync, copyFileSync, mkdirSync, rmSync, existsSync, statSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const out = "pages-out";
const tmp = ".pages-bundle";

if (!existsSync(".open-next/worker.js")) {
  console.error("Missing .open-next/worker.js - run `npx opennextjs-cloudflare build` first.");
  process.exit(1);
}

rmSync(out, { recursive: true, force: true });
rmSync(tmp, { recursive: true, force: true });

execFileSync("npx", ["wrangler", "deploy", "--dry-run", "--outdir", tmp], { stdio: "inherit" });

mkdirSync(out, { recursive: true });
cpSync(".open-next/assets", out, { recursive: true });
copyFileSync(`${tmp}/worker.js`, `${out}/_worker.js`);
rmSync(tmp, { recursive: true, force: true });

// ---- Customer sites -------------------------------------------------------
// Published sites are committed to sites/<slug>/ in this repo (see src/lib/publish/github.ts)
// and served from the root of the deployment: sites/cafe/index.html -> /cafe/.
if (existsSync("sites")) {
  for (const e of readdirSync("sites", { withFileTypes: true })) {
    if (!e.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/.test(e.name)) continue;
    if (existsSync(`${out}/${e.name}`)) {
      console.error(`Skipping sites/${e.name}: collides with an app file or route.`);
      continue;
    }
    cpSync(`sites/${e.name}`, `${out}/${e.name}`, { recursive: true });
  }
}

// One stable stylesheet for every published page. The app's own CSS file has a hashed name that
// changes each build, so published HTML (which is not rebuilt) links to this fixed path instead.
// Turbopack emits CSS under _next/static/chunks, webpack under _next/static/css: scan the whole tree.
const cssFiles = [];
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith(".css")) cssFiles.push(p);
  }
};
walk(`${out}/_next/static`);
const css = cssFiles.sort().map((f) => readFileSync(f, "utf8")).join("\n");
if (!css) {
  console.error("No compiled CSS found; published sites would be unstyled.");
  process.exit(1);
}
mkdirSync(`${out}/_site`, { recursive: true });
writeFileSync(`${out}/_site/site.css`, css);

// Branded 404 for unknown addresses (Pages serves /404.html itself for paths the worker does not own).
writeFileSync(
  `${out}/404.html`,
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Not found</title><link rel="stylesheet" href="/_site/site.css"></head><body class="bg-white text-ink"><main class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center"><h1 class="text-3xl font-semibold">This page does not exist</h1><p class="text-ink/70">The address may be mistyped, or the site is no longer published.</p><a class="font-semibold text-cobalt" href="/">Go to WebSide</a></main></body></html>`,
);

// ---- sitemap.xml + robots.txt for the published sites ---------------------------------------
const origin = (process.env.PUBLIC_SITES_ORIGIN || "https://web-side.pages.dev").replace(/\/+$/, "");
const siteUrls = [];
const collect = (dir, rel) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) collect(`${dir}/${e.name}`, `${rel}${e.name}/`);
    else if (e.name === "index.html") siteUrls.push(`${origin}/${rel}`);
  }
};
if (existsSync("sites")) {
  for (const e of readdirSync("sites", { withFileTypes: true })) {
    if (e.isDirectory() && existsSync(`${out}/${e.name}/index.html`)) collect(`${out}/${e.name}`, `${e.name}/`);
  }
}
siteUrls.sort();
writeFileSync(
  `${out}/sitemap.xml`,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${siteUrls
    .map((u) => `  <url><loc>${u}</loc></url>`)
    .join("\n")}\n</urlset>\n`,
);
if (!existsSync(`${out}/robots.txt`)) {
  writeFileSync(`${out}/robots.txt`, `User-agent: *\nAllow: /\nDisallow: /sudo\nDisallow: /dashboard\n\nSitemap: ${origin}/sitemap.xml\n`);
}
console.log(`sitemap.xml: ${siteUrls.length} URL(s)`);

// ---- Routing ---------------------------------------------------------------
// Pages sends a request to _worker.js only if it matches "include" (max 100 rules in total).
// An include-list of the app's own routes scales to any number of customer sites; excluding every
// static file/folder would hit the 100-rule cap after ~90 sites.
const include = [
  "/",
  "/login",
  "/signup",
  "/dashboard",
  "/dashboard/*",
  "/sudo",
  "/sudo/*",
  "/manifest.webmanifest",
  "/_next/image",
  "/_next/data/*",
];
writeFileSync(`${out}/_routes.json`, JSON.stringify({ version: 1, include, exclude: [] }, null, 2));
console.log("_routes.json include:", include.join(", "));

console.log(`pages-out/_worker.js: ${(statSync(`${out}/_worker.js`).size / 1e6).toFixed(1)} MB`);
