// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const { DatabaseSync } = createRequire(import.meta.url)("node:sqlite");
import { DbClient, type Db } from "./query";

function mem(): Db {
  const sql = new DatabaseSync(":memory:");
  sql.exec("PRAGMA foreign_keys = ON");
  sql.exec(readFileSync("db/schema.sql", "utf8"));
  return {
    async all(q, p = []) { return sql.prepare(q).all(...(p as never[])).map((r: object) => ({ ...r })); },
    async run(q, p = []) { return { changes: sql.prepare(q).all(...(p as never[])).length }; },
  };
}
const u = (db: Db, id: string, email: string) => db.run("INSERT INTO users (id,email,password_hash) VALUES (?,?,'x')", [id, email]);

describe("D1 data layer", () => {
  it("scopes rows per owner, blocks cross-site writes, keeps plan server-side", async () => {
    const db = mem();
    await u(db, "a", "a@x.com"); await u(db, "b", "b@x.com");
    const A = new DbClient({ db, user: { id: "a", email: "a@x.com" } });
    const B = new DbClient({ db, user: { id: "b", email: "b@x.com" } });
    const mk = await A.from("sites").insert({ name: "S", slug: "s1", owner_id: "b", plan: "dynamic" }).select().single();
    expect(mk.error).toBeNull();
    expect(mk.data.owner_id).toBe("a");
    expect(mk.data.plan).toBe("menu");
    expect((await A.from("sites").insert({ name: "S", slug: "s1" })).error?.code).toBe("23505");
    expect((await B.from("sites").select("*")).data).toHaveLength(0);
    const pg = await A.from("pages").insert({ site_id: mk.data.id, key: "home", path: "/", title: "H", blocks: [{ kind: "menu" }] }).select().single();
    expect(pg.data.blocks).toEqual([{ kind: "menu" }]);
    expect((await B.from("pages").insert({ site_id: mk.data.id, key: "x", path: "/x" })).error).not.toBeNull();
    expect((await B.from("pages").update({ title: "hack" }).eq("id", pg.data.id).select("id")).data).toHaveLength(0);
    expect((await A.from("sites").update({ plan: "dynamic" }).eq("id", mk.data.id)).error?.message).toMatch(/platform team/);
    const cnt = await A.from("pages").select("id", { count: "exact", head: true }).eq("site_id", mk.data.id);
    expect(cnt.count).toBe(1);
    expect((await A.rpc("sudo_set_site_plan", { p_site_id: mk.data.id, p_plan: "dynamic" })).error).not.toBeNull();
  });

  it("sudo can read everything and run the review RPCs", async () => {
    const db = mem();
    await u(db, "a", "a@x.com"); await u(db, "s", "boss@x.com");
    await db.run("UPDATE settings SET value=? WHERE key='sudo_admin_emails'", ['["Boss@x.com"]']);
    const A = new DbClient({ db, user: { id: "a", email: "a@x.com" } });
    const S = new DbClient({ db, user: { id: "s", email: "boss@x.com" } });
    const site = (await A.from("sites").insert({ name: "S", slug: "s1" }).select().single()).data;
    const rev = (await A.from("revisions").insert({ site_id: site.id, number: 1, pages: {}, content_hash: "h" }).select().single()).data;
    const sub = (await A.from("submissions").insert({ site_id: site.id, revision_id: rev.id }).select().single()).data;
    const rev2 = (await A.from("revisions").insert({ site_id: site.id, number: 2, pages: {}, content_hash: "h2" }).select().single()).data;
    expect((await A.from("submissions").insert({ site_id: site.id, revision_id: rev2.id })).error?.message).toMatch(/open submission/);
    expect((await S.from("sites").select("*")).data).toHaveLength(1);
    expect((await A.rpc("sudo_set_submission_status", { p_submission_id: sub.id, p_status: "approved" })).error).not.toBeNull();
    const ok = await S.rpc("sudo_set_submission_status", { p_submission_id: sub.id, p_status: "approved", p_owner_notes: "ok" });
    expect(ok.data.status).toBe("approved");
    expect((await S.rpc("sudo_record_publication", { p_site_id: site.id, p_submission_id: sub.id, p_url: "https://a.b/s1" })).error).toBeNull();
    expect((await S.from("audit_logs").select("*")).data.length).toBe(2);
    expect((await A.from("audit_logs").select("*")).data).toHaveLength(0);
    expect((await A.from("settings").select("key, value")).data.map((r: { key: string }) => r.key)).toEqual(["instapay_link"]);
  });
});
