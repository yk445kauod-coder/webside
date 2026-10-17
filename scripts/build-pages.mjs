// Assembles a Cloudflare Pages "advanced mode" bundle from the OpenNext output.
// Run after `opennextjs-cloudflare build`. Result: ./pages-out
//   pages-out/            static assets (from .open-next/assets)
//   pages-out/_worker.js  the whole Next server, bundled into one file by wrangler
import { execFileSync } from "node:child_process";
import { cpSync, copyFileSync, mkdirSync, rmSync, existsSync, statSync } from "node:fs";

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

console.log(`pages-out/_worker.js: ${(statSync(`${out}/_worker.js`).size / 1e6).toFixed(1)} MB`);
