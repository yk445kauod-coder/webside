// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PLAN_LIMITS, SITE_PLANS, isSitePlan } from "./limits";

const sql = readFileSync("supabase/migrations/00005_plans_and_server_side_limits.sql", "utf8");

/** Reads `case p when 'menu' then 3 ...` out of a plan_max_* function. */
function fromSql(fn: string): Record<string, number> {
  const body = new RegExp(`function public\\.${fn}\\([^)]*\\)[\\s\\S]*?\\$\\$;`).exec(sql)?.[0] ?? "";
  const out: Record<string, number> = {};
  for (const m of body.matchAll(/when '(\w+)' then (\d+)/g)) out[m[1]] = Number(m[2]);
  return out;
}

describe("plan limits", () => {
  it("TypeScript mirrors the database functions", () => {
    const pages = fromSql("plan_max_pages");
    const blocks = fromSql("plan_max_blocks");
    const items = fromSql("plan_max_menu_items");
    for (const p of SITE_PLANS) {
      expect(pages[p], `pages ${p}`).toBe(PLAN_LIMITS[p].pages);
      expect(blocks[p], `blocks ${p}`).toBe(PLAN_LIMITS[p].blocksPerPage);
      expect(items[p], `items ${p}`).toBe(PLAN_LIMITS[p].menuItemsPerPage);
    }
  });
  it("matches the enum declared in the migration", () => {
    const enumValues = /create type public\.site_plan as enum \(([^)]*)\)/.exec(sql)?.[1] ?? "";
    expect([...enumValues.matchAll(/'(\w+)'/g)].map((m) => m[1])).toEqual(SITE_PLANS);
  });
  it("customers cannot pick plans: the migration guards inserts and updates", () => {
    expect(sql).toMatch(/new\.plan := 'menu'/);
    expect(sql).toMatch(/Only the platform team can change a plan/);
    expect(sql).toMatch(/sudo_set_site_plan[\s\S]*is_sudo\(\)/);
  });
  it("validates plan names", () => {
    expect(isSitePlan("business")).toBe(true);
    expect(isSitePlan("enterprise")).toBe(false);
    expect(isSitePlan(undefined)).toBe(false);
  });
});
