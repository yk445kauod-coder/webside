import { cache } from "react";
import { cookies } from "next/headers";
import { DbClient, isSudoEmail, type Db, type DbUser, type Row } from "./query";

type TursoVal = { type: string; value?: string };

function toArg(v: unknown): TursoVal {
  if (v === null || v === undefined) return { type: "null" };
  if (typeof v === "boolean") return { type: "integer", value: v ? "1" : "0" };
  if (typeof v === "number") return Number.isInteger(v) ? { type: "integer", value: String(v) } : { type: "float", value: String(v) };
  return { type: "text", value: String(v) };
}
function fromVal(v: TursoVal): unknown {
  if (v.type === "null") return null;
  if (v.type === "integer" || v.type === "float") return Number(v.value);
  return v.value ?? null;
}

/** Turso (libSQL) over its HTTP API: free SQLite, works from Workers with plain fetch. */
function fromTurso(url: string, token: string): Db {
  const base = url.replace(/^libsql:\/\//, "https://").replace(/\/$/, "");
  async function exec(sql: string, params: unknown[]) {
    const res = await fetch(`${base}/v2/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql, args: params.map(toArg) } }, { type: "close" }] }),
    });
    const j = (await res.json()) as { results?: { type: string; response?: { result?: { cols: { name: string }[]; rows: TursoVal[][]; affected_row_count: number } }; error?: { message: string } }[]; error?: string };
    const r = j.results?.[0];
    if (!res.ok || !r || r.type === "error") throw new Error(r?.error?.message ?? j.error ?? `Database error ${res.status}`);
    return r.response!.result!;
  }
  return {
    async all(sql, params = []) {
      const r = await exec(sql, params);
      return r.rows.map((row) => Object.fromEntries(r.cols.map((c, i) => [c.name, fromVal(row[i])])) as Row);
    },
    async run(sql, params = []) {
      return { changes: (await exec(sql, params)).affected_row_count ?? 0 };
    },
  };
}

let devDb: Db | null = null;
/** Local development / tests only: a SQLite file via Node (set WS_SQLITE_PATH). Never bundled for the Worker. */
async function sqliteDev(path: string): Promise<Db> {
  if (devDb) return devDb;
  const mod = (await import(/* webpackIgnore: true */ /* @vite-ignore */ "node:" + "sqlite")) as { DatabaseSync: new (p: string) => { exec(s: string): void; prepare(s: string): { all(...p: unknown[]): Row[] } } };
  const fs = (await import(/* webpackIgnore: true */ /* @vite-ignore */ "node:" + "fs")) as typeof import("node:fs");
  const sql = new mod.DatabaseSync(path);
  sql.exec("PRAGMA foreign_keys = ON");
  sql.exec(fs.readFileSync("db/schema.sql", "utf8"));
  devDb = {
    async all(q, p = []) {
      return sql.prepare(q).all(...(p as never[])).map((r) => ({ ...r }));
    },
    async run(q, p = []) {
      const rows = sql.prepare(q).all(...(p as never[]));
      return { changes: rows.length };
    },
  };
  return devDb;
}

export async function getDb(): Promise<Db> {
  if (process.env.WS_SQLITE_PATH) return sqliteDev(process.env.WS_SQLITE_PATH);
  const url = process.env.TURSO_URL;
  const token = process.env.TURSO_TOKEN;
  if (!url || !token) throw new Error("Database is not configured: set TURSO_URL and TURSO_TOKEN.");
  return fromTurso(url, token);
}

export const SESSION_COOKIE = "ws_session";
export const SESSION_DAYS = 30;

const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
export const sha256 = async (s: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));

const envSudo = () => (process.env.SUDO_ADMIN_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** The signed-in user for this request (cookie → hashed session lookup), or null. */
export const currentUser = cache(async (): Promise<DbUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20) return null;
  const db = await getDb();
  const rows = await db.all(
    "SELECT u.id AS id, u.email AS email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > ?",
    [await sha256(token), new Date().toISOString()],
  );
  return rows[0] ? { id: String(rows[0].id), email: String(rows[0].email) } : null;
});

export async function clientFor(user: DbUser | null, admin = false) {
  return new DbClient({ db: await getDb(), user, admin, envSudo: envSudo() });
}

export async function userIsSudo(user: DbUser | null): Promise<boolean> {
  if (!user) return false;
  return isSudoEmail(await getDb(), user.email, envSudo());
}
