// Applies db/schema.sql (idempotent) and the sudo admin list to Turso over HTTP.
import { readFileSync } from "node:fs";
const url = (process.env.TURSO_URL || "").replace(/^libsql:\/\//, "https://").replace(/\/$/, "");
const token = process.env.TURSO_TOKEN;
if (!url || !token) { console.error("TURSO_URL / TURSO_TOKEN missing"); process.exit(1); }
const stmts = readFileSync("db/schema.sql", "utf8").split(/;\s*\n/).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
const emails = (process.env.SUDO_ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
const reqs = stmts.map((sql) => ({ type: "execute", stmt: { sql } }));
if (emails.length) reqs.push({ type: "execute", stmt: { sql: "UPDATE settings SET value = ? WHERE key = 'sudo_admin_emails'", args: [{ type: "text", value: JSON.stringify(emails) }] } });
reqs.push({ type: "close" });
const res = await fetch(`${url}/v2/pipeline`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ requests: reqs }) });
const j = await res.json();
const bad = (j.results || []).find((r) => r.type === "error");
if (!res.ok || bad) { console.error("Schema failed:", JSON.stringify(bad || j)); process.exit(1); }
console.log(`Applied ${stmts.length} statements`);
