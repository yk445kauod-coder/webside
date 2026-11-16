import { cache } from "react";
import { cookies } from "next/headers";
import { DbClient, isSudoEmail, type Db, type DbUser, type Row } from "./query";

interface D1Stmt { bind(...v: unknown[]): D1Stmt; all(): Promise<{ results?: Row[] }>; run(): Promise<{ meta?: { changes?: number } }> }
interface D1 { prepare(sql: string): D1Stmt }

function fromD1(d: D1): Db {
  return {
    async all(sql, params = []) {
      return (await d.prepare(sql).bind(...params).all()).results ?? [];
    },
    async run(sql, params = []) {
      const r = await d.prepare(sql).bind(...params).run();
      return { changes: r.meta?.changes ?? 0 };
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
  const { getCloudflareContext } = await import("@opennextjs/cloudflare");
  const env = (await getCloudflareContext({ async: true })).env as { DB?: D1 };
  if (!env.DB) throw new Error("Database is not configured: the D1 binding `DB` is missing.");
  return fromD1(env.DB);
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
