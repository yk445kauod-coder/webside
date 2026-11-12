import { describe, expect, it } from "vitest";
import { renderSite } from "./render";
import { makeTemplateBlock } from "@/lib/template-site";
import type { SiteSnapshot } from "@/lib/types/blocks";

describe("renderSite with a ready-made template page", () => {
  it("publishes the template's own HTML with the customer's text and no promo bar", () => {
    const block = makeTemplateBlock("cafe", { 5: "Cairo Beans" }, {}, "rtl");
    const pages = { home: { title: "Home", path: "/", blocks: [block] } } as unknown as SiteSnapshot;
    const r = renderSite("cairo-beans", "Cairo Beans", pages);
    expect("files" in r).toBe(true);
    if (!("files" in r)) return;
    expect(r.files).toHaveLength(1);
    expect(r.files[0].path).toBe("sites/cairo-beans/index.html");
    expect(r.files[0].content).toContain("Cairo Beans");
    expect(r.files[0].content).toContain('dir="rtl"');
    expect(r.files[0].content).not.toContain("template-bar");
    expect(r.files[0].content).not.toContain('"Free HTML Templates"');
    expect(r.files[0].content).not.toContain("data-ws-t");
  });
});
