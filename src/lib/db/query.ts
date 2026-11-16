// A small Supabase-shaped query builder over Cloudflare D1 (SQLite). Call sites keep using
// `.from(t).select().eq()...`, `.rpc()` and `.auth`, while storage is a free D1 database.
// Row-level security from the old Postgres setup is re-created in `scopeFor` and `guard`.
import { PLAN_LIMITS } from "@/lib/limits";

export type Row = Record<string, unknown>;
export interface Db {
  all(sql: string, params?: unknown[]): Promise<Row[]>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number }>;
}
export interface DbUser {
  id: string;
  email: string;
}
export interface DbError {
  message: string;
  code?: string;
}

interface Meta {
  cols: string[];
  json?: string[];
  bool?: string[];
  pk?: string;
  stamp?: boolean; // has updated_at
  uuid?: boolean;
}

const TABLES: Record<string, Meta> = {
  profiles: { cols: ["id", "email", "display_name", "created_at", "updated_at"], stamp: true },
  settings: { cols: ["key", "value", "description", "is_public", "updated_at", "updated_by"], json: ["value"], bool: ["is_public"], pk: "key", stamp: true },
  sites: { cols: ["id", "owner_id", "name", "slug", "description", "template_key", "plan", "created_at", "updated_at"], stamp: true, uuid: true },
  pages: { cols: ["id", "site_id", "key", "title", "path", "blocks", "created_at", "updated_at"], json: ["blocks"], stamp: true, uuid: true },
  revisions: { cols: ["id", "site_id", "number", "pages", "content_hash", "label", "created_by", "created_at"], json: ["pages"], uuid: true },
  submissions: {
    cols: ["id", "site_id", "revision_id", "status", "note", "owner_notes", "reviewed_by", "submitted_at", "reviewed_at", "payment_proof_path", "payment_method", "payment_amount_egp", "payment_reference"],
    uuid: true,
  },
  publications: { cols: ["id", "site_id", "submission_id", "url", "note", "recorded_by", "recorded_at"], uuid: true },
  audit_logs: { cols: ["id", "actor_id", "actor_role", "action", "entity", "entity_id", "metadata", "created_at"], json: ["metadata"] },
};

const SITE_CHILD = ["pages", "revisions", "submissions", "publications"];

export interface Ctx {
  db: Db;
  user: DbUser | null;
  /** Service-role style: no row scoping (server-only code). */
  admin?: boolean;
  /** Extra emails treated as SUDO (from the environment). */
  envSudo?: string[];
}

export async function isSudoEmail(db: Db, email: string | undefined, envSudo: string[] = []): Promise<boolean> {
  if (!email) return false;
  const e = email.toLowerCase();
  if (envSudo.map((x) => x.toLowerCase()).includes(e)) return true;
  const rows = await db.all("SELECT value FROM settings WHERE key='sudo_admin_emails'");
  try {
    const list = JSON.parse(String(rows[0]?.value ?? "[]")) as unknown;
    return Array.isArray(list) && list.some((x) => typeof x === "string" && x.toLowerCase() === e);
  } catch {
    return false;
  }
}

const fail = (message: string, code?: string): { data: null; error: DbError; count: null } => ({ data: null, error: { message, code }, count: null });

function decode(table: string, r: Row): Row {
  const m = TABLES[table];
  const o: Row = { ...r };
  for (const c of m.json ?? []) if (typeof o[c] === "string") {
    try { o[c] = JSON.parse(o[c] as string); } catch { /* keep raw */ }
  }
  for (const c of m.bool ?? []) if (c in o) o[c] = o[c] === 1 || o[c] === true;
  return o;
}

function encode(table: string, c: string, v: unknown): unknown {
  const m = TABLES[table];
  if (v === undefined) return null;
  if (m.json?.includes(c)) return JSON.stringify(v);
  if (m.bool?.includes(c)) return v ? 1 : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  return v;
}

type Filter = { col: string; op: "eq" | "in" | "neq"; val: unknown };
// Untyped like the previous client: call sites cast the rows they read.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Result<T = any> {
  data: T;
  error: DbError | null;
  count: number | null;
}

class Query<M extends "many" | "one" = "many"> implements PromiseLike<Result<M extends "many" ? any[] : any>> { // eslint-disable-line @typescript-eslint/no-explicit-any
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private cols = "*";
  private filters: Filter[] = [];
  private order_: { col: string; asc: boolean }[] = [];
  private limit_?: number;
  private mode: "many" | "single" | "maybe" = "many";
  private head = false;
  private wantCount = false;
  private payload: Row[] = [];
  private patch: Row = {};
  private returning = false;

  constructor(private ctx: Ctx, private table: string) {}

  select(cols = "*", opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") this.cols = cols;
    else {
      this.returning = true;
      this.cols = cols || "*";
    }
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.head = true;
    return this;
  }
  insert(v: Row | Row[]) { this.op = "insert"; this.payload = Array.isArray(v) ? v : [v]; return this; }
  upsert(v: Row | Row[]) { this.op = "upsert"; this.payload = Array.isArray(v) ? v : [v]; return this; }
  update(v: Row) { this.op = "update"; this.patch = v; return this; }
  delete() { this.op = "delete"; return this; }
  eq(col: string, val: unknown) { this.filters.push({ col, op: "eq", val }); return this; }
  neq(col: string, val: unknown) { this.filters.push({ col, op: "neq", val }); return this; }
  in(col: string, val: unknown[]) { this.filters.push({ col, op: "in", val }); return this; }
  order(col: string, o?: { ascending?: boolean }) { this.order_.push({ col, asc: o?.ascending !== false }); return this; }
  limit(n: number) { this.limit_ = n; return this; }
  single() { this.mode = "single"; return this as unknown as Query<"one">; }
  maybeSingle() { this.mode = "maybe"; return this as unknown as Query<"one">; }

  then<A = Result<M extends "many" ? any[] : any>, B = never>(ok?: ((v: Result<M extends "many" ? any[] : any>) => A | PromiseLike<A>) | null, no?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return (this.exec() as Promise<Result<M extends "many" ? any[] : any>>).then(ok, no);
  }

  private colOk(c: string) {
    return TABLES[this.table].cols.includes(c);
  }

  private async exec(): Promise<Result> {
    const m = TABLES[this.table];
    if (!m) return fail(`Unknown table ${this.table}`);
    const { ctx } = this;
    try {
      const sudo = ctx.admin || (await isSudoEmail(ctx.db, ctx.user?.email, ctx.envSudo));
      for (const f of this.filters) if (!this.colOk(f.col)) return fail(`Unknown column ${f.col}`);
      const write = this.op !== "select";
      const scope = ctx.admin ? null : scopeFor(this.table, ctx.user, sudo, write);
      if (scope === "deny") return write ? fail("Not allowed", "42501") : this.empty();

      const where: string[] = [];
      const params: unknown[] = [];
      for (const f of this.filters) {
        if (f.op === "in") {
          const arr = Array.isArray(f.val) ? f.val : [];
          if (!arr.length) where.push("0");
          else { where.push(`${f.col} IN (${arr.map(() => "?").join(",")})`); params.push(...arr.map((x) => encode(this.table, f.col, x))); }
        } else {
          where.push(`${f.col} ${f.op === "eq" ? "IS" : "IS NOT"} ?`);
          params.push(encode(this.table, f.col, f.val));
        }
      }
      if (scope) { where.push(`(${scope.sql})`); params.push(...scope.params); }
      const W = where.length ? ` WHERE ${where.join(" AND ")}` : "";

      if (this.op === "select") return this.read(W, params);
      if (this.op === "delete") {
        const rows = await ctx.db.all(`DELETE FROM ${this.table}${W} RETURNING *`, params);
        return this.shape(rows.map((r) => decode(this.table, r)));
      }
      if (this.op === "update") {
        const keys = Object.keys(this.patch).filter((k) => this.colOk(k));
        if (!keys.length) return this.shape([]);
        const before = this.table === "sites" || this.table === "pages" ? await ctx.db.all(`SELECT * FROM ${this.table}${W}`, params) : [];
        const err = await guard(ctx, this.table, "update", this.patch, sudo, before.map((r) => decode(this.table, r)));
        if (err) return fail(err.message, err.code);
        const sets = keys.map((k) => `${k}=?`);
        const vals = keys.map((k) => encode(this.table, k, this.patch[k]));
        if (m.stamp && !keys.includes("updated_at")) sets.push("updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')");
        const rows = await ctx.db.all(`UPDATE ${this.table} SET ${sets.join(",")}${W} RETURNING *`, [...vals, ...params]);
        return this.shape(rows.map((r) => decode(this.table, r)));
      }
      // insert / upsert
      const out: Row[] = [];
      for (const raw of this.payload) {
        const row: Row = { ...raw };
        if (m.uuid && !row.id) row.id = crypto.randomUUID();
        if (this.table === "sites" && !ctx.admin && ctx.user && !sudo) { row.owner_id = ctx.user.id; row.plan = "menu"; }
        const keys = Object.keys(row).filter((k) => this.colOk(k));
        const err = await guard(ctx, this.table, "insert", row, sudo, []);
        if (err) return fail(err.message, err.code);
        if (!ctx.admin) {
          const ok = await writeAllowed(ctx, this.table, row, sudo);
          if (!ok) return fail("new row violates row-level security policy", "42501");
        }
        let sql = `INSERT INTO ${this.table} (${keys.join(",")}) VALUES (${keys.map(() => "?").join(",")})`;
        if (this.op === "upsert") {
          const pk = m.pk ?? "id";
          const upd = keys.filter((k) => k !== pk).map((k) => `${k}=excluded.${k}`);
          if (m.stamp) upd.push("updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')");
          sql += ` ON CONFLICT(${pk}) DO ${upd.length ? `UPDATE SET ${upd.join(",")}` : "NOTHING"}`;
        }
        const rows = await ctx.db.all(`${sql} RETURNING *`, keys.map((k) => encode(this.table, k, row[k])));
        out.push(...rows.map((r) => decode(this.table, r)));
        const post = await afterInsert(ctx, this.table, row);
        if (post) return fail(post.message, post.code);
      }
      return this.shape(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/UNIQUE constraint failed/i.test(msg)) return fail(msg, "23505");
      if (/FOREIGN KEY/i.test(msg)) return fail(msg, "23503");
      return fail(msg);
    }
  }

  private empty(): Result {
    if (this.mode === "single") return fail("JSON object requested, multiple (or no) rows returned", "PGRST116");
    return { data: this.mode === "maybe" ? null : this.head ? null : [], error: null, count: this.wantCount ? 0 : null };
  }

  private project(rows: Row[]): Row[] {
    if (this.cols === "*" || !this.cols.trim()) return rows;
    const want = this.cols.split(",").map((c) => c.trim()).filter(Boolean);
    return rows.map((r) => Object.fromEntries(want.filter((c) => c in r).map((c) => [c, r[c]])));
  }

  private async read(W: string, params: unknown[]): Promise<Result> {
    const { db } = this.ctx;
    let count: number | null = null;
    if (this.wantCount) {
      const c = await db.all(`SELECT COUNT(*) AS c FROM ${this.table}${W}`, params);
      count = Number(c[0]?.c ?? 0);
      if (this.head) return { data: null, error: null, count };
    }
    let sql = `SELECT * FROM ${this.table}${W}`;
    const ord = this.order_.filter((o) => this.colOk(o.col));
    if (ord.length) sql += ` ORDER BY ${ord.map((o) => `${o.col} ${o.asc ? "ASC" : "DESC"}`).join(", ")}`;
    const lim = this.mode === "many" ? this.limit_ : 2;
    if (lim !== undefined) sql += ` LIMIT ${Math.max(0, Math.floor(lim))}`;
    const rows = this.project((await db.all(sql, params)).map((r) => decode(this.table, r)));
    const res = this.shape(rows);
    return { ...res, count };
  }

  private shape(rows: Row[]): Result {
    const r = this.project(rows);
    if (this.op !== "select" && !this.returning) return { data: null, error: null, count: null };
    if (this.mode === "single") {
      return r.length === 1 ? { data: r[0], error: null, count: null } : fail("JSON object requested, multiple (or no) rows returned", "PGRST116");
    }
    if (this.mode === "maybe") return r.length > 1 ? fail("multiple rows returned", "PGRST116") : { data: r[0] ?? null, error: null, count: null };
    return { data: r, error: null, count: null };
  }
}

/** The SQL that restricts a table to what this user may touch (the old RLS policies). */
function scopeFor(table: string, user: DbUser | null, sudo: boolean, write: boolean): { sql: string; params: unknown[] } | null | "deny" {
  if (table === "settings") {
    if (write) return sudo ? null : "deny";
    return sudo ? null : { sql: "is_public = 1", params: [] };
  }
  if (!user) return "deny";
  if (table === "audit_logs") return sudo && !write ? null : "deny";
  if (!write && sudo) return null;
  if (table === "profiles") return { sql: "id = ?", params: [user.id] };
  if (table === "sites") return { sql: "owner_id = ?", params: [user.id] };
  if (SITE_CHILD.includes(table)) {
    if (table === "publications" && write) return "deny";
    return { sql: "site_id IN (SELECT id FROM sites WHERE owner_id = ?)", params: [user.id] };
  }
  return "deny";
}

async function writeAllowed(ctx: Ctx, table: string, row: Row, sudo: boolean): Promise<boolean> {
  const u = ctx.user;
  if (table === "settings") return sudo;
  if (!u) return false;
  if (table === "profiles") return row.id === u.id;
  if (table === "sites") return row.owner_id === u.id;
  if (SITE_CHILD.includes(table)) {
    if (table === "publications" || typeof row.site_id !== "string") return false;
    const r = await ctx.db.all("SELECT 1 AS x FROM sites WHERE id = ? AND owner_id = ?", [row.site_id, u.id]);
    return r.length > 0;
  }
  return false;
}

/** Ports of the Postgres triggers: plan changes and plan limits. */
async function guard(ctx: Ctx, table: string, op: "insert" | "update", row: Row, sudo: boolean, before: Row[]): Promise<DbError | null> {
  if (ctx.admin) return null;
  if (table === "sites" && op === "update" && "plan" in row && !sudo) {
    return { message: "Only the platform team can change a plan." };
  }
  if (table === "pages") {
    const siteIds = op === "insert" ? [String(row.site_id)] : [...new Set(before.map((b) => String(b.site_id)))];
    for (const sid of siteIds) {
      const s = await ctx.db.all("SELECT plan FROM sites WHERE id = ?", [sid]);
      const lim = PLAN_LIMITS[(s[0]?.plan as keyof typeof PLAN_LIMITS) ?? "menu"] ?? PLAN_LIMITS.menu;
      if (op === "insert") {
        const c = await ctx.db.all("SELECT COUNT(*) AS c FROM pages WHERE site_id = ?", [sid]);
        if (Number(c[0]?.c) >= lim.pages) return { message: `Plan limit: your plan allows up to ${lim.pages} pages.` };
      }
      if ("blocks" in row) {
        const nb = Array.isArray(row.blocks) ? row.blocks.length : 0;
        const ob = op === "update" ? Math.max(0, ...before.map((b) => (Array.isArray(b.blocks) ? b.blocks.length : 0))) : 0;
        if (nb > lim.blocksPerPage && nb > ob) return { message: `Plan limit: your plan allows up to ${lim.blocksPerPage} blocks per page.` };
        const ni = menuItems(row.blocks);
        const oi = op === "update" ? Math.max(0, ...before.map((b) => menuItems(b.blocks))) : 0;
        if (ni > lim.menuItemsPerPage && ni > oi) return { message: `Plan limit: your plan allows up to ${lim.menuItemsPerPage} menu items per page.` };
      }
    }
  }
  if (table === "submissions" && op === "insert") {
    const open = await ctx.db.all("SELECT 1 AS x FROM submissions WHERE site_id = ? AND status IN ('submitted','under_review') AND id <> ?", [row.site_id, row.id]);
    if (open.length) return { message: "An open submission already exists for this site" };
  }
  return null;
}

async function afterInsert(ctx: Ctx, table: string, row: Row): Promise<DbError | null> {
  void ctx; void table; void row;
  return null;
}

export function menuItems(blocks: unknown): number {
  if (!Array.isArray(blocks)) return 0;
  let n = 0;
  for (const b of blocks) {
    const x = b as { kind?: string; categories?: { items?: unknown[] }[] };
    if (x?.kind === "menu" && Array.isArray(x.categories)) for (const c of x.categories) if (Array.isArray(c?.items)) n += c.items.length;
  }
  return n;
}

const audit = (ctx: Ctx, sudoUser: DbUser | null, action: string, entity: string, id: string, meta: unknown) =>
  ctx.db.run("INSERT INTO audit_logs (actor_id, actor_role, action, entity, entity_id, metadata) VALUES (?,?,?,?,?,?)", [sudoUser?.id ?? null, "sudo", action, entity, id, JSON.stringify(meta)]);

export class DbClient {
  constructor(private ctx: Ctx) {}
  from(table: string) { return new Query(this.ctx, table); }

  async rpc(name: string, args: Record<string, unknown> = {}): Promise<Result> {
    const { ctx } = this;
    try {
      const sudo = ctx.admin || (await isSudoEmail(ctx.db, ctx.user?.email, ctx.envSudo));
      if (name === "is_sudo") return { data: (await isSudoEmail(ctx.db, ctx.user?.email, ctx.envSudo)) as unknown as Row, error: null, count: null };
      if (!sudo) return fail("Not authorized");
      const u = ctx.user;
      if (name === "sudo_set_submission_status") {
        const id = String(args.p_submission_id);
        const status = String(args.p_status);
        const subs = await ctx.db.all("SELECT * FROM submissions WHERE id = ?", [id]);
        const sub = subs[0];
        if (!sub) return fail("Submission not found");
        const open = ["submitted", "under_review"];
        if (!open.includes(status) && !open.includes(String(sub.status))) return fail("Only open submissions can be approved or rejected");
        const notes = args.p_owner_notes == null ? sub.owner_notes : args.p_owner_notes;
        const decided = status === "approved" || status === "rejected";
        const rows = await ctx.db.all(
          `UPDATE submissions SET status=?, owner_notes=?, reviewed_by=COALESCE(?, reviewed_by), reviewed_at=${decided ? "strftime('%Y-%m-%dT%H:%M:%fZ','now')" : "reviewed_at"} WHERE id=? RETURNING *`,
          [status, notes ?? null, u?.id ?? null, id],
        );
        await audit(ctx, u, `submission.${status}`, "submission", id, { site_id: sub.site_id, revision_id: sub.revision_id, notes: args.p_owner_notes ?? null });
        return { data: rows[0] ?? null, error: null, count: null };
      }
      if (name === "sudo_record_publication") {
        const subs = await ctx.db.all("SELECT * FROM submissions WHERE id = ?", [String(args.p_submission_id)]);
        const sub = subs[0];
        if (!sub || sub.site_id !== args.p_site_id) return fail("Submission does not belong to this site");
        if (sub.status !== "approved") return fail("Only approved submissions can be published");
        if (!/^https?:\/\//.test(String(args.p_url))) return fail("Public URL must start with http:// or https://");
        const rows = await ctx.db.all("INSERT INTO publications (id, site_id, submission_id, url, note, recorded_by) VALUES (?,?,?,?,?,?) RETURNING *", [crypto.randomUUID(), args.p_site_id, args.p_submission_id, args.p_url, args.p_note ?? null, u?.id ?? null]);
        await audit(ctx, u, "publication.recorded", "site", String(args.p_site_id), { submission_id: args.p_submission_id, url: args.p_url, note: args.p_note ?? null });
        return { data: rows[0] ?? null, error: null, count: null };
      }
      if (name === "sudo_set_site_plan") {
        const s = await ctx.db.all("SELECT plan FROM sites WHERE id = ?", [String(args.p_site_id)]);
        if (!s[0]) return fail("Site not found");
        await ctx.db.run("UPDATE sites SET plan=?, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?", [args.p_plan, args.p_site_id]);
        await audit(ctx, u, "site.plan_changed", "site", String(args.p_site_id), { from: s[0].plan, to: args.p_plan });
        return { data: null, error: null, count: null };
      }
      if (name === "sudo_clear_payment_proof") {
        await ctx.db.run("UPDATE submissions SET payment_proof_path = NULL WHERE id = ?", [args.p_submission_id]);
        return { data: null, error: null, count: null };
      }
      return fail(`Unknown function ${name}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return fail(msg, /UNIQUE constraint/i.test(msg) ? "23505" : undefined);
    }
  }
}
